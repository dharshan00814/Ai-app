# 🤖 AI Resume Screening System

An intelligent resume screening and approval workflow system powered by OpenAI's GPT model.

## Features

✅ **Automated Resume Upload** - Support for PDF, DOCX, DOC, and TXT formats
✅ **AI-Powered Analysis** - Uses OpenAI GPT to evaluate resumes
✅ **Smart Scoring** - Provides match scores (0-1) based on resume content
✅ **Two-Tier Approval** - AI approval followed by Principal approval
✅ **Real-time Feedback** - Instant analysis with strengths and weaknesses
✅ **Status Tracking** - Monitor approved, rejected, and pending resumes
✅ **Principal Notification** - Send approved resumes to principal for final decision

## System Workflow

1. **Employee/Recruiter** uploads resume (PDF, DOCX, DOC, or TXT)
2. **AI Analysis** - System analyzes resume using OpenAI GPT
3. **Approval Decision**:
   - ✅ **Approved** - Sent to Principal for final approval
   - ❌ **Rejected** - Filtered out from further consideration
4. **Principal Review** - Principal receives approved resumes for final decision

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenAI API Key

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Setup
The `.env` file is already configured with your OpenAI API key:
```
OPENAI_API_KEY=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
PORT=3000
NODE_ENV=development
PRINCIPAL_EMAIL=principal@company.com
```

### Step 3: Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The system will start on `http://localhost:3000`

## Usage

### 1. Access the Interface
Open your browser to `http://localhost:3000`

### 2. Upload Resumes
- Click on the upload area or drag & drop resume files
- Supports: PDF, DOCX, DOC, TXT formats
- Maximum file size: 10MB

### 3. View Analysis Results
- See real-time AI analysis in the results panel
- Each resume shows:
  - Match Score (0-100%)
  - Analysis Summary
  - Strengths & Weaknesses
  - Approval Status

### 4. Send to Principal
- Click "Send to Principal" for approved resumes
- Principal receives notification for final approval

## API Endpoints

### Upload Resumes
**POST** `/api/upload`
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "resumes=@resume.pdf" \
  -F "resumes=@resume2.docx"
```

### Analyze Resume
**POST** `/api/analyze`
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"fileId": "unique-file-id"}'
```

### Send for Principal Approval
**POST** `/api/send-approval`
```bash
curl -X POST http://localhost:3000/api/send-approval \
  -H "Content-Type: application/json" \
  -d '{
    "candidateName": "John Doe",
    "analysis": {...}
  }'
```

### Get All Results
**GET** `/api/results`
```bash
curl http://localhost:3000/api/results
```

### Health Check
**GET** `/api/health`
```bash
curl http://localhost:3000/api/health
```

## Analysis Criteria

The AI evaluates resumes based on:
- **Relevant Experience** - Years and type of experience
- **Skills Match** - Technical and soft skills
- **Education** - Qualifications and certifications
- **Work History** - Job progression and achievements
- **Gaps & Red Flags** - Employment gaps, experience mismatch
- **Overall Fit** - General suitability for roles

## Score Interpretation

- **0.9 - 1.0** 🟢 Excellent - Highly recommended
- **0.7 - 0.9** 🟡 Good - Suitable candidate
- **0.5 - 0.7** 🟠 Fair - Some concerns
- **Below 0.5** 🔴 Poor - Not recommended

## Project Structure

```
ai app/
├── index.html           # Frontend interface
├── package.json         # Dependencies
├── .env                 # Environment configuration
├── README.md            # Documentation
├── server/
│   └── server.js        # Backend API server
├── uploads/             # Uploaded resume storage
└── public/              # Static files
```

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **AI**: OpenAI GPT API
- **File Handling**: Multer
- **Text Extraction**: PDFParse, Mammoth (Word docs)

## Security Considerations

⚠️ **Important**: The API key in `.env` is sensitive. In production:
1. Never commit `.env` to version control
2. Use environment variables or secrets manager
3. Implement authentication/authorization
4. Add rate limiting
5. Validate and sanitize all inputs
6. Use HTTPS for API calls

## Troubleshooting

### Port Already in Use
```bash
# Change port in .env file
PORT=3001
```

### API Key Invalid
- Check `.env` file for correct OpenAI API key
- Ensure API key has no extra spaces
- Verify API key has sufficient credits

### File Upload Fails
- Check file size (max 10MB)
- Supported formats: PDF, DOCX, DOC, TXT
- Ensure uploads folder exists and has write permissions

### AI Analysis Error
- Verify OpenAI API is accessible
- Check API rate limits
- Review error message in console

## Future Enhancements

- 📊 Database integration (MongoDB/PostgreSQL)
- 🔐 User authentication and roles
- 📧 Email notifications to principal
- 📈 Analytics dashboard
- 🔍 Advanced filtering and search
- 🎯 Customizable screening criteria
- ⚡ Batch processing
- 📱 Mobile app

## Support

For issues or questions:
1. Check the logs in console
2. Verify all environment variables are set
3. Ensure Node.js and dependencies are installed
4. Review OpenAI API documentation

## License

ISC

## Contact

For support or inquiries, contact your system administrator.

---

**Version**: 1.0.0  
**Last Updated**: February 2026
