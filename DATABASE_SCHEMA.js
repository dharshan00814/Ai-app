/**
 * Database Schema for AI Resume Screening System
 * 
 * This file shows the database structure for MongoDB or any SQL database
 * Use this as a reference when migrating from in-memory storage
 */

// ============================================
// MONGODB SCHEMA (Using Mongoose)
// ============================================

const resumeSchema = {
    // Resume Collection
    Resume: {
        _id: "ObjectId",
        fileName: "String",
        originalName: "String",
        uploadedBy: "ObjectId (User)",
        uploadedAt: "Date",
        filePath: "String",
        fileSize: "Number",
        mimeType: "String",
        
        // Extracted content
        extractedText: "String",
        candidateName: "String",
        email: "String",
        phone: "String",
        
        // Status tracking
        status: "String", // 'uploaded', 'processing', 'analyzed', 'approved', 'rejected'
        analysisId: "ObjectId (Analysis)",
        
        createdAt: "Date",
        updatedAt: "Date"
    },
    
    // Analysis Collection
    Analysis: {
        _id: "ObjectId",
        resumeId: "ObjectId (Resume)",
        candidateName: "String",
        
        // AI Analysis Results
        score: "Number", // 0 to 1
        strengths: ["String"],
        weaknesses: ["String"],
        assessment: "String",
        feedback: "String",
        recommendation: "String", // 'APPROVED' or 'REJECTED'
        
        // Criteria Scores
        criteriaScores: {
            relevantExperience: "Number",
            skillsMatch: "Number",
            education: "Number",
            workHistory: "Number",
            achievements: "Number",
            cultureFit: "Number"
        },
        
        // Metadata
        analyzedBy: "String", // 'AI', 'Manual'
        analyzedAt: "Date",
        aiModel: "String",
        
        status: "String",
        createdAt: "Date",
        updatedAt: "Date"
    },
    
    // Approval Workflow Collection
    Approval: {
        _id: "ObjectId",
        analysisId: "ObjectId (Analysis)",
        resumeId: "ObjectId (Resume)",
        candidateName: "String",
        
        // AI Stage
        aiApprovalStatus: "String", // 'approved', 'rejected', 'pending'
        aiApprovedAt: "Date",
        aiNotes: "String",
        
        // Principal Stage
        principalApprovalStatus: "String", // 'pending', 'approved', 'rejected'
        principalReviewedBy: "ObjectId (User)",
        principalApprovedAt: "Date",
        principalNotes: "String",
        
        // Timeline
        sentToPrincipalAt: "Date",
        reminderSentAt: "Date",
        
        status: "String", // overall status
        createdAt: "Date",
        updatedAt: "Date"
    },
    
    // User Collection (for tracking who did what)
    User: {
        _id: "ObjectId",
        username: "String",
        email: "String",
        role: "String", // 'admin', 'recruiter', 'principal', 'viewer'
        
        // Audit trail
        createdAt: "Date",
        updatedAt: "Date",
        lastLogin: "Date"
    },
    
    // Audit Log Collection
    AuditLog: {
        _id: "ObjectId",
        userId: "ObjectId (User)",
        action: "String", // 'upload', 'analyze', 'approve', 'reject'
        entityType: "String", // 'Resume', 'Analysis', 'Approval'
        entityId: "ObjectId",
        
        details: {
            resumeName: "String",
            candidateName: "String",
            previousStatus: "String",
            newStatus: "String"
        },
        
        ipAddress: "String",
        timestamp: "Date"
    }
};

// ============================================
// SQL DATABASE SCHEMA
// ============================================

