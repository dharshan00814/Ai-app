/**
 * AI Resume Screening System - Configuration
 * Customize behavior and criteria here
 */

// Scoring Thresholds
const SCORING_CONFIG = {
    // Minimum score required to pass AI screening (0 to 1)
    APPROVAL_THRESHOLD: 0.6,
    
    // Score ranges for different tiers
    EXCELLENT: 0.85,      // 85% and above
    GOOD: 0.70,           // 70-84%
    FAIR: 0.50,           // 50-69%
    POOR: 0.0             // Below 50%
};

// Evaluation Criteria Weights
const CRITERIA_WEIGHTS = {
    relevantExperience: 0.30,
    skillsMatch: 0.25,
    education: 0.15,
    workHistory: 0.15,
    achievements: 0.10,
    cultureFit: 0.05
};

// File Upload Configuration
const UPLOAD_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024,  // 10MB
    MAX_FILES_PER_UPLOAD: 10,
    SUPPORTED_FORMATS: ['pdf', 'docx', 'doc', 'txt'],
    UPLOAD_DIR: './uploads',
    RETENTION_DAYS: 30  // Auto-delete after 30 days
};

// AI Analysis Configuration
const AI_CONFIG = {
    MODEL: 'gpt-3.5-turbo',
    TEMPERATURE: 0.7,
    MAX_TOKENS: 1000,
    TIMEOUT: 30000,  // 30 seconds
    RETRY_ATTEMPTS: 3
};

// Email Configuration
const EMAIL_CONFIG = {
    PRINCIPAL_EMAIL: process.env.PRINCIPAL_EMAIL || 'principal@company.com',
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT || 587,
    FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@company.com',
    EMAIL_TEMPLATES: {
        APPROVED: 'resume_approved_to_principal.html',
        REJECTED: 'resume_rejected.html',
        PENDING: 'resume_pending_review.html'
    }
};

// Logging Configuration
const LOG_CONFIG = {
    LEVEL: process.env.LOG_LEVEL || 'info',
    FILE: './logs/screening-system.log',
    MAX_LOG_SIZE: 10 * 1024 * 1024  // 10MB
};

// System Roles
const ROLES = {
    ADMIN: 'admin',
    HR_RECRUITER: 'recruiter',
    PRINCIPAL: 'principal',
    VIEWER: 'viewer'
};

// Analysis Result Statuses
const STATUSES = {
    UPLOADED: 'uploaded',
    PROCESSING: 'processing',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PENDING_PRINCIPAL: 'pending_principal',
    PRINCIPAL_APPROVED: 'principal_approved',
    PRINCIPAL_REJECTED: 'principal_rejected',
    ERROR: 'error'
};

// AI Evaluation Prompts
const EVALUATION_PROMPTS = {
    DEFAULT: `You are an expert HR recruiter with 20+ years of experience. 
              Analyze this resume and provide a detailed screening assessment.`,
    
    TECHNICAL: `You are a technical recruitment specialist. 
                Focus on technical skills, programming languages, frameworks, and tools.`,
    
    MANAGEMENT: `You are a management recruitment specialist. 
                 Focus on leadership experience, team management, and strategic skills.`
};

// Feedback Messages
const FEEDBACK_MESSAGES = {
    EXCELLENT: 'This candidate shows excellent qualifications and strong fit.',
    GOOD: 'This candidate meets the requirements with good qualifications.',
    FAIR: 'This candidate meets basic requirements but has some gaps.',
    POOR: 'This candidate does not meet the minimum qualifications.',
    ERROR: 'Unable to complete analysis. Please review manually.'
};

// Export all configurations
module.exports = {
    SCORING_CONFIG,
    CRITERIA_WEIGHTS,
    UPLOAD_CONFIG,
    AI_CONFIG,
    EMAIL_CONFIG,
    LOG_CONFIG,
    ROLES,
    STATUSES,
    EVALUATION_PROMPTS,
    FEEDBACK_MESSAGES
};
