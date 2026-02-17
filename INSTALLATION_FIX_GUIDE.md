# 🔧 Installation & Fix Guide - Upload & Connection Errors

## ❌ Problems You're Experiencing

1. **"Upload error"** - Files won't upload to server
2. **"Connection error"** - Cannot connect to `http://localhost:3000`

**Root Cause:** Node.js is NOT installed on your system, so the backend server cannot run.

---

## ✅ Step-by-Step Fix

### **Step 1: Install Node.js (REQUIRED)**

**Windows:**

1. Go to: https://nodejs.org/
2. Download **LTS version** (recommended)
3. Run the installer
4. Click **Next** through all prompts
5. **CHECK** ✅ the box: "Automatically install necessary tools"
6. Wait for installation to complete
7. **RESTART your computer** (very important!)

**Verify Installation:**

After restart, open PowerShell and type:
```powershell
node --version
npm --version
```

You should see version numbers like:
```
v18.17.0
9.6.7
```

If you see errors, **restart PowerShell and try again**.

---

### **Step 2: Install Project Dependencies**

Open PowerShell in the project folder:

```powershell
cd "c:\Users\Dharshan\OneDrive\Desktop\ai app"
npm install
```

Wait 2-5 minutes for all packages to download. You should see:
```
added XXX packages
```

---

### **Step 3: Start the Server**

In the same PowerShell window:

```powershell
npm start
```

You should see:
```
============================================================
🤖 AI Resume Screening System Started
============================================================
✓ Server running at: http://localhost:3000
✓ API Base URL: http://localhost:3000/api
✓ Frontend: http://localhost:3000
✓ Health Check: http://localhost:3000/api/health
✓ Environment: development
============================================================

📋 Available Endpoints:
  POST   /api/upload          - Upload resumes
  POST   /api/analyze         - Analyze uploaded resume
  POST   /api/send-approval   - Send to principal
  GET    /api/results         - Get all analysis results
  GET    /api/stats           - Get system statistics
  GET    /api/health          - Health check
  POST   /api/cleanup         - Clear all uploads
============================================================
```

**Keep this PowerShell window OPEN!** This is your server running.

---

### **Step 4: Open the Application**

Open your web browser and go to:

```
http://localhost:3000
```

You should see the **blue AI Resume Screening System** interface.

---

## 🧪 Test the Upload

1. **Upload a test resume**
   - Click "Choose Files" or drag & drop a PDF/DOC file
   - File size: less than 10MB
   - Formats: PDF, DOCX, DOC, or TXT

2. **Expected Workflow:**
   - ✅ File uploads successfully
   - 🔄 AI analyzes the resume
   - ✅ Results appear with score (0-100%)
   - ✅ Candidate approved/rejected based on score

3. **If Still Getting Errors:**
   - Check that server is running (PowerShell shows no errors)
   - Check browser console (F12) for specific error messages
   - Verify `.env` file has your OpenAI API key

---

## 🆘 Common Errors & Solutions

### Error: `npm: The term 'npm' is not recognized`

**Solution:** Node.js not installed
- Install Node.js from https://nodejs.org/ (LTS version)
- Restart PowerShell after installation
- Try `npm --version` again

---

### Error: `Cannot find module 'express'`

**Solution:** Dependencies not installed
```powershell
npm install
```

---

### Error: `Failed to fetch` / `Cannot connect to localhost:3000`

**Solution:** Server not running
1. Make sure PowerShell window with `npm start` is still open
2. Check for errors in that PowerShell window
3. Try restarting: Stop (Ctrl+C) and run `npm start` again

---

### Error: `ERR_CONNECTION_REFUSED`

**Solution:** Server crashed or not started
```powershell
# Stop server with Ctrl+C
# Then restart:
npm start
```

---

### Error: `API key not valid` or `OpenAI error`

**Solution:** Check `.env` file
1. Open `.env` file in text editor
2. Verify `OPENAI_API_KEY` is correct
3. It should start with: `sk-proj-`
4. Restart server: `npm start`

---

### Error: `File too large` 

**Solution:** Resume file is over 10MB
- Check file size before uploading
- Maximum: 10MB per file

---

### Error: `Invalid file type`

**Solution:** File format not supported
- Supported: PDF, DOCX, DOC, TXT
- Check file extension
- Convert file if needed

---

## 📋 Troubleshooting Checklist

Before testing, verify:

- ✅ Node.js installed (`node --version` works)
- ✅ npm installed (`npm --version` works)  
- ✅ Project packages installed (`npm install` completed)
- ✅ .env file exists with API key
- ✅ Server running (`npm start` shows no errors)
- ✅ Browser can reach `http://localhost:3000`
- ✅ Resume file is PDF/DOC/DOCX/TXT format
- ✅ Resume file is less than 10MB
- ✅ Internet connection is active (needed for AI analysis)

---

## 🚀 What's Fixed

Your system now has:

✅ **Better error messages** - Clear indication when server isn't running
✅ **Improved CORS** - Accepts requests from all localhost addresses
✅ **PDF support** - Added `pdf-parse` library for better PDF text extraction
✅ **Robust file handling** - Falls back gracefully if file format not supported
✅ **Connection error detection** - Frontend tells you exactly what's wrong
✅ **Larger file uploads** - Can accept up to 50MB now (max 10MB per file still applies)

---

## 📞 Still Having Issues?

1. **Check browser console** (Press F12)
   - Look for red error messages
   - Tell me what it says

2. **Check server console** (PowerShell window)
   - Look for error messages
   - Tell me what it shows

3. **Verify each step above** in order
   - Most issues are from missing Node.js or npm

4. **Restart everything:**
   ```powershell
   # Stop server: Ctrl+C
   # Close PowerShell
   # Reopen PowerShell
   cd "c:\Users\Dharshan\OneDrive\Desktop\ai app"
   npm start
   ```

---

## 💡 Pro Tips

- Keep the `npm start` PowerShell window open while using the app
- The system works best with 2-3 resumes at a time
- Each analysis costs a small amount of your OpenAI API credits
- You can view all analyses at: `http://localhost:3000/api/results`

---

**You're all set! Run `npm start` and enjoy your AI Resume Screening System! 🎉**
