# PowerShell Diagnostic & Auto-Fix Script
# Run as Administrator for best results
# Usage: .\fix-terminal.ps1

Write-Host "`n" -ForegroundColor White
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Windows PowerShell Node.js Terminal Diagnostic Tool    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Warning "⚠️  Script should be run as Administrator for full functionality"
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
}

Write-Host "[1] Checking Node.js Installation..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js NOT FOUND" -ForegroundColor Red
    Write-Host "   📥 Install from: https://nodejs.org/ (LTS version)" -ForegroundColor Yellow
}

Write-Host "`n"
Write-Host "[2] Checking npm Installation..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version
    Write-Host "   ✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ npm NOT FOUND" -ForegroundColor Red
    Write-Host "   💡 Re-install Node.js - npm should come with it" -ForegroundColor Yellow
}

Write-Host "`n"
Write-Host "[3] Checking Installation Paths..." -ForegroundColor Cyan
try {
    $nodePath = (Get-Command node).Source
    Write-Host "   ✅ Node path: $nodePath" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node not in PATH" -ForegroundColor Red
}

try {
    $npmPath = (Get-Command npm).Source
    Write-Host "   ✅ npm path: $npmPath" -ForegroundColor Green
} catch {
    Write-Host "   ❌ npm not in PATH" -ForegroundColor Red
    Write-Host "   💡 Add 'C:\Program Files\nodejs' to system PATH" -ForegroundColor Yellow
}

Write-Host "`n"
Write-Host "[4] Checking npm Configuration..." -ForegroundColor Cyan
try {
    $npmRegistry = npm config get registry
    Write-Host "   ✅ npm registry: $npmRegistry" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Could not verify npm registry" -ForegroundColor Yellow
}

Write-Host "`n"
Write-Host "[5] Checking Port 3000 Availability..." -ForegroundColor Cyan
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "   ⚠️  Port 3000 is ALREADY IN USE" -ForegroundColor Yellow
    Write-Host "   💡 Either: Stop the process OR change PORT in .env to 3001" -ForegroundColor Cyan
    Write-Host "   Process: $($port3000.OwningProcess)" -ForegroundColor Gray
} else {
    Write-Host "   ✅ Port 3000 is available" -ForegroundColor Green
}

Write-Host "`n"
Write-Host "[6] Checking Project Structure..." -ForegroundColor Cyan
$checks = @(
    @{Path = "package.json"; Name = "package.json" },
    @{Path = ".env"; Name = ".env file" },
    @{Path = "node_modules"; Name = "node_modules folder" },
    @{Path = "server\server.js"; Name = "server\server.js" },
    @{Path = "index.html"; Name = "index.html" }
)

foreach ($check in $checks) {
    if (Test-Path $check.Path) {
        Write-Host "   ✅ $($check.Name) found" -ForegroundColor Green
    } else {
        if ($check.Name -eq "node_modules folder") {
            Write-Host "   ⚠️  $($check.Name) not found - Run 'npm install'" -ForegroundColor Yellow
        } else {
            Write-Host "   ❌ $($check.Name) NOT found" -ForegroundColor Red
        }
    }
}

Write-Host "`n"
Write-Host "[7] Checking Execution Policy..." -ForegroundColor Cyan
$policy = Get-ExecutionPolicy
if ($policy -eq "RemoteSigned" -or $policy -eq "Unrestricted") {
    Write-Host "   ✅ Execution policy is $policy" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Execution policy is $policy (may block scripts)" -ForegroundColor Yellow
    if ($isAdmin) {
        Write-Host "   Run this to fix:" -ForegroundColor Cyan
        Write-Host "   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Gray
    }
}

Write-Host "`n"
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    QUICK FIX OPTIONS                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "Option 1: Install Project Dependencies" -ForegroundColor Yellow
Write-Host "Command: npm install" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 2: Start the Server" -ForegroundColor Yellow
Write-Host "Command: npm start" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 3: Clear Node Modules & Reinstall" -ForegroundColor Yellow
Write-Host "Commands:" -ForegroundColor Gray
Write-Host "  Remove-Item -Path node_modules -Recurse -Force" -ForegroundColor Gray
Write-Host "  Remove-Item -Path package-lock.json" -ForegroundColor Gray
Write-Host "  npm install" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 4: Fix npm Permissions" -ForegroundColor Yellow
Write-Host "Commands:" -ForegroundColor Gray
Write-Host "  npm config set prefix `"C:\Users\Dharshan\AppData\Roaming\npm`"" -ForegroundColor Gray
Write-Host "  npm install -g npm@latest" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 5: Verify Diagnostic Results" -ForegroundColor Yellow
Write-Host "Command: npm doctor" -ForegroundColor Gray
Write-Host ""

Write-Host "`n"
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Make sure Node.js is installed (check above)" -ForegroundColor Cyan
Write-Host "2️⃣  Run: npm install" -ForegroundColor Cyan
Write-Host "3️⃣  Run: npm start" -ForegroundColor Cyan
Write-Host "4️⃣  Open: http://localhost:3000 in your browser" -ForegroundColor Cyan
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Read-Host "Press Enter to continue"
