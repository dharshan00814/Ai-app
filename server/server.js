const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "http://localhost:*", "https://*", "https://api.openai.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100000 // essentially unlimited for local use
});

// Middleware - CORS Configuration
const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5500',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500',
    'https://dharshan00814.github.io'
]);

const isAllowedLocalOrigin = (origin) => {
    if (!origin) return true;
    return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
};

const isAllowedHostedOrigin = (origin) => {
    if (!origin) return true;
    return /^https:\/\/[a-z0-9-]+\.github\.io$/i.test(origin);
};

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin) || isAllowedLocalOrigin(origin) || isAllowedHostedOrigin(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Apply limiter after CORS so error responses still include CORS headers.
// No rate limiting - system optimized for speed.
app.use('/api/', (req, res, next) => {
    return next();
});

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Error wrapper for async handlers
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '30000', 10);
const ALLOW_LOCAL_FALLBACK = String(process.env.ALLOW_LOCAL_FALLBACK || 'false').toLowerCase() === 'true';

const withTimeout = (promise, ms, label) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`${label} timed out after ${ms}ms`));
        }, ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

function postJson(urlString, payload, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        try {
            const target = new URL(urlString);
            const isHttps = target.protocol === 'https:';
            const transport = isHttps ? https : http;
            const body = JSON.stringify(payload || {});

            const req = transport.request(
                {
                    protocol: target.protocol,
                    hostname: target.hostname,
                    port: target.port || (isHttps ? 443 : 80),
                    path: `${target.pathname}${target.search || ''}`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(body)
                    },
                    timeout: timeoutMs
                },
                (res) => {
                    let raw = '';
                    res.setEncoding('utf8');
                    res.on('data', (chunk) => {
                        raw += chunk;
                    });
                    res.on('end', () => {
                        const statusCode = res.statusCode || 500;
                        if (statusCode < 200 || statusCode >= 300) {
                            return reject(new Error(`HTTP ${statusCode}: ${raw || 'Request failed'}`));
                        }

                        try {
                            resolve(raw ? JSON.parse(raw) : {});
                        } catch {
                            resolve({ response: raw });
                        }
                    });
                }
            );

            req.on('timeout', () => {
                req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        } catch (error) {
            reject(error);
        }
    });
}



// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    },
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit per file
});

// Check if API keys are configured
const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0;
const hasGoogleKey = process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.length > 0;
const hasOpenRouterKey = process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.length > 0;

// OpenAI Configuration - only initialize if key is provided
let openai = null;
if (hasOpenAIKey) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}

// OpenRouter Configuration - OpenAI-compatible API
let openrouter = null;
if (hasOpenRouterKey) {
    openrouter = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
    });
}

// Google Gemini Configuration - only initialize if key is provided
let model = null;
if (hasGoogleKey) {
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    } catch (e) {
        console.warn('⚠️ Google Gemini initialization failed:', e.message);
    }
}

// Log API key status at startup
console.log('\n📋 API Configuration Status:');
if (process.env.AI_SERVICE === 'openrouter') {
    console.log(`   OpenRouter API Key: ${hasOpenRouterKey ? '✅ Configured' : '❌ Not Set'}`);
    console.log(`   OpenRouter Model: ${process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'}`);
    console.log(`   Primary Service: OpenRouter`);
} else {
    console.log(`   OpenAI API Key: ${hasOpenAIKey ? '✅ Configured' : '❌ Not Set'}`);
    console.log(`   Google API Key: ${hasGoogleKey ? '✅ Configured' : '❌ Not Set'}`);
    console.log(`   OpenRouter API Key: ${hasOpenRouterKey ? '✅ Configured' : '❌ Not Set'}`);
}
console.log(`   AI Service: ${process.env.AI_SERVICE || 'google'}`);
console.log(`   Local Fallback: ${ALLOW_LOCAL_FALLBACK ? 'Enabled' : 'Disabled'}\n`);

// Store for analysis results (in production, use database)
let analysisDatabase = [];
const uploadedFileIndex = new Map();

