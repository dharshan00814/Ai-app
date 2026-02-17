/**
 * System Utilities & Helper Functions
 * Copy and paste these into your server/utils.js for production
 */

// ============================================
// 1. LOGGER UTILITY
// ============================================

class Logger {
    constructor(label = 'APP') {
        this.label = label;
    }

    log(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ℹ️  ${this.label}: ${message}`, data || '');
    }

    error(message, error = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.error(`[${timestamp}] ❌ ${this.label}: ${message}`, error || '');
    }

    success(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ✅ ${this.label}: ${message}`, data || '');
    }

    warning(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.warn(`[${timestamp}] ⚠️  ${this.label}: ${message}`, data || '');
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] 🐛 ${this.label}: ${message}`, data || '');
        }
    }
}

// ============================================
// 2. STATS TRACKER
// ============================================

class StatsTracker {
    constructor() {
        this.stats = {
            totalRequests: 0,
            successfulUploads: 0,
            failedUploads: 0,
            totalAnalyzed: 0,
            successfulAnalysis: 0,
            failedAnalysis: 0,
            approvedCount: 0,
            rejectedCount: 0,
            averageAnalysisTime: 0,
            startTime: Date.now()
        };
    }

    recordRequest() {
        this.stats.totalRequests++;
    }

    recordUpload(success = true) {
        if (success) {
            this.stats.successfulUploads++;
        } else {
            this.stats.failedUploads++;
        }
    }

    recordAnalysis(success = true, analysisTime = 0) {
        this.stats.totalAnalyzed++;
        if (success) {
            this.stats.successfulAnalysis++;
        } else {
            this.stats.failedAnalysis++;
        }
        // Update average time
        this.stats.averageAnalysisTime = 
            (this.stats.averageAnalysisTime * (this.stats.totalAnalyzed - 1) + analysisTime) / 
            this.stats.totalAnalyzed;
    }

    recordApproval(type) {
        if (type === 'approved') {
            this.stats.approvedCount++;
        } else if (type === 'rejected') {
            this.stats.rejectedCount++;
        }
    }

    getStats() {
        const uptime = Math.round((Date.now() - this.stats.startTime) / 1000);
        return {
            ...this.stats,
            uptime,
            successRate: this.stats.totalRequests > 0 
                ? ((this.stats.successfulAnalysis / this.stats.totalAnalyzed) * 100).toFixed(2) 
                : 0
        };
    }

    reset() {
        this.stats = { ...this.stats, ...{
            totalRequests: 0,
            successfulUploads: 0,
            failedUploads: 0,
            totalAnalyzed: 0,
            successfulAnalysis: 0,
            failedAnalysis: 0,
            approvedCount: 0,
            rejectedCount: 0,
            averageAnalysisTime: 0
        }};
    }
}

// ============================================
// 3. CACHE UTILITY
// ============================================

class SimpleCache {
    constructor(ttl = 3600000) { // 1 hour default
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, value) {
        const expiresAt = Date.now() + this.ttl;
        this.cache.set(key, { value, expiresAt });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    clear() {
        this.cache.clear();
    }

    cleanup() {
        const now = Date.now();
        for (let [key, item] of this.cache) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
}

// ============================================
// 4. VALIDATION UTILITIES
// ============================================

class Validator {
    static validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    static validateFileName(fileName) {
        // Prevent path traversal
        const unsafe = ['../', '\\..\\', '//', '\\\\'];
        return !unsafe.some(pattern => fileName.includes(pattern));
    }

    static validateFileSize(size, maxSize = 10 * 1024 * 1024) {
        return size <= maxSize;
    }

    static validateFileType(fileName, allowed = ['pdf', 'docx', 'doc', 'txt']) {
        const ext = fileName.split('.').pop().toLowerCase();
        return allowed.includes(ext);
    }

    static sanitizeInput(input) {
        return input
            .trim()
            .replace(/[<>]/g, '')
            .substring(0, 1000); // Max 1000 chars
    }

    static validateScore(score) {
        return score >= 0 && score <= 1 && typeof score === 'number';
    }
}

// ============================================
// 5. PERFORMANCE MONITOR
// ============================================

class PerformanceMonitor {
    constructor() {
        this.timers = new Map();
    }

    start(name) {
        this.timers.set(name, Date.now());
    }

    end(name) {
        if (!this.timers.has(name)) {
            return null;
        }
        
        const startTime = this.timers.get(name);
        const duration = Date.now() - startTime;
        this.timers.delete(name);
        
        return duration;
    }

    measure(name, fn) {
        this.start(name);
        const result = fn();
        const duration = this.end(name);
        
        console.log(`⏱️  ${name}: ${duration}ms`);
        return { result, duration };
    }

    async measureAsync(name, asyncFn) {
        this.start(name);
        const result = await asyncFn();
        const duration = this.end(name);
        
        console.log(`⏱️  ${name}: ${duration}ms`);
        return { result, duration };
    }
}

// ============================================
// 6. ERROR HANDLER
// ============================================

class ErrorHandler {
    static getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }

    static getErrorType(error) {
        if (error.name) return error.name;
        return typeof error;
    }

    static isOperationalError(error) {
        if (error instanceof Error) {
            return error instanceof ValidationError || 
                   error instanceof AuthenticationError ||
                   error instanceof AuthorizationError;
        }
        return false;
    }

    static formatError(error, includeStack = false) {
        const formatted = {
            message: this.getErrorMessage(error),
            type: this.getErrorType(error),
            timestamp: new Date().toISOString()
        };

        if (includeStack && error.stack) {
            formatted.stack = error.stack;
        }

        return formatted;
    }
}

// ============================================
// 7. CUSTOM ERRORS
// ============================================

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
    }
}

class AuthenticationError extends Error {
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = 401;
    }
}

class AuthorizationError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'AuthorizationError';
        this.statusCode = 403;
    }
}

class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

// ============================================
// 8. FILE UTILITIES
// ============================================

const fs = require('fs');
const path = require('path');

class FileUtils {
    static ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            return true;
        }
        return false;
    }

    static deleteFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return true;
            }
        } catch (error) {
            console.error(`Error deleting file: ${error.message}`);
        }
        return false;
    }

    static getFileSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch (error) {
            return null;
        }
    }

    static cleanupOldFiles(dirPath, maxAgeMs = 24*60*60*1000) {
        try {
            const files = fs.readdirSync(dirPath);
            const now = Date.now();

            files.forEach(file => {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                
                if (now - stats.mtime.getTime() > maxAgeMs) {
                    fs.unlinkSync(filePath);
                }
            });
        } catch (error) {
            console.error(`Error cleaning up files: ${error.message}`);
        }
    }
}

// ============================================
// USAGE EXAMPLES
// ============================================

const usageExamples = `
// Logger
const logger = new Logger('ANALYZER');
logger.success('Analysis complete');
logger.error('Analysis failed', err);

// Stats Tracker
const stats = new StatsTracker();
stats.recordRequest();
stats.recordAnalysis(true, 5000);
console.log(stats.getStats());

// Cache
const cache = new SimpleCache();
cache.set('key1', 'value1');
console.log(cache.get('key1')); // 'value1'

// Validator
Validator.validateEmail('test@example.com'); // true
Validator.validateFileSize(1024, 10*1024*1024); // true
Validator.validateFileType('resume.pdf'); // true

// Performance Monitor
const monitor = new PerformanceMonitor();
monitor.start('request');
// ... do something ...
const duration = monitor.end('request'); // Get duration in ms

// Error Handler
try {
    throw new ValidationError('Invalid input');
} catch (err) {
    const formatted = ErrorHandler.formatError(err);
    console.log(formatted);
}

// File Utilities
FileUtils.ensureDirectoryExists('./uploads');
FileUtils.cleanupOldFiles('./uploads', 24*60*60*1000);
`;

module.exports = {
    Logger,
    StatsTracker,
    SimpleCache,
    Validator,
    PerformanceMonitor,
    ErrorHandler,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    FileUtils
};
