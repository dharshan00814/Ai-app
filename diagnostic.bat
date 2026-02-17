@echo off
REM Windows Terminal Diagnostic & Fix Script
REM Run this as Administrator to fix Node.js issues

echo.
echo =====================================================
echo Node.js & NPM Diagnostic Tool
echo =====================================================
echo.

REM Check if Node is installed
echo [1] Checking Node.js Installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo   ❌ Node.js NOT FOUND
    echo   Solution: Install from https://nodejs.org/
) else (
    for /f "tokens=*" %%i in ('node --version') do (
        echo   ✅ Node.js located: %%i
    )
)

echo.

REM Check if npm is installed
echo [2] Checking npm Installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo   ❌ npm NOT FOUND
    echo   Solution: Node.js installation may be incomplete
) else (
    for /f "tokens=*" %%i in ('npm --version') do (
        echo   ✅ npm located: %%i
    )
)

echo.

REM Check Node installation path
echo [3] Checking Installation Paths...
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('where node') do (
        echo   ✅ Node path: %%i
    )
) else (
    echo   ❌ Node in PATH not found
)

where npm >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('where npm') do (
        echo   ✅ npm path: %%i
    )
) else (
    echo   ❌ npm in PATH not found
)

echo.

REM Check npm cache
echo [4] Checking npm Cache...
npm cache verify >nul 2>&1
if errorlevel 1 (
    echo   ⚠️  npm cache verification failed
    echo   Fix: Run 'npm cache clean --force'
) else (
    echo   ✅ npm cache verified
)

echo.

REM Check port 3000
echo [5] Checking if Port 3000 is Available...
netstat -ano | findstr :3000 >nul 2>&1
if errorlevel 1 (
    echo   ✅ Port 3000 is available
) else (
    echo   ⚠️  Port 3000 is already in use
    echo   Solution: Change PORT in .env to 3001 or use 'npm start' with different port
)

echo.

REM Check project structure
echo [6] Checking Project Structure...
if exist "package.json" (
    echo   ✅ package.json found
) else (
    echo   ❌ package.json NOT found
)

if exist ".env" (
    echo   ✅ .env file found
) else (
    echo   ❌ .env file NOT found
)

if exist "node_modules" (
    echo   ✅ node_modules folder exists
) else (
    echo   ⚠️  node_modules folder not found - Run 'npm install'
)

if exist "server\server.js" (
    echo   ✅ server\server.js found
) else (
    echo   ❌ server\server.js NOT found
)

echo.

REM Summary
echo =====================================================
echo Diagnostic Summary
echo =====================================================
echo.
echo Next Steps:
echo.
echo 1. If any checks failed, see solutions above
echo 2. If all checks passed, run: npm start
echo 3. Open browser to: http://localhost:3000
echo.
echo For issues run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
echo.
echo =====================================================

pause