// Utility: Extract text from resume
function normalizeExtractedText(rawText) {
    if (!rawText) return '';
    return String(rawText)
        .replace(/\u0000/g, ' ')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

function hasMinimumTextSignal(text) {
    if (!text) return false;
    const words = text.match(/[a-zA-Z][a-zA-Z0-9+.#-]*/g) || [];
    const uniqueWordCount = new Set(words.map((word) => word.toLowerCase())).size;
    return text.length >= 120 && words.length >= 40 && uniqueWordCount >= 25;
}

async function extractTextFromResume(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
        if (ext === '.txt') {
            const text = normalizeExtractedText(fs.readFileSync(filePath, 'utf-8'));
            if (!hasMinimumTextSignal(text)) {
                console.warn('⚠️ TXT content is too short or low-signal for reliable scoring.');
                return null;
            }
            return text;
        } else if (ext === '.pdf') {
            try {
                const pdfParse = require('pdf-parse');
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdfParse(dataBuffer);
                const text = normalizeExtractedText(data.text);
                if (!hasMinimumTextSignal(text)) {
                    console.warn('⚠️ PDF may be image-based/empty or not parseable enough for reliable scoring. Extracted text length:', text?.length || 0);
                    return null;
                }
                return text;
            } catch (e) {
                console.error('❌ PDF parsing failed:', e.message);
                return null;
            }
        } else if (ext === '.docx' || ext === '.doc') {
            try {
                const mammoth = require('mammoth');
                const result = await mammoth.extractRawText({ path: filePath });
                const text = normalizeExtractedText(result.value);
                if (!hasMinimumTextSignal(text)) {
                    console.warn('⚠️ DOC/DOCX appears too short for reliable scoring. Extracted text length:', text?.length || 0);
                    return null;
                }
                return text;
            } catch (e) {
                console.error('❌ DOCX parsing failed:', e.message);
                return null;
            }
        }
        console.error('❌ Unsupported file format:', ext);
        return null;
    } catch (error) {
        console.error('❌ Text extraction error:', error);
        return null;
    }
}

function analyzeResumeLocally(resumeText, candidateName, fallbackReason = '') {
    const text = normalizeExtractedText(resumeText);
    const lowerText = text.toLowerCase();
    const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const firstLine = lines.find((line) => line.length <= 60 && /[a-zA-Z]/.test(line) && !/(resume|curriculum|vitae|profile)/i.test(line)) || '';

    const emailMatch = text.match(/\b([a-z][a-z0-9._-]{1,30})@[a-z0-9.-]+\.[a-z]{2,}\b/i);
    const emailBasedName = emailMatch
        ? emailMatch[1]
            .replace(/[._-]+/g, ' ')
            .split(' ')
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ')
        : '';
    const inferredName = firstLine || emailBasedName || candidateName;

    const hasPhd = /\b(ph\.?d|doctorate)\b/i.test(text);
    const hasME = /\b(m\.?e\.?|m\.?tech|master\s+of\s+(engineering|technology|computer|science))\b/i.test(text);
    const hasBE = /\b(b\.?e\.?|b\.?tech|bachelor\s+of\s+(engineering|technology|computer|science))\b/i.test(text);
    const hasRelevantDiscipline = /(computer|information\s+technology|electronics|electrical|data\s+science|ai|machine\s+learning)/i.test(text);
    const cgpaMatch = text.match(/\b(?:cgpa|gpa)\s*[:\-]?\s*(\d(?:\.\d{1,2})?)\b/i);
    const cgpa = cgpaMatch ? Number(cgpaMatch[1]) : null;

    let degree = 'Other';
    let educationScore = 0.08;
    if (hasPhd) {
        degree = 'PhD';
        educationScore = 0.25;
    } else if (hasME) {
        degree = 'M.E';
        educationScore = 0.21;
    } else if (hasBE) {
        degree = 'B.E';
        educationScore = 0.16;
    }
    if (hasRelevantDiscipline) educationScore += 0.02;
    if (Number.isFinite(cgpa)) {
        if (cgpa >= 8.5) educationScore += 0.01;
        else if (cgpa < 6.5) educationScore -= 0.02;
    }
    educationScore = Math.max(0.04, Math.min(0.28, educationScore));

    const skillGroups = {
        core: ['Python', 'Java', 'C++', 'JavaScript', 'HTML', 'CSS', 'SQL'],
        frameworks: ['React', 'Node.js', 'Angular', 'Vue', 'Django', 'Flask', 'Spring', 'Express', 'FastAPI'],
        dataAi: ['Machine Learning', 'Deep Learning', 'NLP', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch'],
        cloudDevOps: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Git']
    };

    const skillSet = new Set();
    const countDetected = (skills) => skills.filter((skill) => {
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
        const found = new RegExp(`\\b${escaped}\\b`, 'i').test(text);
        if (found) skillSet.add(skill);
        return found;
    }).length;

    const coreCount = countDetected(skillGroups.core);
    const frameworkCount = countDetected(skillGroups.frameworks);
    const dataAiCount = countDetected(skillGroups.dataAi);
    const cloudCount = countDetected(skillGroups.cloudDevOps);
    const technicalSkills = Array.from(skillSet);

    const weightedSkillCoverage = (coreCount * 1.2) + frameworkCount + (dataAiCount * 1.1) + (cloudCount * 1.1);
    let technicalScore = Math.min(0.30, 0.05 + (weightedSkillCoverage * 0.022));
    if (coreCount <= 1) technicalScore = Math.min(technicalScore, 0.12);

    const yearsMatches = [...text.matchAll(/\b(\d{1,2})\+?\s*(?:years?|yrs?)\b/gi)].map((m) => Number(m[1])).filter(Number.isFinite);
    const maxYears = yearsMatches.length ? Math.max(...yearsMatches) : 0;
    const hasInternship = /\bintern(ship)?\b/i.test(text);
    const hasAcademicExp = /(research|teaching|assistant professor|lecturer|university|college)/i.test(text);
    const hasLeadership = /(lead|team lead|mentor|managed|coordinated|president)/i.test(text);

    let experienceScore = 0.04;
    if (maxYears >= 5) experienceScore = 0.16;
    else if (maxYears >= 3) experienceScore = 0.13;
    else if (maxYears >= 1) experienceScore = 0.10;
    else if (hasInternship) experienceScore = 0.07;
    if (hasAcademicExp) experienceScore += 0.01;
    if (hasLeadership) experienceScore += 0.01;
    experienceScore = Math.min(0.18, experienceScore);

    const projectMentions = (text.match(/\b(project|capstone|thesis|implemented|developed|designed|built)\b/gi) || []).length;
    const hasGithub = /\bgithub\.com\//i.test(text);
    const hasPortfolio = /(portfolio|behance|dribbble|personal\s+website)/i.test(text);
    let projectScore = Math.min(0.12, 0.03 + (Math.min(projectMentions, 8) * 0.01));
    if (hasGithub) projectScore += 0.01;
    if (hasPortfolio) projectScore += 0.005;
    projectScore = Math.min(0.12, projectScore);

    const hasStrongComm = /(presentation|public\s+speaking|published|conference|documentation|client\s+communication|stakeholder)/i.test(text);
    const hasBasicComm = /(communication|verbal|written|interpersonal|collaboration|teamwork)/i.test(text);
    let communicationScore = hasStrongComm ? 0.07 : hasBasicComm ? 0.05 : 0.02;
    communicationScore = Math.min(0.07, communicationScore);
    const hasCommunicationSkills = hasStrongComm || hasBasicComm;

    const hasCertification = /(certified|certification|coursera|udemy|nptel|oracle certified|aws certified|azure fundamentals)/i.test(text);
    const achievementMentions = (text.match(/\b(increased|improved|reduced|optimized|achieved|won|rank|award|%|percent)\b/gi) || []).length;
    let impactScore = 0.01;
    if (hasCertification) impactScore += 0.02;
    if (achievementMentions >= 2) impactScore += 0.02;
    impactScore = Math.min(0.05, impactScore);

    let penalty = 0;
    if (!hasMinimumTextSignal(text)) penalty += 0.05;
    if (text.length < 350) penalty += 0.04;
    if (technicalSkills.length <= 1) penalty += 0.03;
    penalty = Math.min(0.12, penalty);

    let score = educationScore + technicalScore + experienceScore + projectScore + communicationScore + impactScore - penalty;
    score = Math.max(0.05, Math.min(0.95, score));

    const approved = score >= 0.62 && technicalScore >= 0.16 && educationScore >= 0.14;

    const strengths = [];
    const weaknesses = [];

    if (degree === 'PhD') strengths.push('Excellent educational qualification (PhD)');
    else if (degree === 'M.E') strengths.push('Strong postgraduate qualification (M.E/M.Tech)');
    else if (degree === 'B.E') strengths.push('Relevant engineering degree foundation');
    else weaknesses.push('Educational qualification not clearly aligned with engineering/technical role');

    if (technicalSkills.length >= 8) strengths.push(`Strong technical breadth (${technicalSkills.slice(0, 10).join(', ')})`);
    else if (technicalSkills.length >= 4) strengths.push(`Good technical stack coverage (${technicalSkills.join(', ')})`);
    else weaknesses.push('Limited technical depth detected for this role');

    if (maxYears >= 3 || hasAcademicExp) strengths.push('Meaningful professional/academic experience present');
    else if (hasInternship) strengths.push('Hands-on internship exposure present');
    else weaknesses.push('Experience evidence is limited');

    if (projectMentions >= 4 || hasGithub) strengths.push('Projects and implementation evidence are present');
    else weaknesses.push('Project evidence is insufficient or not clearly described');

    if (!hasCommunicationSkills) weaknesses.push('Communication indicators are weak or missing');
    if (!hasCertification && achievementMentions < 2) weaknesses.push('Certifications/quantified achievements are minimal');
    if (penalty > 0.05) weaknesses.push('Resume content quality is too low/noisy for highly confident scoring');

    const assessment = approved
        ? `Resume demonstrates strong overall fit with a score of ${Math.round(score * 100)}%. Candidate shows good alignment in education, technical capability, and practical project/experience signals.`
        : `Resume score is ${Math.round(score * 100)}%, below approval threshold. Profile has gaps in one or more key areas (education relevance, technical depth, experience/projects, or measurable impact).`;

    const localModeNote = fallbackReason ? ' [Local analysis mode]' : '';

    return {
        candidateName: inferredName || candidateName || 'Candidate',
        score,
        degree,
        hasCommunicationSkills,
        technicalSkills,
        strengths,
        weaknesses,
        assessment,
        feedback: `${assessment}${localModeNote}`,
        status: approved ? 'approved' : 'rejected',
        recommendation: approved ? 'APPROVED' : 'REJECTED',
        timestamp: new Date(),
        scoreBreakdown: {
            education: Number(educationScore.toFixed(3)),
            technical: Number(technicalScore.toFixed(3)),
            experience: Number(experienceScore.toFixed(3)),
            projects: Number(projectScore.toFixed(3)),
            communication: Number(communicationScore.toFixed(3)),
            impact: Number(impactScore.toFixed(3)),
            penalty: Number(penalty.toFixed(3))
        },
        fallbackUsed: true
    };
}

// Analyze resume with OpenAI
async function analyzeResumeWithAI(resumeText, candidateName) {
    try {
        const prompt = `
You are an expert HR recruiter for academic institutions. Analyze this resume with REALISTIC and STRICT evaluation standards.

Resume:
${resumeText}

EVALUATION CRITERIA:

EDUCATION REQUIREMENTS (40% weight):
- PhD: Excellent match (0.35-0.40 points) 
- M.E/M.Tech in relevant field: Good match (0.25-0.35 points)
- B.E/B.Tech with strong experience: Acceptable (0.15-0.25 points)
- Other degrees: Poor match (0.0-0.15 points)

TECHNICAL SKILLS (35% weight):
- Core: Python, Java, C++, JavaScript, HTML, CSS
- Advanced: React, Node.js, Machine Learning, Databases, Cloud platforms
- 6+ skills: Excellent (0.30-0.35 points)
- 4-5 skills: Good (0.20-0.29 points)
- 2-3 skills: Fair (0.10-0.19 points)
- <2 skills: Poor (0.0-0.09 points)

EXPERIENCE QUALITY (15% weight):
- Relevant teaching/research: 0.10-0.15 points
- Industry experience in tech: 0.05-0.12 points
- Fresh graduate: 0.0-0.05 points

COMMUNICATION SKILLS (10% weight):
- Clear evidence (presentations/papers/teaching): 0.08-0.10 points
- Some indicators: 0.04-0.07 points
- Not evident: 0.0-0.03 points

SCORING GUIDELINES:
- 0.85-1.0: Exceptional candidate (very rare)
- 0.70-0.84: Strong candidate 
- 0.55-0.69: Average candidate
- 0.40-0.54: Below average
- 0.0-0.39: Poor fit

BE REALISTIC - Most candidates score 0.45-0.75. Only truly exceptional candidates should score above 0.80.

Provide detailed analysis in JSON format:
{
    "candidateName": "extracted name",
    "score": 0.65,
    "degree": "B.E/M.E/PhD/Other",
    "hasCommunicationSkills": true,
    "technicalSkills": ["Python", "Java"],
    "strengths": ["specific strength 1", "specific strength 2"],
    "weaknesses": ["specific weakness 1", "specific weakness 2"],
    "assessment": "detailed 2-3 sentence assessment",
    "recommendation": "APPROVED or REJECTED"
}`;

        let content;
        const aiService = (process.env.AI_SERVICE || 'google').toLowerCase();
         

        if (aiService === 'local') {
            console.log('🟡 Using Local Analysis Mode...');
            return analyzeResumeLocally(resumeText, candidateName, 'local_mode_enabled');
        }
        
        // Try OpenRouter directly (if configured)
        if (aiService === 'openrouter' && openrouter) {
            const openRouterModel = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
            console.log('🟣 Using OpenRouter API...');
            const response = await withTimeout(
                openrouter.chat.completions.create({
                    model: openRouterModel,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert HR recruiting assistant. Analyze resumes and provide screening recommendations based on typical job requirements.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 600
                }),
                AI_TIMEOUT_MS,
                'OpenRouter request'
            );
            content = response.choices[0].message.content;
        }
        // Try Google Gemini first (if configured)
        else if (aiService === 'google' && process.env.GOOGLE_API_KEY && model) {
            try {
                console.log('🔵 Using Google Gemini API...');
                const result = await withTimeout(
                    model.generateContent(prompt),
                    AI_TIMEOUT_MS,
                    'Gemini request'
                );
                content = result.response.text();
            } catch (googleError) {
                const googleErrorMessage = (googleError && googleError.message) ? googleError.message : String(googleError);
                console.warn('⚠️ Google Gemini failed:', googleErrorMessage);

                // Check if it's a quota error
                if (googleErrorMessage.includes('429') || googleErrorMessage.includes('quota') || googleErrorMessage.includes('rate limit')) {
                    console.warn('⚠️ Google Gemini quota exceeded. Trying fallback provider...');
                    
                    if (openrouter || openai) {
                        try {
                            const aiClient = openrouter || openai;
                            const aiClientLabel = openrouter ? 'OpenRouter' : 'OpenAI';
                            const fallbackModel = openrouter
                                ? (process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini')
                                : 'gpt-3.5-turbo';
                            const response = await withTimeout(
                                aiClient.chat.completions.create({
                                    model: fallbackModel,
                                    messages: [
                                        {
                                            role: "system",
                                            content: "You are an expert HR recruiting assistant. Analyze resumes and provide screening recommendations based on typical job requirements."
                                        },
                                        {
                                            role: "user",
                                            content: prompt
                                        }
                                    ],
                                    temperature: 0.7,
                                    max_tokens: 600
                                }),
                                AI_TIMEOUT_MS,
                                `${aiClientLabel} request`
                            );
                            content = response.choices[0].message.content;
                        } catch (openaiError) {
                            const openaiErrorMsg = openaiError.message || String(openaiError);
                            if (openaiErrorMsg.includes('401') || openaiErrorMsg.includes('invalid api key') || openaiErrorMsg.includes('API key')) {
                                throw new Error('⚠️ Google Gemini quota exceeded and fallback provider API key is invalid. Please check OPENROUTER_API_KEY / OPENAI_API_KEY in .env.');
                            }
                            throw openaiError;
                        }
                    } else {
                        throw new Error('⚠️ Google Gemini quota exceeded and no fallback provider is configured. Please set OPENROUTER_API_KEY or OPENAI_API_KEY.');
                    }
                } else if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
                    throw googleError;
                } else {
                    // Try OpenRouter/OpenAI as fallback
                    const aiClient = openrouter || openai;
                    const aiClientLabel = openrouter ? 'OpenRouter' : 'OpenAI';
                    const fallbackModel = openrouter
                        ? (process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini')
                        : 'gpt-3.5-turbo';
                    console.warn(`⚠️ Falling back to ${aiClientLabel}...`);
                    const response = await withTimeout(
                        aiClient.chat.completions.create({
                            model: fallbackModel,
                            messages: [
                                {
                                    role: "system",
                                    content: "You are an expert HR recruiting assistant. Analyze resumes and provide screening recommendations based on typical job requirements."
                                },
                                {
                                    role: "user",
                                    content: prompt
                                }
                            ],
                            temperature: 0.7,
                            max_tokens: 600
                        }),
                        AI_TIMEOUT_MS,
                        `${aiClientLabel} request`
                    );
                    content = response.choices[0].message.content;
                }
            }
        } else if (openrouter || openai) {
            // Use OpenAI directly
            const aiClient = openrouter || openai;
            const aiClientLabel = openrouter ? 'OpenRouter' : 'OpenAI';
            const fallbackModel = openrouter
                ? (process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini')
                : 'gpt-3.5-turbo';
            console.log(`${openrouter ? '🟣' : '🟢'} Using ${aiClientLabel} API...`);
            const response = await withTimeout(
                aiClient.chat.completions.create({
                    model: fallbackModel,
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert HR recruiting assistant. Analyze resumes and provide screening recommendations based on typical job requirements."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 600
                }),
                AI_TIMEOUT_MS,
                `${aiClientLabel} request`
            );
            content = response.choices[0].message.content;
        } else {
            throw new Error('⚠️ OpenRouter not configured or AI service misconfigured. Please check OPENROUTER_API_KEY and AI_SERVICE in .env.');
        }
        
        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            const strengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
            const weaknesses = Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [];
            const technicalSkills = Array.isArray(analysis.technicalSkills) ? analysis.technicalSkills : [];
            const parsedScore = Number(analysis.score);
            if (!Number.isFinite(parsedScore)) {
                throw new Error('AI response missing a valid numeric score.');
            }
            const score = Math.max(0, Math.min(1, parsedScore));
            const recommendation = String(analysis.recommendation || '').toUpperCase();

            return {
                candidateName: analysis.candidateName || candidateName,
                score,
                degree: analysis.degree,
                hasCommunicationSkills: analysis.hasCommunicationSkills,
                technicalSkills,
                strengths,
                weaknesses,
                assessment: analysis.assessment || "",
                feedback: `${analysis.assessment || ''}\n\nStrengths: ${strengths.join(', ')}\nWeaknesses: ${weaknesses.join(', ')}`,
                status: recommendation === "APPROVED" ? "approved" : "rejected",
                recommendation: recommendation || "REJECTED",
                timestamp: new Date()
            };
        }

        throw new Error('Unable to parse AI response');
    } catch (error) {
        let errorMsg = error.message || 'Unknown error';
        const lowerErrorMsg = errorMsg.toLowerCase();
        
        // Provide better error messages (check quota first, before invalid key)
        if (error.status === 429 || lowerErrorMsg.includes('429') || lowerErrorMsg.includes('quota') || lowerErrorMsg.includes('exceeded')) {
            errorMsg = '⚠️ API quota exceeded. Please check billing/quota for your AI provider.';
        } else if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
            errorMsg = '⚠️ Cannot connect to AI API. Please check network and API service status.';
        } else if (error.status === 401 || lowerErrorMsg.includes('401') || lowerErrorMsg.includes('invalid api key')) {
            errorMsg = '⚠️ Invalid API key. Please update OPENROUTER_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY.';
        }
        
        if (ALLOW_LOCAL_FALLBACK) {
            console.warn('⚠️ AI unavailable, using local fallback analysis:', errorMsg);
            return analyzeResumeLocally(resumeText, candidateName, errorMsg);
        }

        console.error('⚠️ AI Analysis Error:', errorMsg);
        throw new Error(errorMsg);
    }
}

// Route wrapper with error handling
app.post('/api/upload', upload.array('resumes', 1000), asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'No files uploaded',
            error: 'Please select at least one file'
        });
    }

    try {
        const uploadedFiles = req.files.map(file => ({
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            name: file.originalname,
            path: file.path,
            size: file.size,
            uploadedAt: new Date(),
            status: 'uploaded'
        }));

        uploadedFiles.forEach(file => {
            uploadedFileIndex.set(file.id, {
                path: file.path,
                name: file.name,
                uploadedAt: file.uploadedAt
            });
        });

        console.log(`✅ Uploaded ${uploadedFiles.length} file(s)`);

        res.json({
            success: true,
            message: `${uploadedFiles.length} file(s) uploaded successfully`,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Upload failed',
            error: error.message
        });
    }
}));

