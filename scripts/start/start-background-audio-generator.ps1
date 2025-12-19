# Start Background Bible Audio Generator
# Runs Python script in background and continues terminal use

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    🎵 Bible Audio Generator - Background Mode           " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Output: public/audio/bible/auto-generated/" -ForegroundColor White
Write-Host "   Alignments: public/data/alignments/" -ForegroundColor White
Write-Host "   Progress: audio_generation_progress.json" -ForegroundColor White
Write-Host "   Log: audio_generation_log.txt`n" -ForegroundColor White

Write-Host "🔧 Features:" -ForegroundColor Magenta
Write-Host "   ✅ Automatic audio generation with Edge TTS" -ForegroundColor Green
Write-Host "   ✅ Word-level alignment (Whisper or Synthetic)" -ForegroundColor Green
Write-Host "   ✅ Progress tracking and resume capability" -ForegroundColor Green
Write-Host "   ✅ Detailed logging" -ForegroundColor Green
Write-Host "   ✅ Runs in background`n" -ForegroundColor Green

# Check if aiohttp is installed
Write-Host "🔍 Checking dependencies..." -ForegroundColor Yellow
$aiohttp_check = py -3.12 -c "import aiohttp; print('OK')" 2>$null
if ($aiohttp_check -ne "OK") {
    Write-Host "   ⚠️ Installing aiohttp..." -ForegroundColor Yellow
    py -3.12 -m pip install aiohttp --quiet
    Write-Host "   ✅ aiohttp installed" -ForegroundColor Green
} else {
    Write-Host "   ✅ aiohttp already installed" -ForegroundColor Green
}

# Check if backend is running
Write-Host "`n🔍 Checking backend server..." -ForegroundColor Yellow
$backend_check = curl http://localhost:3001/api/bible/content/GEN/1 2>$null
if ($backend_check) {
    Write-Host "   ✅ Backend is running on port 3001" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend not running! Please start backend first:" -ForegroundColor Red
    Write-Host "      node backend/server.js`n" -ForegroundColor White
    exit 1
}

Write-Host "`n🚀 Starting generator in background...`n" -ForegroundColor Cyan

# Start Python script in background
$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    py -3.12 scripts/background_audio_generator.py
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "    ✅ Generator Started!                                 " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

Write-Host "📊 Job Information:" -ForegroundColor Yellow
Write-Host "   Job ID: $($job.Id)" -ForegroundColor White
Write-Host "   State: $($job.State)" -ForegroundColor White
Write-Host "   Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor White

Write-Host "💡 Commands:" -ForegroundColor Cyan
Write-Host "   View Progress:    Get-Content audio_generation_progress.json" -ForegroundColor White
Write-Host "   View Log:         Get-Content audio_generation_log.txt -Tail 20" -ForegroundColor White
Write-Host "   Check Status:     Get-Job -Id $($job.Id)" -ForegroundColor White
Write-Host "   Stop Generator:   Stop-Job -Id $($job.Id); Remove-Job -Id $($job.Id)" -ForegroundColor White
Write-Host "   View Output:      Receive-Job -Id $($job.Id)`n" -ForegroundColor White

Write-Host "📁 Output Files:" -ForegroundColor Yellow
Write-Host "   Audio:      public/audio/bible/auto-generated/*.mp3" -ForegroundColor Cyan
Write-Host "   Alignments: public/data/alignments/*_alignment.json`n" -ForegroundColor Cyan

Write-Host "⏱️ Estimated Time:" -ForegroundColor Magenta
Write-Host "   ~2-3 minutes per chapter" -ForegroundColor White
Write-Host "   ~10-12 hours for full Bible (1,189 chapters)`n" -ForegroundColor White

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   Generator is running in background!                    " -ForegroundColor Green
Write-Host "   You can continue using this terminal                   " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

# Keep job ID for later reference
Write-Host "💾 Saving job ID to bg_audio_job.txt..." -ForegroundColor Gray
$job.Id | Out-File -FilePath "bg_audio_job.txt" -Encoding UTF8
Write-Host "   Saved! Use this to stop later if needed.`n" -ForegroundColor Gray
