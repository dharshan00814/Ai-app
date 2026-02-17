@echo off
echo.
echo ================================
echo AI Resume Screening System
echo ================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the server
echo Starting server...
echo.
echo ========================================
echo Open your browser to: http://localhost:3000
echo ========================================
echo.

call npm start
pause