// Analyze resume with AI
app.post('/api/analyze', asyncHandler(async (req, res) => {
    try {
        const { fileId } = req.body;

        if (!fileId) {
            return res.status(400).json({ 
                success: false, 
                message: 'File ID is required' 
            });
        }

        const fileMeta = uploadedFileIndex.get(fileId);
        if (!fileMeta || !fileMeta.path || !fs.existsSync(fileMeta.path)) {
            return res.status(404).json({
                success: false,
                message: 'Uploaded file not found for analysis. Please upload again.'
            });
        }
        const filePath = fileMeta.path;
        const fileName = fileMeta.name || path.basename(filePath);

        // Extract text from resume
        console.log(`📄 Extracting text from: ${fileName}`);
        const resumeText = await extractTextFromResume(filePath);

        if (!resumeText || resumeText.trim().length === 0) {
            console.error('❌ Text extraction failed for:', fileName);
            return res.status(422).json({
                success: false,
                message: 'Could not extract text from this resume. Please upload a text-based PDF/DOCX/TXT file.'
            });
        }

        // Analyze with AI
        console.log(`🤖 Analyzing with AI...`);
        const analysis = await analyzeResumeWithAI(
            resumeText.substring(0, 2500),
            path.parse(fileName).name
        );

        // Store in database
        analysisDatabase.push({
            fileId,
            filePath,
            analysis
        });

        console.log(`✅ Analysis complete: ${analysis.candidateName} (Score: ${Math.round(analysis.score * 100)}%)`);

        res.json({
            success: true,
            message: 'Resume analyzed successfully',
            analysis: analysis
        });

    } catch (error) {
        console.error('❌ Analysis error:', error.message);
        
        // Check if it's a quota error
        const errorMsg = error.message || '';
        const isQuotaError = errorMsg.includes('quota') || errorMsg.includes('429');
        
        res.status(isQuotaError ? 402 : 500).json({
            success: false,
            message: `Analysis failed: ${error.message}`,
            error: isQuotaError ? 'quota_exceeded' : 'analysis_failed'
        });
    }
}));