const sqlSchema = `
-- Resumes Table
CREATE TABLE resumes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    uploaded_by INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(500),
    file_size INT,
    mime_type VARCHAR(50),
    extracted_text LONGTEXT,
    candidate_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    status ENUM('uploaded', 'processing', 'analyzed', 'approved', 'rejected'),
    analysis_id INT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    FOREIGN KEY (analysis_id) REFERENCES analyses(id),
    INDEX (status),
    INDEX (candidate_name),
    INDEX (uploaded_at)
);

-- Analysis Table
CREATE TABLE analyses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resume_id INT NOT NULL,
    candidate_name VARCHAR(255),
    score DECIMAL(3, 2),
    strengths JSON,
    weaknesses JSON,
    assessment TEXT,
    feedback TEXT,
    recommendation ENUM('APPROVED', 'REJECTED'),
    
    -- Criteria Scores
    criteria_scores JSON,
    
    -- Metadata
    analyzed_by VARCHAR(50),
    analyzed_at TIMESTAMP,
    ai_model VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (resume_id) REFERENCES resumes(id),
    INDEX (score),
    INDEX (recommendation),
    INDEX (created_at)
);

-- Approvals Table
CREATE TABLE approvals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    analysis_id INT,
    resume_id INT,
    candidate_name VARCHAR(255),
    
    -- AI Stage
    ai_approval_status ENUM('approved', 'rejected', 'pending'),
    ai_approved_at TIMESTAMP NULL,
    ai_notes TEXT,
    
    -- Principal Stage
    principal_approval_status ENUM('pending', 'approved', 'rejected'),
    principal_reviewed_by INT,
    principal_approved_at TIMESTAMP NULL,
    principal_notes TEXT,
    
    -- Timeline
    sent_to_principal_at TIMESTAMP NULL,
    reminder_sent_at TIMESTAMP NULL,
    
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (analysis_id) REFERENCES analyses(id),
    FOREIGN KEY (resume_id) REFERENCES resumes(id),
    FOREIGN KEY (principal_reviewed_by) REFERENCES users(id),
    INDEX (status),
    INDEX (principal_approval_status),
    INDEX (created_at)
);

-- Users Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role ENUM('admin', 'recruiter', 'principal', 'viewer'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX (email),
    INDEX (role)
);

-- Audit Log Table
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id INT,
    
    -- Details as JSON
    details JSON,
    
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX (action),
    INDEX (entity_type),
    INDEX (timestamp),
    INDEX (user_id)
);
`;

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================

const indexes = `
-- Most frequently searched fields
CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_resumes_candidate ON resumes(candidate_name);
CREATE INDEX idx_resumes_date ON resumes(uploaded_at DESC);

CREATE INDEX idx_analyses_score ON analyses(score DESC);
CREATE INDEX idx_analyses_recommendation ON analyses(recommendation);

CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_principal_status ON approvals(principal_approval_status);

-- Composite indexes for common queries
CREATE INDEX idx_resumes_user_date ON resumes(uploaded_by, uploaded_at DESC);
CREATE INDEX idx_analyses_recommendation_score ON analyses(recommendation, score DESC);
`;

// ============================================
// SAMPLE QUERIES
// ============================================

const sampleQueries = `
-- Get all pending approvals
SELECT r.candidate_name, r.file_name, a.score, a.recommendation
FROM analyses a
JOIN resumes r ON a.resume_id = r.id
WHERE a.status = 'approved' AND a.recommendation = 'APPROVED'
ORDER BY a.score DESC;

-- Get approval workflow status
SELECT 
    r.candidate_name,
    a.ai_approval_status,
    a.principal_approval_status,
    a.sent_to_principal_at,
    u.email as principal_email
FROM approvals a
JOIN resumes r ON a.resume_id = r.id
LEFT JOIN users u ON a.principal_reviewed_by = u.id
WHERE a.status != 'completed'
ORDER BY a.sent_to_principal_at DESC;

-- Analytics: Approval rates
SELECT 
    recommendation,
    COUNT(*) as total,
    AVG(score) as avg_score,
    DATE(analyzed_at) as date
FROM analyses
WHERE analyzed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY recommendation, date
ORDER BY date DESC;

-- Audit trail for compliance
SELECT 
    u.username,
    a.action,
    a.entity_type,
    a.details,
    a.timestamp
FROM audit_logs a
JOIN users u ON a.user_id = u.id
ORDER BY a.timestamp DESC
LIMIT 100;
`;

module.exports = {
    resumeSchema,
    sqlSchema,
    indexes,
    sampleQueries
};
