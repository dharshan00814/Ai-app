/**
 * DEPLOYMENT GUIDE - AI Resume Screening System
 * Instructions for deploying to production environments
 */

// ============================================
// 1. ENVIRONMENT SETUP
// ============================================

const productionEnv = `
# .env.production
OPENAI_API_KEY=sk-proj-your-api-key-here
PORT=3000
NODE_ENV=production

# Database Configuration (if using MongoDB)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
DB_TYPE=mongodb

# Or SQL Database
DB_HOST=your-db-host.com
DB_PORT=5432
DB_USER=dbuser
DB_PASSWORD=securepassword
DB_NAME=resume_screening
DB_TYPE=postgresql

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@company.com
PRINCIPAL_EMAIL=principal@company.com

# Security
JWT_SECRET=your-very-long-random-secret-key-here
SESSION_SECRET=another-random-secret-key

# File Upload
MAX_FILE_SIZE=10485760
UPLOADS_DIR=/var/uploads
TEMP_DIR=/var/temp

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/resume-screening.log

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com
`;

// ============================================
// 2. SECURITY CHECKLIST
// ============================================

const securityChecklist = `
☐ Never commit .env files to version control
☐ Use environment variables for all secrets
☐ Enable HTTPS/SSL certificates
☐ Set secure session cookies (sameSite, secure flags)
☐ Implement rate limiting on all endpoints
☐ Add input validation and sanitization
☐ Use CORS properly (restrict origins)
☐ Implement authentication (JWT or OAuth)
☐ Add request logging and monitoring
☐ Set up API key rotation schedule
☐ Enable request size limits
☐ Sanitize file uploads
☐ Implement CSRF protection
☐ Use helmet.js for security headers
☐ Set up proper error handling (no stack traces in production)
☐ Enable database encryption
☐ Regular security audits
☐ Implement backup and disaster recovery
`;

// ============================================
// 3. HEROKU DEPLOYMENT
// ============================================

const herokuDeployment = `
# Prerequisites:
1. Install Heroku CLI
2. Create Heroku account

# Steps:

# 1. Login to Heroku
heroku login

# 2. Create Heroku app
heroku create your-app-name

# 3. Set environment variables
heroku config:set OPENAI_API_KEY=sk-proj-xxxx
heroku config:set PRINCIPAL_EMAIL=principal@company.com

# 4. Create Procfile (already included)

# 5. Deploy
git init
git add .
git commit -m "Initial commit"
git push heroku main

# 6. View logs
heroku logs --tail

# 7. Open app
heroku open

# Add MongoDB (optional)
heroku addons:create mongolab:sandbox
`;

// ============================================
// 4. AWS DEPLOYMENT
// ============================================

const awsDeployment = `
# Using AWS Elastic Beanstalk

# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
eb init -p node.js-18 resume-screening --region us-east-1

# 3. Create environment
eb create production

# 4. Set environment variables
eb setenv OPENAI_API_KEY=sk-proj-xxxx PRINCIPAL_EMAIL=principal@company.com

# 5. Deploy
eb deploy

# 6. View logs
eb logs

# 7. Monitor
eb health

# Alternative: Using Docker & ECS
docker build -t resume-screening .
aws ecr get-login --no-include-email
docker tag resume-screening:latest <account>.dkr.ecr.us-east-1.amazonaws.com/resume-screening:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/resume-screening:latest
`;

// ============================================
// 5. DOCKER DEPLOYMENT
// ============================================

const dockerfile = `
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
`;

const dockerCompose = `
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=sk-proj-xxxx
      - MONGODB_URI=mongodb://mongo:27017/resume_screening
      - NODE_ENV=production
    depends_on:
      - mongo
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
    networks:
      - resume-network

  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped
    networks:
      - resume-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - resume-network

volumes:
  mongo-data:

networks:
  resume-network:
    driver: bridge
`;

// ============================================
// 6. PERFORMANCE OPTIMIZATION
// ============================================

const performanceOptimization = `
// 1. Add caching
- Implement Redis for session storage
- Cache OpenAI responses
- Use CDN for static assets

// 2. Database optimization
- Create proper indexes
- Use connection pooling
- Implement query optimization

// 3. API optimization
- Enable gzip compression
- Implement pagination
- Use lazy loading
- Add request caching headers

// 4. Code optimization
- Minify JavaScript/CSS
- Use async/await properly
- Implement database transactions
- Use worker threads for heavy processing

// 5. Monitoring
- Set up application monitoring (New Relic, Datadog)
- Enable error tracking (Sentry)
- Set up alerting
- Monitor API performance metrics
`;

// ============================================
// 7. SCALING STRATEGY
// ============================================

const scalingStrategy = `
// Phase 1: Single Server (Current)
- Single Node.js process
- Local file storage
- In-memory data store

// Phase 2: Multiple Servers
- Load balancer (Nginx, HAProxy)
- Separate database server
- File storage (AWS S3, Azure Blob)
- Session management (Redis)

// Phase 3: Advanced Scaling
- Microservices architecture
- Message queues (RabbitMQ, Kafka)
- Cache layers (Redis, Memcached)
- Full content delivery network
- Auto-scaling based on load

// Phase 4: Global Scale
- Multiple regions
- Database replication
- Global load balancing
- Disaster recovery
`;

// ============================================
// 8. MONITORING & ALERTING
// ============================================

const monitoringSetup = `
Key Metrics to Monitor:
1. Request latency (p50, p95, p99)
2. Error rates
3. API response times
4. AI analysis processing time
5. Database query performance
6. File upload success rates
7. Server CPU/Memory usage
8. Session count
9. Concurrent users
10. Cost per analysis

Alerts:
- Error rate > 1%
- Response time > 5s
- API key usage > 80% limit
- Database connection errors
- Disk space < 10%
- Memory usage > 85%
`;

// ============================================
// 9. BACKUP & DISASTER RECOVERY
// ============================================

const disasterRecovery = `
Backup Strategy:
- Daily database backups
- Weekly full backups
- Store backups in multiple regions
- Test restore procedures monthly

Disaster Recovery Plan:
1. Identify critical data
2. Set RTO (Recovery Time Objective): 1 hour
3. Set RPO (Recovery Point Objective): 15 minutes
4. Document procedures
5. Test quarterly
6. Maintain runbooks
7. Have on-call support

Backup Tools:
- AWS Backup
- Mongo Atlas Backup
- PostgreSQL pgbackrest
- Custom backup scripts
`;

module.exports = {
    productionEnv,
    securityChecklist,
    herokuDeployment,
    awsDeployment,
    dockerfile,
    dockerCompose,
    performanceOptimization,
    scalingStrategy,
    monitoringSetup,
    disasterRecovery
};
`;
