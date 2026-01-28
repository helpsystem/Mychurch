# Deploy Script - Smart Upload to samanabyar.online
# Only uploads changed files, excludes audio files by default

param(
    [switch]$Full,
    [switch]$AudioOnly,
    [switch]$NoAudio,
    [switch]$Build,
    [switch]$Restart
)

$SERVER = "root@samanabyar.online"
$REMOTE_PATH = "/var/www/html"
$LOCAL_DIST = "./dist"

Write-Host "Deploy Script for Iranian Church Website" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Gray

# Step 1: Build if requested
if ($Build) {
    Write-Host ""
    Write-Host "Building frontend..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Build complete!" -ForegroundColor Green
}

# Check if dist exists
if (-not (Test-Path $LOCAL_DIST)) {
    Write-Host "dist folder not found! Run 'npm run build' first." -ForegroundColor Red
    exit 1
}

# Step 2: Deploy based on mode
if ($AudioOnly) {
    Write-Host ""
    Write-Host "Uploading ONLY audio files..." -ForegroundColor Magenta
    $audioPath = "./public/worship/audio"
    if (Test-Path $audioPath) {
        Write-Host "Uploading audio folder from public..."
        scp -r "$audioPath" "${SERVER}:${REMOTE_PATH}/worship/"
    }
    else {
        Write-Host "No audio folder found at $audioPath" -ForegroundColor Yellow
    }
}
elseif ($Full) {
    Write-Host ""
    Write-Host "FULL upload (including everything)..." -ForegroundColor Yellow
    scp -r "$LOCAL_DIST/*" "${SERVER}:${REMOTE_PATH}/"
}
else {
    Write-Host ""
    Write-Host "Smart deploy (excluding audio files)..." -ForegroundColor Green
    
    # Upload assets (JS, CSS)
    Write-Host "   Uploading assets..." -ForegroundColor Gray
    scp -r "$LOCAL_DIST/assets" "${SERVER}:${REMOTE_PATH}/"
    
    # Upload index.html
    Write-Host "   Uploading index.html..." -ForegroundColor Gray
    scp "$LOCAL_DIST/index.html" "${SERVER}:${REMOTE_PATH}/"
    
    # Upload worship/data (timings, JSON - NOT audio)
    Write-Host "   Uploading worship/data (timing files)..." -ForegroundColor Gray
    ssh $SERVER "mkdir -p ${REMOTE_PATH}/worship/data"
    scp -r "$LOCAL_DIST/worship/data" "${SERVER}:${REMOTE_PATH}/worship/"
    
    # Upload worship_songs.json if exists
    if (Test-Path "$LOCAL_DIST/worship/worship_songs.json") {
        Write-Host "   Uploading worship_songs.json..." -ForegroundColor Gray
        scp "$LOCAL_DIST/worship/worship_songs.json" "${SERVER}:${REMOTE_PATH}/worship/"
    }
    
    # Upload other root files
    Get-ChildItem "$LOCAL_DIST" -File | ForEach-Object {
        if ($_.Extension -notin @('.mp3', '.wav', '.ogg', '.m4a')) {
            Write-Host "   Uploading $($_.Name)..." -ForegroundColor Gray
            scp $_.FullName "${SERVER}:${REMOTE_PATH}/"
        }
    }
    
    Write-Host ""
    Write-Host "Smart upload complete (audio files skipped)" -ForegroundColor Green
}

# Step 3: Restart backend if requested
if ($Restart) {
    Write-Host ""
    Write-Host "Restarting backend..." -ForegroundColor Yellow
    ssh $SERVER "pm2 restart mychurch-backend"
    Write-Host "Backend restarted!" -ForegroundColor Green
}

# Step 4: Show status
Write-Host ""
Write-Host "=========================================" -ForegroundColor Gray
Write-Host "Deploy complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Test URLs:" -ForegroundColor Cyan
Write-Host "   Main:    https://samanabyar.online" -ForegroundColor White
Write-Host "   Worship: https://samanabyar.online/#/worship" -ForegroundColor White
Write-Host ""
Write-Host "Tip: Use Hard Refresh (Ctrl+Shift+R) after deploy" -ForegroundColor Yellow
