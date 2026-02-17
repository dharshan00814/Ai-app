# 🚀 Developer Quick Reference

## Project Overview

```
AI Resume Screening System
├── Frontend: index.html (React-like vanilla JS)
├── Backend: server/server.js (Express.js + OpenAI)
├── API: RESTful endpoints
├── Storage: Local files + in-memory (dev)
└── AI: OpenAI GPT-3.5-turbo
```

---

## Quick Commands

```powershell
# Setup
npm install

# Development
npm start              # Start server
npm run dev           # Start with auto-reload

# Testing
npm test              # Run tests (if available)

# Cleanup
rm -r node_modules
npm install           # Fresh install
```

---

## Project Structure

```
.
├── index.html                 # Frontend
├── server/
│   ├── server.js             # Main API
│   └── config.js             # Configuration
├── uploads/                  # Resume storage
├── package.json              # Dependencies
├── .env                      # Configuration
├── README.md                 # Main docs
├── QUICK_START.md           # Quick setup
├── TROUBLESHOOTING.md       # Troubleshooting
├── TESTING.js               # Test utilities
└── PRODUCTION_CHECKLIST.md  # Deploy checklist
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | System health check |
| `/api/stats` | GET | System statistics |
| `/api/upload` | POST | Upload resumes |
| `/api/analyze` | POST | AI analysis |
| `/api/send-approval` | POST | Send to principal |
| `/api/results` | GET | Get all results |
| `/api/cleanup` | POST | Clear uploads |

---

## Key Files

### Frontend (index.html)
- Drag-drop interface
- Real-time updates
- Statistics dashboard
- Result display

### Backend (server/server.js)
- Express.js server
- File upload handling
- OpenAI integration
- Error handling
- Rate limiting

### Configuration (server/config.js)
- Scoring thresholds
- Criteria weights
- File upload limits
- AI settings

---

## Development Workflow

### 1. Start Server
```powershell
npm start
# Server runs on http://localhost:3000
```

### 2. Open Frontend
```
http://localhost:3000
```

### 3. Upload Resume
- Drag & drop or click to select
- Supported: PDF, DOCX, DOC, TXT
- Max 10MB

### 4. Watch Analysis
- AI analyzes resume
- Shows results in real-time
- Displays scores and feedback

### 5. Approve/Reject
- Click "Send to Principal" for approved
- Click "Delete" to remove

---

## Debugging

### Browser Console (F12)
```javascript
// Check health
await testHealth()

// Get stats
await testStats()

// Get all results
await testGetResults()

// Monitor network
logNetworkRequests()
```

### Server Logs
- Terminal shows:
  - Request logs
  - Analysis progress
  - Errors
  - Status updates

### Common Issues

| Issue | Solution |
|-------|----------|
| Port in use | Change PORT in .env |
| Module not found | Run `npm install` |
| API key invalid | Check .env file |
| Upload fails | Check file format & size |
| Analysis slow | Check internet, reduce files |

---

## Environment Variables

```env
# Required
OPENAI_API_KEY=sk-proj-...

# Optional
PORT=3000
NODE_ENV=development
PRINCIPAL_EMAIL=principal@company.com
```

---

## Testing

```bash
# Health check
curl http://localhost:3000/api/health

# Get stats
curl http://localhost:3000/api/stats

# Get results
curl http://localhost:3000/api/results
```

---

## Code Snippets

### Upload Resume (Frontend)
```javascript
const formData = new FormData();
formData.append('resumes', file);

const response = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData
});
```

### Analyze Resume (Backend)
```javascript
const analysis = await analyzeResumeWithAI(resumeText, candidateName);
```

### Send for Approval
```javascript
await fetch('http://localhost:3000/api/send-approval', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateName, analysis })
});
```

---

## Performance Tips

1. **Reduce file size** - Smaller PDFs process faster
2. **Limit uploads** - Upload fewer files at once
3. **Use SSD** - Faster file operations
4. **Fast internet** - For OpenAI API calls
5. **Monitor resources** - Check CPU/Memory usage

---

## Security Checklist

- [ ] `.env` not committed to Git
- [ ] API key is valid
- [ ] CORS is configured
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] Error handling complete
- [ ] No secrets in logs
- [ ] HTTPS for production

---

## Deployment Options

- **Local:** `npm start`
- **Heroku:** `git push heroku main`
- **Docker:** `docker build -t app . && docker run -p 3000:3000 app`
- **AWS:** Use Elastic Beanstalk
- **Azure:** Use App Service

---

## Adding Features

### 1. Add New Endpoint
```javascript
// server/server.js
app.get('/api/newfeature', asyncHandler(async (req, res) => {
    // Your code here
    res.json({ success: true, data: {} });
}));
```

### 2. Update Frontend
```javascript
// index.html
async function newFeature() {
    const response = await fetch('http://localhost:3000/api/newfeature');
    const data = await response.json();
    // Handle response
}
```

### 3. Update Configuration
```javascript
// server/config.js
NEW_SETTING: 'value'
```

---

## File Organization

### Frontend JSX Structure (if migrating to React)
```
src/
├── components/
│   ├── UploadArea.jsx
│   ├── ResultsDisplay.jsx
│   └── Statistics.jsx
├── services/
│   └── api.js
└── App.jsx
```

### Backend Route Structure
```
server/
├── routes/
│   ├── upload.js
│   ├── analyze.js
│   └── approvals.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
└── utils/
    └── resumeParser.js
```

---

## Performance Metrics

### Target Performance
- Upload: < 2s
- Analysis: < 10s
- Response time: < 500ms
- System health: 100% uptime

### Monitoring
- Track response times
- Monitor error rates
- Watch API usage
- Check server resources

---

## Next Steps

1. **Test System:** Upload sample resumes
2. **Review Logs:** Check console output
3. **Customize:** Adjust scoring in config
4. **Deploy:** Follow PRODUCTION_CHECKLIST.md
5. **Monitor:** Set up alerts and dashboards
6. **Enhance:** Add database, auth, etc.

---

## Resources

- OpenAI API: https://platform.openai.com/
- Express.js: https://expressjs.com/
- Node.js: https://nodejs.org/
- Multer (File Upload): https://www.npmjs.com/package/multer

---

## Contact & Support

- **Issues:** Check TROUBLESHOOTING.md
- **Setup:** Read QUICK_START.md
- **Deploy:** See PRODUCTION_CHECKLIST.md
- **Testing:** Use TESTING.js
- **API Help:** Review API_EXAMPLES.js

---

**Happy Coding! 🚀**