// Send for principal approval
app.post('/api/send-approval', (req, res) => {
    try {
        const { candidateName, analysis, principalEmail } = req.body;

        // Log the approval action
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📧 RESUME EMAIL COMPOSED FOR PRINCIPAL`);
        console.log(`${'='.repeat(80)}`);
        console.log(`Candidate: ${candidateName}`);
        console.log(`Match Score: ${Math.round(analysis.score * 100)}%`);
        console.log(`Principal Email: ${principalEmail || process.env.PRINCIPAL_EMAIL}`);
        console.log(`Status: Email client opened for user to send`);
        console.log(`Timestamp: ${new Date().toLocaleString()}`);
        console.log(`\nCandidate Strengths:`);
        if (analysis.strengths && analysis.strengths.length > 0) {
            analysis.strengths.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
        }
        console.log(`\nAreas for Improvement:`);
        if (analysis.weaknesses && analysis.weaknesses.length > 0) {
            analysis.weaknesses.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
        }
        console.log(`${'='.repeat(80)}\n`);

        res.json({
            success: true,
            message: `Email composed and opened for principal review`,
            approvalId: 'APPROVAL-' + Date.now(),
            principalEmail: principalEmail || process.env.PRINCIPAL_EMAIL,
            candidateName: candidateName,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error in send-approval endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send for approval: ' + error.message
        });
    }
});

// Get all analysis results
app.get('/api/results', (req, res) => {
    const results = analysisDatabase.map(item => ({
        fileId: item.fileId,
        fileName: path.basename(item.filePath),
        analysis: item.analysis
    }));

    res.json({
        success: true,
        total: results.length,
        results: results
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'AI Resume Screening System is running',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
    });
});

// Get system stats
app.get('/api/stats', asyncHandler(async (req, res) => {
    const uploadDir = path.join(__dirname, '../uploads');
    const files = fs.readdirSync(uploadDir).filter(f => !f.startsWith('.'));
    
    const stats = {
        totalAnalyzed: analysisDatabase.length,
        totalUploaded: files.length,
        approved: analysisDatabase.filter(a => a.analysis.status === 'approved').length,
        rejected: analysisDatabase.filter(a => a.analysis.status === 'rejected').length,
        avgScore: analysisDatabase.length > 0 
            ? (analysisDatabase.reduce((sum, a) => sum + a.analysis.score, 0) / analysisDatabase.length).toFixed(2)
            : 0,
        timestamp: new Date()
    };
    
    res.json({
        success: true,
        stats: stats
    });
}));

// Clear old uploads (cleanup) - but preserve analysis results
app.post('/api/cleanup', asyncHandler(async (req, res) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Check if directory exists
    if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir).filter(f => !f.startsWith('.'));
        
        let deleted = 0;
        files.forEach(file => {
            const filePath = path.join(uploadDir, file);
            try {
                fs.unlinkSync(filePath);
                deleted++;
            } catch (err) {
                console.error(`Error deleting ${file}:`, err);
            }
        });
        
        console.log(`🧹 Cleaned up ${deleted} uploaded file(s). Preserved ${analysisDatabase.length} analysis result(s).`);
        
        res.json({
            success: true,
            message: `Cleaned up ${deleted} file(s). ${analysisDatabase.length} analysis result(s) preserved.`,
            deleted: deleted,
            resultsPreserved: analysisDatabase.length
        });
    } else {
        // No uploads directory exists, just preserve results
        res.json({
            success: true,
            message: `No files to clean. ${analysisDatabase.length} analysis result(s) preserved.`,
            deleted: 0,
            resultsPreserved: analysisDatabase.length
        });
    }
    
    // NOTE: We intentionally do NOT clear analysisDatabase anymore
    // The analysis results should persist even after uploaded files are cleaned up
}));

// Delete individual analysis result
app.delete('/api/result/:fileId', asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    
    if (!fileId) {
        return res.status(400).json({
            success: false,
            message: 'File ID is required'
        });
    }
    
    // Find and remove from analysis database
    const resultIndex = analysisDatabase.findIndex(item => item.fileId === fileId);
    let deletedResult = null;
    
    if (resultIndex !== -1) {
        deletedResult = analysisDatabase[resultIndex];
        analysisDatabase.splice(resultIndex, 1);
    }
    
    // Remove from uploaded file index and delete actual file
    const fileMeta = uploadedFileIndex.get(fileId);
    if (fileMeta && fileMeta.path && fs.existsSync(fileMeta.path)) {
        try {
            fs.unlinkSync(fileMeta.path);
            console.log(`🗑️ Deleted file: ${fileMeta.name}`);
        } catch (err) {
            console.error(`Error deleting file ${fileMeta.name}:`, err);
        }
    }
    
    uploadedFileIndex.delete(fileId);
    
    console.log(`🗑️ Deleted result for file ID: ${fileId}`);
    
    res.json({
        success: true,
        message: 'Result and file deleted successfully',
        deletedFileId: fileId,
        fileName: fileMeta?.name || 'Unknown'
    });
}));

// Clear all analysis results (for removing test data)
app.post('/api/clear-results', asyncHandler(async (req, res) => {
    const previousCount = analysisDatabase.length;
    analysisDatabase.length = 0; // Clear the array
    uploadedFileIndex.clear(); // Clear the file index as well
    
    console.log(`🗑️ Cleared ${previousCount} analysis result(s) from database.`);
    
    res.json({
        success: true,
        message: `Cleared ${previousCount} analysis result(s)`,
        previousCount: previousCount
    });
}));

function buildResumeFeedbackContext(analysisEntry) {
    if (!analysisEntry || !analysisEntry.analysis) {
        return 'No uploaded resume analysis is available yet.';
    }

    const analysis = analysisEntry.analysis;
    const scorePct = Math.round((Number(analysis.score) || 0) * 100);
    const strengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
    const weaknesses = Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [];
    const technicalSkills = Array.isArray(analysis.technicalSkills) ? analysis.technicalSkills : [];

    return `Latest uploaded resume analysis:
- Candidate: ${analysis.candidateName || 'Candidate'}
- File ID: ${analysisEntry.fileId}
- Score: ${scorePct}%
- Degree: ${analysis.degree || 'Not specified'}
- Recommendation: ${analysis.recommendation || 'REJECTED'}
- Status: ${analysis.status || 'rejected'}
- Communication Skills: ${analysis.hasCommunicationSkills ? 'Present' : 'Not evident'}
- Technical Skills: ${technicalSkills.length ? technicalSkills.join(', ') : 'None detected'}
- Strengths: ${strengths.length ? strengths.join('; ') : 'None listed'}
- Weaknesses: ${weaknesses.length ? weaknesses.join('; ') : 'None listed'}
- Assessment: ${analysis.assessment || analysis.feedback || 'No assessment available'}`;
}

// Chat with AI chatbot endpoint
app.post('/api/chat', asyncHandler(async (req, res) => {
    try {
        const { message, fileId } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        console.log(`💬 Chat request: ${message}`);

        const selectedAnalysis = fileId
            ? analysisDatabase.find((item) => item.fileId === fileId)
            : null;
        const latestAnalysis = analysisDatabase.length
            ? analysisDatabase[analysisDatabase.length - 1]
            : null;
        const resumeContext = buildResumeFeedbackContext(selectedAnalysis || latestAnalysis);

        // Build the chatbot prompt
        const chatPrompt = `You are HEIR, an AI assistant for Stella Mary's College of Engineering.
    Answer user questions clearly and accurately.

    Behavior rules:
    - If asked about resumes, interview prep, careers, or technical skills, give practical step-by-step guidance.
    - If resume analysis context is provided below, use it as the primary source for resume feedback.
    - If asked a general question (not resume-related), still provide a helpful direct answer.
    - Keep answers concise, correct, and friendly.
    - If uncertain, say what is uncertain and provide best next step.

    ${resumeContext}

    User question: ${message}`;

        let content;
        const aiService = (process.env.CHAT_AI_SERVICE || process.env.AI_SERVICE || 'google').toLowerCase();

        // Try Google Gemini first
        if (aiService === 'google' && process.env.GOOGLE_API_KEY && model) {
            try {
                console.log('🔵 Using Google Gemini for chat...');
                const result = await withTimeout(
                    model.generateContent(chatPrompt),
                    AI_TIMEOUT_MS,
                    'Gemini chat request'
                );
                content = result.response.text();
            } catch (googleError) {
                const googleErrorMessage = googleError?.message || String(googleError);
                console.warn('⚠️ Google Gemini chat failed:', googleErrorMessage);

                // Check if quota error, try OpenAI
                if (googleErrorMessage.includes('429') || googleErrorMessage.includes('quota')) {
                    if (openrouter || openai) {
                        try {
                            const aiClient = openrouter || openai;
                            const aiClientLabel = openrouter ? 'OpenRouter' : 'OpenAI';
                            const fallbackModel = openrouter
                                ? (process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini')
                                : 'gpt-3.5-turbo';
                            console.log(`${openrouter ? '🟣' : '🟢'} Trying ${aiClientLabel} for chat...`);
                            const response = await withTimeout(
                                aiClient.chat.completions.create({
                                    model: fallbackModel,
                                    messages: [
                                        {
                                            role: "system",
                                            content: "You are a friendly AI Resume Assistant for Stella Mary's College of Engineering. Help users with resume tips, interview prep, career guidance, and technical skills advice."
                                        },
                                        {
                                            role: "user",
                                            content: chatPrompt
                                        }
                                    ],
                                    temperature: 0.7,
                                    max_tokens: 500
                                }),
                                AI_TIMEOUT_MS,
                                `${aiClientLabel} chat request`
                            );
                            content = response.choices[0].message.content;
                        } catch (openaiError) {
                            console.error('❌ OpenAI fallback failed:', openaiError.message);
                            throw googleError;
                        }
                    } else {
                        throw googleError;
                    }
                } else {
                    throw googleError;
                }
            }
        } else if (aiService === 'openrouter' && openrouter) {
            console.log('🟣 Using OpenRouter for chat...');
            const response = await withTimeout(
                openrouter.chat.completions.create({
                    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: "You are a friendly AI Resume Assistant for Stella Mary's College of Engineering. Help users with resume tips, interview prep, career guidance, and technical skills advice."
                        },
                        {
                            role: 'user',
                            content: chatPrompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                }),
                AI_TIMEOUT_MS,
                'OpenRouter chat request'
            );
            content = response.choices[0].message.content;
        } else if (openrouter || openai) {
            // Use OpenRouter/OpenAI directly
            const aiClient = openrouter || openai;
            const aiClientLabel = openrouter ? 'OpenRouter' : 'OpenAI';
            const fallbackModel = openrouter
                ? (process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini')
                : 'gpt-3.5-turbo';
            console.log(`${openrouter ? '🟣' : '🟢'} Using ${aiClientLabel} for chat...`);
            const response = await withTimeout(
                aiClient.chat.completions.create({
                    model: fallbackModel,
                    messages: [
                        {
                            role: "system",
                            content: "You are a friendly AI Resume Assistant for Stella Mary's College of Engineering. Help users with resume tips, interview prep, career guidance, and technical skills advice."
                        },
                        {
                            role: "user",
                            content: chatPrompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                }),
                AI_TIMEOUT_MS,
                `${aiClientLabel} chat request`
            );
            content = response.choices[0].message.content;
        } else {
            throw new Error('No chat AI service configured. Set CHAT_AI_SERVICE (openrouter/google/openai) or configure API keys in .env.');
        }

        console.log(`✅ Chat response generated`);

        res.json({
            success: true,
            message: content,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('❌ Chat error:', error.message);
        res.status(500).json({
            success: false,
            message: `Chat failed: ${error.message}`
        });
    }
}));

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    
    // Handle multer errors
    if (err.name === 'MulterError') {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(413).json({
                success: false,
                message: 'File too large',
                error: 'Maximum file size is 50MB'
            });
        }
    }
    
    // Handle validation errors
    if (err.statusCode === 400) {
        return res.status(400).json({
            success: false,
            message: 'Bad request',
            error: err.message
        });
    }
    
    // Default error response
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Serve static files from project root
app.use(express.static(path.join(__dirname, '../')));

// Favicon handler to prevent 404
app.get('/favicon.ico', (req, res) => {
    res.type('image/x-icon').send(Buffer.from('AAABAAEAEBAQAAEABACoBAAARgAAACAgAAABACAAqAgAAE4BAAAwEAAAAQAIACgBAAC1BQAAKAAAABAAAAAgAAAAAQAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA', 'hex'));
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// 404 handler (after static files)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🤖 AI Resume Screening System Started`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✓ Server running at: http://localhost:${PORT}`);
    console.log(`✓ API Base URL: http://localhost:${PORT}/api`);
    console.log(`✓ Frontend: http://localhost:${PORT}`);
    console.log(`✓ Health Check: http://localhost:${PORT}/api/health`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Log available endpoints
    console.log('📋 Available Endpoints:');
    console.log('  POST   /api/upload          - Upload resumes');
    console.log('  POST   /api/analyze         - Analyze uploaded resume');
    console.log('  POST   /api/send-approval   - Send to principal');
    console.log('  POST   /api/chat            - Chat with AI assistant');
    console.log('  GET    /api/results         - Get all analysis results');
    console.log('  GET    /api/stats           - Get system statistics');
    console.log('  GET    /api/health          - Health check');
    console.log('  POST   /api/cleanup         - Clear uploaded files');
    console.log('  POST   /api/clear-results   - Clear analysis database');
    console.log('  DELETE /api/result/:fileId  - Delete individual result and file');
    console.log(`${'='.repeat(60)}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server gracefully...');
    process.exit(0);
});

module.exports = app;
