# ðŸš€ Deploy Script - Ù‡ÙˆØ´Ù…Ù†Ø¯ Ø¨Ø§ rsync
# ÙÙ‚Ø· ÙØ§ÛŒÙ„â€ŒÙ‡Ø§ÛŒ ØªØºÛŒÛŒØ± Ú©Ø±Ø¯Ù‡ Ø¢Ù¾Ù„ÙˆØ¯ Ù…ÛŒâ€ŒØ´ÙˆÙ†Ø¯
# ÙØ§ÛŒÙ„â€ŒÙ‡Ø§ÛŒ ØµÙˆØªÛŒ EXCLUDE Ù…ÛŒâ€ŒØ´ÙˆÙ†Ø¯ (ÛŒÚ©Ø¨Ø§Ø± Ø¯Ø³ØªÛŒ Ø¢Ù¾Ù„ÙˆØ¯ Ø´Ø¯Ù†Ø¯)

param(
    [switch]$Full,      # Ø¢Ù¾Ù„ÙˆØ¯ Ú©Ø§Ù…Ù„ (Ø´Ø§Ù…Ù„ Ù‡Ù…Ù‡ ÙØ§ÛŒÙ„â€ŒÙ‡Ø§)
    [switch]$AudioOnly, # ÙÙ‚Ø· ÙØ§ÛŒÙ„â€ŒÙ‡Ø§ÛŒ ØµÙˆØªÛŒ
    [switch]$NoAudio,   # Ø¨Ø¯ÙˆÙ† ÙØ§ÛŒÙ„â€ŒÙ‡Ø§ÛŒ ØµÙˆØªÛŒ (Ù¾ÛŒØ´â€ŒÙØ±Ø¶)
    [switch]$Build,     # Ø¨ÛŒÙ„Ø¯ Ù‚Ø¨Ù„ Ø§Ø² Ø¯ÛŒÙ¾Ù„ÙˆÛŒ
    [switch]$Restart    # Ø±ÛŒØ³ØªØ§Ø±Øª Ø¨Ú©Ù†Ø¯
)

$SERVER = "root@samanabyar.online"
$REMOTE_PATH = "/var/www/html"
$LOCAL_DIST = "./dist"

Write-Host "ðŸš€ Deploy Script for Iranian Church Website" -ForegroundColor Cyan
Write-Host "â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”" -ForegroundColor Gray

# Step 1: Build if requested
if ($Build) {
    Write-Host "`nðŸ“¦ Building frontend..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "âŒ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "âœ… Build complete!" -ForegroundColor Green
}

# Check if dist exists
if (-not (Test-Path $LOCAL_DIST)) {
    Write-Host "âŒ dist folder not found! Run 'npm run build' first." -ForegroundColor Red
    exit 1
}

