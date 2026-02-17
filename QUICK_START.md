# Quick Start Guide for AI Resume Screening System

## 🚀 Getting Started in 2 Minutes

### **On Windows:**

1. **Open PowerShell or Command Prompt** in the project folder
2. **Run this command:**
   ```powershell
   npm install && npm start
   ```
3. **Open browser:** `http://localhost:3000`

**OR** Double-click `start.bat` file

---

### **On Mac/Linux:**

1. **Open Terminal** in the project folder
2. **Run this command:**
   ```bash
   npm install && npm start
   ```
3. **Open browser:** `http://localhost:3000`

**OR** Run: `bash start.sh`

---

## 📋 Quick Reference

| Action | Command |
|--------|---------|
| Install Deps | `npm install` |
| Start Server | `npm start` |
| Dev Mode (auto-reload) | `npm run dev` |
| Check Health | Ctrl+Click on API endpoints |

---

## 🎯 How to Use

1. **Upload Resumes** - Drag & drop or click to select PDF/DOCX/TXT files
2. **AI Analyzes** - System automatically analyzes with OpenAI GPT
3. **View Results** - Check scores, strengths, and weaknesses
4. **Approve** - Click "Send to Principal" for approved resumes
5. **Principal Reviews** - Approved resumes go to principal for final decision

---

## 🔑 API Key Configuration

Your OpenAI API key is already configured in `.env`:
- Keep it secure - never share in public repositories
- Replace it with your own key if needed

---

## 📊 Features

✅ Drag & drop resume upload
✅ AI-powered resume analysis  
✅ Match scoring (0-100%)
✅ Two-tier approval workflow
✅ Real-time status tracking
✅ Send to principal for final approval
✅ Mobile responsive design

---

## ⚠️ Troubleshooting

**Port 3000 in use?**
```powershell
# Change PORT in .env to 3001
```

**Module not found?**
```powershell
npm install
```

**API Error?**
- Check OpenAI API key in `.env`
- Ensure you have API credits
- Check internet connection

---

## 📧 System Workflow

```
Employee Upload Resume
         ↓
    AI Analysis
         ↓
    ✅ APPROVED? → Send to Principal
         ↓
    ❌ REJECTED → Feedback Shown
```

---

## 🎓 Learning Resources

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Express.js Guide](https://expressjs.com)
- [Node.js Documentation](https://nodejs.org/docs)

---

**Ready to start?** Run `npm start` now! 🚀
