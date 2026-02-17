const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Middleware - CORS Configuration
const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5500',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500'
]);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

const withTimeout = (promise, ms, label) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`${label} timed out after ${ms}ms`));
        }, ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

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
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Check if API keys are configured
const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0;
const hasGoogleKey = process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.length > 0;

// OpenAI Configuration - only initialize if key is provided
let openai = null;
if (hasOpenAIKey) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
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
console.log(`   OpenAI API Key: ${hasOpenAIKey ? '✅ Configured' : '❌ Not Set'}`);
console.log(`   Google API Key: ${hasGoogleKey ? '✅ Configured' : '❌ Not Set'}`);
console.log(`   AI Service: ${process.env.AI_SERVICE || 'google'}\n`);

// Store for analysis results (in production, use database)
let analysisDatabase = [];
const uploadedFileIndex = new Map();

// Utility: Extract text from resume
async function extractTextFromResume(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
        if (ext === '.txt') {
            const text = fs.readFileSync(filePath, 'utf-8');
            return text.trim() || null;
        } else if (ext === '.pdf') {
            try {
                const pdfParse = require('pdf-parse');
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdfParse(dataBuffer);
                const text = data.text?.trim();
                if (!text || text.length < 50) {
                    console.warn('⚠️  PDF may be image-based or empty. Extracted text length:', text?.length || 0);
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
                const text = result.value?.trim();
                if (!text || text.length < 50) {
                    console.warn('⚠️  DOCX may be empty. Extracted text length:', text?.length || 0);
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

// Analyze resume with OpenAI
async function analyzeResumeWithAI(resumeText, candidateName) {
    try {
        const prompt = `
You are an expert HR recruiter for Stella Mary's College of Engineering. Analyze the following resume and provide a screening decision.

Resume:
${resumeText}

REQUIRED CRITERIA:
- Education: M.E or PhD degree (Computer Science preferred)
- Communication Skills: MUST be present (written/verbal/presentation)
- Technical Skills: Check for Python, Java, C++, HTML, JavaScript, CSS

Please analyze this resume and provide:
1. A brief assessment (2-3 sentences)
2. A match score from 0 to 1 (0.0 to 1.0)
3. Key strengths
4. Key weaknesses
5. Degree qualification (M.E, PhD, or Other)
6. Communication skills presence (Yes/No)
7. Technical skills found (list from: Python, Java, C++, HTML, JavaScript, CSS)
8. Recommendation: "APPROVED" (pass to principal for final approval) or "REJECTED" (does not meet criteria)

Format your response as JSON:
{
    "candidateName": "extracted name or 'Candidate'",
    "score": 0.75,
    "degree": "M.E/PhD/Other",
    "hasCommunicationSkills": true,
    "technicalSkills": ["Python", "Java"],
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "assessment": "brief assessment",
    "recommendation": "APPROVED or REJECTED"
}`;

        let content;
        const aiService = process.env.AI_SERVICE || 'google';
        
        // Try Google Gemini first (if configured)
        if (aiService === 'google' && process.env.GOOGLE_API_KEY && model) {
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
                    console.warn('⚠️ Google Gemini quota exceeded. Trying OpenAI...');
                    
                    if (openai) {
                        try {
                            const response = await withTimeout(
                                openai.chat.completions.create({
                                    model: "gpt-3.5-turbo",
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
                                'OpenAI request'
                            );
                            content = response.choices[0].message.content;
                        } catch (openaiError) {
                            const openaiErrorMsg = openaiError.message || String(openaiError);
                            if (openaiErrorMsg.includes('401') || openaiErrorMsg.includes('invalid api key') || openaiErrorMsg.includes('API key')) {
                                throw new Error('⚠️ Both Google Gemini (quota exceeded) and OpenAI (invalid API key) failed. Please check your API keys in the .env file.');
                            }
                            throw openaiError;
                        }
                    } else {
                        throw new Error('⚠️ Google Gemini quota exceeded and OpenAI is not configured. Please check your API keys.');
                    }
                } else if (!process.env.OPENAI_KEY) {
                    throw googleError;
                } else {
                    // Try OpenAI as fallback
                    console.warn('⚠️ Falling back to OpenAI...');
                    const response = await withTimeout(
                        openai.chat.completions.create({
                            model: "gpt-3.5-turbo",
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
                        'OpenAI request'
                    );
                    content = response.choices[0].message.content;
                }
            }
        } else if (openai) {
            // Use OpenAI directly
            console.log('🟢 Using OpenAI API...');
            const response = await withTimeout(
                openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
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
                'OpenAI request'
            );
            content = response.choices[0].message.content;
        } else {
            throw new Error('⚠️ No AI service configured. Please set either GOOGLE_API_KEY or OPENAI_API_KEY in the .env file.');
        }
        
        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            
            return {
                candidateName: analysis.candidateName || candidateName,
                score: analysis.score || 0.5,
                degree: analysis.degree,
                hasCommunicationSkills: analysis.hasCommunicationSkills,
                technicalSkills: analysis.technicalSkills,
                strengths: analysis.strengths || [],
                weaknesses: analysis.weaknesses || [],
                assessment: analysis.assessment || "",
                feedback: `${analysis.assessment}\n\nStrengths: ${analysis.strengths.join(', ')}\nWeaknesses: ${analysis.weaknesses.join(', ')}`,
                status: analysis.recommendation === "APPROVED" ? "approved" : "rejected",
                recommendation: analysis.recommendation,
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
            errorMsg = '⚠️ Invalid API key. Please update OPENAI_API_KEY or GOOGLE_API_KEY.';
        }
        
        console.error('⚠️ AI Analysis Error:', errorMsg);
        throw new Error(errorMsg);
    }
}

// Route wrapper with error handling
app.post('/api/upload', upload.array('resumes', 10), asyncHandler(async (req, res) => {
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

// Clear old uploads (cleanup)
app.post('/api/cleanup', asyncHandler(async (req, res) => {
    const uploadDir = path.join(__dirname, '../uploads');
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
    
    analysisDatabase = [];
    
    res.json({
        success: true,
        message: `Cleaned up ${deleted} file(s)`,
        deleted: deleted
    });
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
                error: 'Maximum file size is 10MB'
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
    console.log('  GET    /api/results         - Get all analysis results');
    console.log('  GET    /api/stats           - Get system statistics');
    console.log('  GET    /api/health          - Health check');
    console.log('  POST   /api/cleanup         - Clear all uploads');
    console.log(`${'='.repeat(60)}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server gracefully...');
    process.exit(0);
});

module.exports = app;