# Step 2: Deploy based on mode
if ($AudioOnly) {
    # ÙÙ‚Ø· ÙØ§ÛŒÙ„â€ŒÙ‡Ø§ÛŒ ØµÙˆØªÛŒ
    Write-Host "`nðŸŽµ Uploading ONLY audio files..." -ForegroundColor Magenta
    Write-Host "âš ï¸  This will upload large audio files!" -ForegroundColor Yellow
    
    # Upload audio folder only from public (not dist)
    $audioPath = "./public/worship/audio"
    if (Test-Path $audioPath) {
        Write-Host "ðŸ“¤ Uploading audio folder from public..."
        scp -r "$audioPath" "${SERVER}:${REMOTE_PATH}/worship/"
    }
    else {
        Write-Host "âš ï¸  No audio folder found at $audioPath" -ForegroundColor Yellow
    }
}
elseif ($Full) {
    # Ø¢Ù¾Ù„ÙˆØ¯ Ú©Ø§Ù…Ù„ (Ù‡Ù…Ù‡ Ú†ÛŒØ²)
    Write-Host "`nâš ï¸  FULL upload (including everything)..." -ForegroundColor Yellow
    scp -r "$LOCAL_DIST/*" "${SERVER}:${REMOTE_PATH}/"
}
else {
    # Ù¾ÛŒØ´â€ŒÙØ±Ø¶: Ø¨Ø¯ÙˆÙ† ÙØ§ÛŒÙ„â€ŒÙ‡Ø§ÛŒ ØµÙˆØªÛŒ
    Write-Host "`nðŸ“¤ Smart deploy (excluding audio files)..." -ForegroundColor Green
    
    # Upload assets (JS, CSS)
    Write-Host "   ðŸ“ Uploading assets..." -ForegroundColor Gray
    scp -r "$LOCAL_DIST/assets" "${SERVER}:${REMOTE_PATH}/"
    
    # Upload index.html
    Write-Host "   ðŸ“„ Uploading index.html..." -ForegroundColor Gray
    scp "$LOCAL_DIST/index.html" "${SERVER}:${REMOTE_PATH}/"
    
    # Upload worship/data (timings, JSON - NOT audio)
    Write-Host "   ðŸ“‚ Uploading worship/data (timing files)..." -ForegroundColor Gray
    ssh $SERVER "mkdir -p ${REMOTE_PATH}/worship/data"
    scp -r "$LOCAL_DIST/worship/data" "${SERVER}:${REMOTE_PATH}/worship/"
    
    # Upload worship_songs.json if exists
    if (Test-Path "$LOCAL_DIST/worship/worship_songs.json") {
        Write-Host "   ðŸ“„ Uploading worship_songs.json..." -ForegroundColor Gray
        scp "$LOCAL_DIST/worship/worship_songs.json" "${SERVER}:${REMOTE_PATH}/worship/"
    }
    
    # Upload other root files (favicon, manifest, etc)
    Get-ChildItem "$LOCAL_DIST" -File | ForEach-Object {
        if ($_.Extension -notin @('.mp3', '.wav', '.ogg', '.m4a')) {
            Write-Host "   ðŸ“„ Uploading $($_.Name)..." -ForegroundColor Gray
            scp $_.FullName "${SERVER}:${REMOTE_PATH}/"
        }
    }
    
    Write-Host "`nâœ… Smart upload complete (audio files skipped)" -ForegroundColor Green
    Write-Host "   Audio files are served directly from server" -ForegroundColor Gray
}

# Step 3: Restart backend if requested
if ($Restart) {
    Write-Host "`nðŸ”„ Restarting backend..." -ForegroundColor Yellow
    ssh $SERVER "pm2 restart mychurch-backend"
    Write-Host "âœ… Backend restarted!" -ForegroundColor Green
}

# Step 4: Show status
Write-Host "`nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”" -ForegroundColor Gray
Write-Host "âœ… Deploy complete!" -ForegroundColor Green
Write-Host ""
Write-Host "ðŸŒ Test URLs:" -ForegroundColor Cyan
Write-Host "   Main:    https://samanabyar.online" -ForegroundColor White
Write-Host "   Worship: https://samanabyar.online/#/worship" -ForegroundColor White
Write-Host ""
Write-Host "ðŸ’¡ Usage examples:" -ForegroundColor Yellow
Write-Host "   .\deploy.ps1                    # Deploy without audio (default)" -ForegroundColor Gray
Write-Host "   .\deploy.ps1 -Build             # Build and deploy" -ForegroundColor Gray
Write-Host "   .\deploy.ps1 -Build -Restart    # Build, deploy, restart backend" -ForegroundColor Gray
Write-Host "   .\deploy.ps1 -AudioOnly         # Upload ONLY audio files" -ForegroundColor Gray
Write-Host "   .\deploy.ps1 -Full              # Upload everything (dangerous!)" -ForegroundColor Gray
Write-Host ""
Write-Host "ðŸ’¡ Tip: Use Hard Refresh (Ctrl+Shift+R) after deploy" -ForegroundColor Yellow

