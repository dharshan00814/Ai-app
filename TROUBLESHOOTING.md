# 🔧 Troubleshooting Guide

## ⚠️ Common Issues & Solutions

### Issue 1: Port 3000 Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

**Option A: Change the port**
```powershell
# Edit .env file
PORT=3001

# Or set environment variable
$env:PORT=3001
npm start
```

**Option B: Kill the process using port 3000**
```powershell
# Find process
netstat -ano | findstr :3000

# Kill by PID (replace XXXX with actual PID)
taskkill /PID XXXX /F

# Then restart
npm start
```

**Option C: Use different port temporarily**
```powershell
npm start -- --port 3001
```

---

### Issue 2: "npm not found" or "Cannot find module"

**Error Message:**
```
'npm' is not recognized as an internal or external command
```

**Solutions:**

1. **Install Node.js**
   - Download from https://nodejs.org
   - Choose LTS version
   - Run installer and follow prompts

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Verify installation**
   ```powershell
   npm --version
   node --version
   ```

---

### Issue 3: API Key Errors

**Error Message:**
```
Error: Invalid OpenAI API key
```

**Solutions:**

1. **Check .env file**
   ```powershell
   # Check if .env exists in root folder
   Test-Path .env
   ```

2. **Verify API key**
   ```powershell
   # View API key (first 20 chars)
   Get-Content .env | Select-String "OPENAI_API_KEY"
   ```

3. **Regenerate key if needed**
   - Go to https://platform.openai.com/account/api-keys
   - Create new key
   - Update .env file

4. **Check API credits**
   - Visit https://platform.openai.com/account/billing/overview
   - Ensure you have sufficient credits

---

### Issue 4: Resume Upload Fails

**Error Message:**
```
Upload failed: Invalid file type
```

**Solutions:**

1. **Check file format**
   - Supported: PDF, DOCX, DOC, TXT
   - Verify file extension is correct

2. **Check file size**
   - Maximum: 10MB
   - Use: `Get-Item filename.pdf | Select-Object Length`

3. **Check uploads folder permissions**
   ```powershell
   # Ensure uploads folder exists and is writable
   Test-Path .\uploads\
   ```

4. **Create uploads folder if missing**
   ```powershell
   New-Item -Path .\uploads -ItemType Directory -Force
   ```

---

### Issue 5: System Running Slowly

**Symptoms:**
- Slow resume analysis
- Delayed response times
- High CPU/Memory usage

**Solutions:**

1. **Check system resources**
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -eq "node"} | Select-Object CPU, Memory
   ```

2. **Clear uploads folder**
   - Delete old files from `uploads/`
   - Or use API: `POST /api/cleanup`

3. **Reduce concurrent uploads**
   - Upload fewer resumes at once
   - Wait for analysis to complete

4. **Check internet connection**
   - OpenAI API calls require internet
   - Verify connection speed

5. **Restart server**
   ```powershell
   # Stop current server (Ctrl+C)
   # Then restart
   npm start
   ```

---

### Issue 6: "Cannot GET /" Error

**Symptoms:**
- Browser shows "Cannot GET /"
- Frontend not loading

**Solutions:**

1. **Check if frontend file exists**
   ```powershell
   Test-Path .\index.html
   ```

2. **Restart server**
   ```powershell
   npm start
   ```

3. **Clear browser cache**
   - Press Ctrl+Shift+Delete
   - Clear cache and cookies
   - Reload page

4. **Check console for errors**
   - Press F12 in browser
   - Check console tab for errors

---

### Issue 7: CORS Errors in Browser

**Error Message:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**

This is usually a server issue. Verify CORS is enabled:

```javascript
// In server/server.js, should have:
app.use(cors());
```

If issue persists:
1. Restart server: `npm start`
2. Clear browser cache: Ctrl+Shift+Delete
3. Try different browser

---

### Issue 8: Analysis Returns Empty or Error

**Symptoms:**
- Resume analyzed but no results shown
- "Error during AI analysis" message

**Solutions:**

1. **Check resume content**
   - Resume file might be corrupted
   - Try different resume file

2. **Check API rate limit**
   - OpenAI has rate limits
   - Wait a minute and try again

3. **Review browser console (F12)**
   - Check for error messages
   - Note exact error text

4. **Check server logs**
   - Look at terminal output
   - Should show analysis progress

5. **Try smaller resume**
   - Large resumes (>50KB text) might fail
   - Extract key sections and try again

---

### Issue 9: "Cannot find path" Error

**Error Message:**
```
Cannot find path 'C:\Users\...\uploads' because it does not exist
```

**Solution:**

```powershell
# Create uploads directory
New-Item -Path .\uploads -ItemType Directory -Force

# Create logs directory (if needed)
New-Item -Path .\logs -ItemType Directory -Force

# Restart server
npm start
```

---

### Issue 10: Module Dependency Errors

**Error Message:**
```
Error: Cannot find module 'express'
```

**Solution:**

```powershell
# Clean install dependencies
Remove-Item -Path .\node_modules -Recurse -Force
Remove-Item package-lock.json

# Reinstall
npm install

# Restart server
npm start
```

---

## 🔍 Debugging Steps

### Enable Detailed Logging

1. **Add to .env:**
   ```
   LOG_LEVEL=debug
   NODE_ENV=development
   ```

2. **Check browser console:**
   - Press F12
   - Go to Console tab
   - Look for error messages
   - Check Network tab for failed requests

3. **Check server output:**
   - Watch terminal/PowerShell
   - Should show request logs
   - Errors will be displayed in red

---

## 📊 Performance Testing

### Check if server is responsive:

```powershell
# Test health endpoint
curl http://localhost:3000/api/health

# Test stats endpoint
curl http://localhost:3000/api/stats

# Test results endpoint
curl http://localhost:3000/api/results
```

---

## 🆘 Get More Help

### 1. Check Logs
```powershell
# View recent logs
Get-Content logs\resume-screening.log -Tail 50
```

### 2. Verify Configuration
```powershell
# Check .env file
Get-Content .env

# Check package.json
Get-Content package.json
```

### 3. System Information
```powershell
# Check Node version
node --version

# Check npm version
npm --version

# Check OS
[System.Environment]::OSVersion
```

### 4. Network Test
```powershell
# Test OpenAI connectivity
Test-NetConnection api.openai.com -Port 443
```

---

## 🚀 Recovery Steps

If system is completely broken:

```powershell
# 1. Stop server (Ctrl+C)

# 2. Clean everything
Remove-Item -Path .\node_modules -Recurse -Force
Remove-Item package-lock.json

# 3. Clear uploads
Remove-Item -Path .\uploads\* -Force
New-Item -Path .\uploads -ItemType Directory -Force

# 4. Verify .env
# Make sure OPENAI_API_KEY is correct

# 5. Fresh install
npm install

# 6. Restart
npm start
```

---

## 📞 Contact Support

For additional help:
1. Check README.md for documentation
2. Review QUICK_START.md for setup steps
3. Check API_EXAMPLES.js for API usage
4. Test endpoints using TESTING.js utilities

---

**Version: 1.0.0** | **Last Updated: February 2026**
