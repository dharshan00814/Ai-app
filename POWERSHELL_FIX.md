# 🔧 Fix Windows PowerShell Terminal Issues

## ❌ Current Problems
- `npm: not recognized`
- `node: not recognized`
- Exit code 1 errors
- Commands not working in PowerShell

**Root Cause:** Node.js is NOT installed on your system

---

## ✅ Complete Fix (Step-by-Step)

### **Step 1: Uninstall Any Old Node.js**

1. Press `Windows Key` + `R`
2. Type `appwiz.cpl` and press Enter
3. Look for "Node.js" or "nodejs"
4. If found, right-click → **Uninstall**
5. Restart your computer

---

### **Step 2: Install Node.js Properly**

**Method A: Direct Download (Recommended)**

1. Go to: **https://nodejs.org/** (official website)
2. Click **LTS** (Long Term Support) - currently v20.x
3. Download the **Windows Installer (.msi)**
4. Run the installer
5. **Important:** Check these boxes during installation:
   - ✅ Install for all users
   - ✅ Automatically install necessary tools
6. Click **Next** through all screens
7. Click **Install**
8. Wait for installation to complete
9. **RESTART YOUR COMPUTER**

**Method B: Using Chocolatey (If you have it)**

```powershell
choco install nodejs --version=20.0.0
```

---

### **Step 3: Verify Installation**

**Open a NEW PowerShell window** and run:

```powershell
node --version
npm --version
```

You should see version numbers like:
```
v20.10.0
9.8.1
```

**If you see errors:**
- Close ALL PowerShell windows
- Restart your computer again
- Try the commands in a new PowerShell window

---

### **Step 4: Navigate to Project & Install Dependencies**

```powershell
cd "c:\Users\Dharshan\OneDrive\Desktop\ai app"
npm install
```

**Expected output:**
```
added 287 packages in 2m
audited 288 packages
```

---

### **Step 5: Start the Server**

```powershell
npm start
```

**Expected output:**
```
============================================================
🤖 AI Resume Screening System Started
============================================================
✓ Server running at: http://localhost:3000
✓ API Base URL: http://localhost:3000/api
✓ Frontend: http://localhost:3000
```

---

## 🛠️ PowerShell-Specific Troubleshooting

### Issue: `scripts disabled on this system`

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then press `Y` and Enter to confirm

---

### Issue: Still getting "npm not recognized"

**Solution 1: Check Environment Variables**
1. Press `Windows Key`
2. Type `Environment Variables`
3. Click **Edit the system environment variables**
4. Click **Environment Variables** button
5. Under **System variables**, click **New**
   - Variable name: `NODEJS_HOME`
   - Variable value: `C:\Program Files\nodejs`
6. Click OK
7. Find **Path** in System variables, click **Edit**
8. Click **New** and add: `C:\Program Files\nodejs`
9. Click OK on all windows
10. **RESTART COMPUTER**

**Solution 2: Fresh PowerShell Install**
```powershell
# Uninstall using package manager
npm uninstall -g npm

# Reinstall Node.js from scratch
```

---

### Issue: `ERR_MODULE_NOT_FOUND`

**Solution:**
```powershell
# Delete old packages
Remove-Item -Path node_modules -Recurse -Force
Remove-Item -Path package-lock.json -Force

# Reinstall fresh
npm install
```

---

### Issue: Port 3000 already in use

**Solution 1: Find and stop process**
```powershell
netstat -ano | findstr :3000
# Note the PID (Process ID)
taskkill /PID [PID_NUMBER] /F
# Then try npm start again
```

**Solution 2: Use different port**
```powershell
# Edit .env file and change:
PORT=3001
# Then restart server
```

---

### Issue: Permission Denied Error

**Solution 1: Run PowerShell as Administrator**
1. Right-click PowerShell
2. Select **Run as Administrator**
3. Try npm install again

**Solution 2: Fix npm permissions**
```powershell
npm config set prefix "C:\Users\Dharshan\AppData\Roaming\npm"
npm install -g npm@latest
```

---

## 🚀 Quick Test

Once everything is set up, test with:

```powershell
# 1. Check Node
node --version

# 2. Check npm
npm --version

# 3. Navigate to project
cd "c:\Users\Dharshan\OneDrive\Desktop\ai app"

# 4. Start server
npm start

# 5. Open browser to: http://localhost:3000
```

---

## ✅ Success Signs

**PowerShell shows:**
```
🤖 AI Resume Screening System Started
✓ Server running at: http://localhost:3000
```

**Browser shows:**
- Blue header with "Stella Mary's College of Engineering"
- Upload area for resumes
- Statistics dashboard

---

## 🔍 Diagnostic Commands

If still having issues, run these to diagnose:

```powershell
# Check Node installation path
Get-Command node

# Check npm installation path
Get-Command npm

# Check npm cache
npm cache verify

# Check npm config
npm config list

# Check for proxy issues
npm config get registry

# Complete diagnostic
npm doctor
```

---

## 📞 If Still Not Working

1. **Close ALL PowerShell windows**
2. **Restart your computer** (full restart, not logout)
3. **Open NEW PowerShell window**
4. **Run commands again**

Most issues resolve after a full restart.

---

## 🎯 Final Checklist

Before running your app, verify:

- ✅ Node.js installed (`node --version` works)
- ✅ npm installed (`npm --version` works)
- ✅ You can navigate to project folder
- ✅ `.env` file exists with API key
- ✅ `node_modules` folder exists (from `npm install`)
- ✅ `npm start` shows no errors
- ✅ Browser opens to `http://localhost:3000` successfully

---

**You're ready to go! Run `npm start` and enjoy the system! 🎉**
