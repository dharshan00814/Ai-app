@echo off
REM Quick Setup Script - Run this to install everything
REM Right-click this file and select "Run as Administrator"

title AI Resume Screening System - Installation

echo.
echo ========================================
echo  AI Resume System - Quick Installer
echo ========================================
echo.

REM Check if Node is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js is NOT installed!
    echo.
    echo Please install Node.js first:
    echo 1. Go to: https://nodejs.org/
    echo 2. Download LTS version
    echo 3. Run the installer
    echo 4. Check "Automatically install necessary tools"
    echo 5. Restart your computer
    echo 6. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js found
node --version

echo.
echo Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm not found!
    pause
    exit /b 1
)

echo ✓ npm found
npm --version

echo.
echo ========================================
echo  Installing Project Dependencies
echo ========================================
echo.

npm install

if errorlevel 1 (
    echo.
    echo ERROR: npm install failed!
    echo Try running as Administrator
    pause
    exit /b 1
)

echo.
echo ========================================
echo  ✓ Installation Complete!
echo ========================================
echo.
echo Next step: Run the server
echo Command: npm start
echo.
echo Then open: http://localhost:3000
echo.

pause
