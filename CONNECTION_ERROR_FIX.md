# 🔴 FIX: Connection Error at localhost - Server Not Running

## ❌ The Problem
```
Connection Error: localhost:3000
Failed to fetch from http://localhost:3000/api/health
```

**Why:** Backend server is not running because **Node.js is NOT installed**

---

## ✅ SOLUTION (3 Simple Steps)

### **STEP 1️⃣: Install Node.js** (5 minutes)

1. Open browser and go to: **https://nodejs.org/**

2. Click **LTS** button (Long Term Support) - current version v20.x

3. Click **Download for Windows**

4. **Run the installer** when downloaded:
   - Click Next
   - Accept license
   - Keep default installation path
   - ✅ **IMPORTANT:** Check the box: "Automatically install necessary tools"
   - Click Next → Install
   - Wait for completion

5. **RESTART YOUR COMPUTER** (very important!)

---

### **STEP 2️⃣: Verify Installation** (1 minute)

After restart, open **PowerShell** and type:

```powershell
node --version
npm --version
```

**You should see:**
```
v20.10.0 (or similar)
9.8.1 (or similar)
```

If you see errors, close PowerShell and open a **NEW PowerShell window**.

---

### **STEP 3️⃣: Start Your Server** (2 minutes)

In PowerShell, go to your project folder:

```powershell
cd "c:\Users\Dharshan\OneDrive\Desktop\ai app"
npm install
npm start
```

**Watch for this message:**
```
============================================================
🤖 AI Resume Screening System Started
============================================================
✓ Server running at: http://localhost:3000
✓ API Base URL: http://localhost:3000/api
✓ Frontend: http://localhost:3000
```

**When you see this, your server is running! ✅**

---

## 🌐 Open Your App

Now open your browser and go to:
```
http://localhost:3000
```

You should see:
- Blue header with "Stella Mary's College of Engineering"
- Upload area for resumes
- Statistics dashboard

**No more connection error!** ✅

---

## ⚠️ IMPORTANT NOTES

1. **Keep PowerShell window OPEN** while using the app
   - The server must stay running
   - Don't close the PowerShell window with `npm start`

2. **If you need to stop the server:**
   - Press `Ctrl + C` in PowerShell
   - Then run `npm start` again to restart

3. **If you see "Port 3000 already in use":**
   ```powershell
   # Kill the process or use a different port:
   # Edit .env and change: PORT=3001
   # Then: npm start
   ```

---

## ❌ Still Getting Connection Error?

**Checklist:**

- ✅ Node.js installed? (`node --version` works)
- ✅ npm installed? (`npm --version` works)
- ✅ Ran `npm install` in project folder?
- ✅ PowerShell shows "🤖 AI Resume Screening System Started"?
- ✅ PowerShell window still open (not closed)?
- ✅ Tried refreshing browser 3 times?
- ✅ Browser console shows what error? (Press F12)

**If still broken after all these:**

1. Close PowerShell
2. Go to project folder
3. Delete folder: `node_modules`
4. Delete file: `package-lock.json`
5. Open new PowerShell
6. Run: `npm install`
7. Run: `npm start`

---

## 🎯 Quick Reference

| Command | What it does |
|---------|-------------|
| `node --version` | Check Node.js installed |
| `npm --version` | Check npm installed |
| `npm install` | Download all dependencies |
| `npm start` | Start the backend server |
| `Ctrl + C` in PowerShell | Stop the server |

---

## 📍 File Locations

```
Your Project:
C:\Users\Dharshan\OneDrive\Desktop\ai app

Server file:
C:\Users\Dharshan\OneDrive\Desktop\ai app\server\server.js

Config file:
C:\Users\Dharshan\OneDrive\Desktop\ai app\.env
```

---

## ✨ Once Working, You Can:

1. ✅ Upload resumes (PDF, DOC, DOCX, TXT)
2. ✅ AI analyzes them automatically
3. ✅ See approval/rejection with scores
4. ✅ Send approved resumes to principal
5. ✅ View statistics dashboard

---

**Start with STEP 1 above and follow all 3 steps. Your server will be running in 10 minutes!**

Need help? Follow the steps exactly as written. The main issue is Node.js is missing. Install it first! 🚀
