# Quick Start - Background Bible Audio Generator
# One-command setup and start

Write-Host "`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    🎵 Bible Audio Generator - Quick Start                " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n"

# Step 1: Install dependencies
Write-Host "📦 Step 1: Installing Python dependencies..." -ForegroundColor Yellow
py -3.12 -m pip install edge-tts aiohttp --quiet
Write-Host "   ✅ Dependencies installed`n" -ForegroundColor Green

# Step 2: Check backend
Write-Host "🔍 Step 2: Checking backend server..." -ForegroundColor Yellow
$backend = $null
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:3001/api/bible/content/GEN/1" -TimeoutSec 3 -ErrorAction SilentlyContinue
} catch {}

if ($backend) {
    Write-Host "   ✅ Backend is running`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend not running!" -ForegroundColor Red
    Write-Host "   Starting backend server...`n" -ForegroundColor Yellow
    
    Start-Job -ScriptBlock {
        Set-Location $using:PWD
        node backend/server.js
    } | Out-Null
    
    Write-Host "   ⏳ Waiting for backend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    Write-Host "   ✅ Backend started`n" -ForegroundColor Green
}

# Step 3: Start generator
Write-Host "🚀 Step 3: Starting background generator..." -ForegroundColor Yellow
Write-Host "`n"

.\start-background-audio-generator.ps1

Write-Host "`n"
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "    ✅ Everything is Ready!                               " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "`n"

Write-Host "💡 Quick Commands:" -ForegroundColor Cyan
Write-Host "   Check Status:   .\manage-audio-generator.ps1 status" -ForegroundColor White
Write-Host "   View Progress:  .\manage-audio-generator.ps1 progress" -ForegroundColor White
Write-Host "   View Log:       .\manage-audio-generator.ps1 log" -ForegroundColor White
Write-Host "   Show Stats:     .\manage-audio-generator.ps1 stats" -ForegroundColor White
Write-Host "   Stop Generator: .\manage-audio-generator.ps1 stop" -ForegroundColor White
Write-Host "`n"

Write-Host "📊 Monitor Progress:" -ForegroundColor Cyan
Write-Host "   Get-Content audio_generation_log.txt -Wait -Tail 10" -ForegroundColor Gray
Write-Host ""
