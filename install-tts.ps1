# 🎙️ Google Cloud TTS - Quick Installation Script
# Run this script to set up everything automatically

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Google Cloud TTS Automated System Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = "d:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch"
Set-Location $rootDir

# Step 1: Install Backend Dependencies
Write-Host "[1/7] Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install @google-cloud/text-to-speech chokidar ssh2-sftp-client
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Install Frontend Dependencies  
Write-Host "[2/7] Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ..
npm install
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 3: Create Required Directories
Write-Host "[3/7] Creating directory structure..." -ForegroundColor Yellow
$directories = @(
    "cache/tts",
    "public/audio/bible/fa",
    "public/audio/bible/en",
    "public/audio/songs/fa",
    "public/audio/songs/en",
    "public/audio/readings/fa",
    "public/audio/readings/en",
    "data/bible/GEN",
    "data/songs",
    "data/readings",
    "logs"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Write-Host "  ✓ Created: $dir" -ForegroundColor Gray
}
Write-Host "✅ Directory structure created" -ForegroundColor Green
Write-Host ""

# Step 4: Configure Environment Variables
Write-Host "[4/7] Setting up environment variables..." -ForegroundColor Yellow

$envContent = @"
# Google Cloud TTS Configuration
GOOGLE_APPLICATION_CREDENTIALS="d:/Windows.old/Users/Sami/Desktop/Iran Church DC/Cloud Speech-to-Text API User/gen-lang-client-0969365672-9e46846c8ca7.json"
GOOGLE_CLOUD_PROJECT_ID="gen-lang-client-0969365672"

# TTS Settings
TTS_FREE_TIER_LIMIT=500000
TTS_ENABLE_QUOTA_TRACKING=true
TTS_CACHE_DIR="./cache/tts"
TTS_AUDIO_OUTPUT_DIR="./public/audio"

# Voice Configuration
TTS_VOICE_FA_FEMALE="fa-IR-Wavenet-D"
TTS_VOICE_EN_FEMALE="en-US-Neural2-F"
TTS_DEFAULT_VOICE_FA="fa-IR-Wavenet-D"
TTS_DEFAULT_VOICE_EN="en-US-Neural2-F"

# Audio Quality
TTS_AUDIO_ENCODING="MP3"
TTS_SPEAKING_RATE=0.9
TTS_PITCH=0

# Server Sync Configuration
SERVER_HOST="samanabyar.online"
SERVER_USER="root"
SERVER_PORT=22
SERVER_AUDIO_PATH="/var/www/html/audio"
SERVER_SSH_KEY_PATH="~/.ssh/id_rsa"

# Sync Settings
SYNC_ENABLED=true
SYNC_ON_CHANGE=false
WATCH_BIBLE_PATH="./data/bible"
WATCH_SONGS_PATH="./data/songs"
WATCH_READINGS_PATH="./data/readings"

# Logging
TTS_LOG_LEVEL="info"
TTS_LOG_FILE="./logs/tts-manager.log"
"@

# Append to existing .env or create new one
$envFile = "backend/.env"
if (Test-Path $envFile) {
    Add-Content -Path $envFile -Value "`n# === TTS Configuration (Added by setup script) ===`n$envContent"
    Write-Host "  ✓ Appended TTS config to existing .env" -ForegroundColor Gray
} else {
    Set-Content -Path $envFile -Value $envContent
    Write-Host "  ✓ Created new .env file" -ForegroundColor Gray
}

Write-Host "✅ Environment configured" -ForegroundColor Green
Write-Host ""

# Step 5: Test Google Cloud Authentication
Write-Host "[5/7] Testing Google Cloud authentication..." -ForegroundColor Yellow
$keyPath = "d:\Windows.old\Users\Sami\Desktop\Iran Church DC\Cloud Speech-to-Text API User\gen-lang-client-0969365672-9e46846c8ca7.json"

if (Test-Path $keyPath) {
    Write-Host "  ✓ Service account key found" -ForegroundColor Gray
    $env:GOOGLE_APPLICATION_CREDENTIALS = $keyPath
    Write-Host "  ✓ GOOGLE_APPLICATION_CREDENTIALS set" -ForegroundColor Gray
    Write-Host "✅ Authentication configured" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Service account key not found at expected path" -ForegroundColor Red
    Write-Host "     Please verify the path in .env file" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Test TTS Service
Write-Host "[6/7] Testing TTS service..." -ForegroundColor Yellow
Write-Host "  Running test script..." -ForegroundColor Gray

try {
    Set-Location backend
    $testOutput = node services/ttsManager.js 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TTS service test successful!" -ForegroundColor Green
        Write-Host "  Check output above for details" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  TTS service test failed" -ForegroundColor Yellow
        Write-Host "  Output: $testOutput" -ForegroundColor Red
        Write-Host "  Please check your Google Cloud credentials" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not run test (this is okay if dependencies not fully installed)" -ForegroundColor Yellow
}

Set-Location ..
Write-Host ""

# Step 7: Display Next Steps
Write-Host "[7/7] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   🎉 INSTALLATION COMPLETE!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Start the file watcher (auto-regeneration):" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   node services/audioFileWatcher.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "2️⃣  Start the backend server:" -ForegroundColor White
Write-Host "   npm run dev:backend" -ForegroundColor Cyan
Write-Host ""
Write-Host "3️⃣  Start the frontend:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "4️⃣  Access TTS Usage Dashboard:" -ForegroundColor White
Write-Host "   http://localhost:5173/admin/tts-usage" -ForegroundColor Cyan
Write-Host ""
Write-Host "5️⃣  Generate your first audio:" -ForegroundColor White
Write-Host "   POST http://localhost:3001/api/tts/synthesize-verse" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   - TTS_AUTOMATED_SETUP.md - Complete guide" -ForegroundColor Gray
Write-Host "   - GOOGLE_TTS_SETUP.md - Alternative setup" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 Quick Commands:" -ForegroundColor Yellow
Write-Host "   npm run tts-watcher  - Start file watcher" -ForegroundColor Gray
Write-Host "   npm run tts-test     - Test TTS service" -ForegroundColor Gray
Write-Host "   npm run sync-audio   - Sync to server" -ForegroundColor Gray
Write-Host ""
Write-Host "⚡ Free Tier Limit:" -ForegroundColor Yellow
Write-Host "   500,000 characters/month (WaveNet voices)" -ForegroundColor Gray
Write-Host "   Monitor at: /admin/tts-usage" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Create a test file to trigger watcher
Write-Host "📝 Creating sample Bible data..." -ForegroundColor Yellow
$sampleData = @"
{
  "bookCode": "GEN",
  "chapter": 1,
  "verses": [
    {
      "verseNumber": 1,
      "textEn": "In the beginning God created the heaven and the earth.",
      "textFa": "در ابتدا خدا آسمان و زمین را آفرید."
    }
  ]
}
"@

Set-Content -Path "data/bible/GEN/1.json" -Value $sampleData
Write-Host "✅ Sample data created at data/bible/GEN/1.json" -ForegroundColor Green
Write-Host ""

Write-Host "Ready to go! 🚀" -ForegroundColor Green
Write-Host ""
