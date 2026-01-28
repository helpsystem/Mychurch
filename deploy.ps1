# Deploy Script for Iranian Church Website
# Usage:
#   .\deploy.ps1                    # Deploy without audio (default)
#   .\deploy.ps1 -Build             # Build + Deploy
#   .\deploy.ps1 -Build -Restart    # Build + Deploy + Restart Backend
#   .\deploy.ps1 -AudioOnly         # Only audio files
#   .\deploy.ps1 -Full              # Everything (dangerous!)

param(
    [switch]$Full,
    [switch]$AudioOnly,
    [switch]$Build,
    [switch]$Restart
)

$SERVER = "root@samanabyar.online"
$REMOTE_PATH = "/var/www/html"
$BACKEND_PATH = "/var/www/Mychurch"
$LOCAL_DIST = "./dist"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iranian Church DC - Deploy Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Show selected options
Write-Host "Selected Options:" -ForegroundColor Yellow
if ($Full) { Write-Host "  [!] FULL deploy (including audio)" -ForegroundColor Red }
elseif ($AudioOnly) { Write-Host "  [*] Audio files only" -ForegroundColor Magenta }
else { Write-Host "  [*] Standard deploy (no audio)" -ForegroundColor Green }
if ($Build) { Write-Host "  [+] Build locally first" -ForegroundColor Yellow }
if ($Restart) { Write-Host "  [+] Restart backend after deploy" -ForegroundColor Yellow }
Write-Host ""

# Confirm for Full deploy
if ($Full) {
    Write-Host "WARNING: Full deploy includes large audio files!" -ForegroundColor Red
    $confirm = Read-Host "Are you sure? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Cancelled." -ForegroundColor Red
        exit 1
    }
}

# Step 1: Build
if ($Build) {
    Write-Host "[1/4] Building frontend..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Build complete!" -ForegroundColor Green
    Write-Host ""
}

# Check dist exists
if (-not (Test-Path $LOCAL_DIST)) {
    Write-Host "ERROR: dist folder not found!" -ForegroundColor Red
    Write-Host "Run 'npm run build' first or use -Build flag" -ForegroundColor Yellow
    exit 1
}

# Step 2: Deploy
Write-Host "[2/4] Uploading files..." -ForegroundColor Yellow

if ($AudioOnly) {
    Write-Host "  Uploading audio files only..." -ForegroundColor Magenta
    $audioPath = "./dist/worship/songs"
    if (Test-Path $audioPath) {
        scp -r "$audioPath" "${SERVER}:${REMOTE_PATH}/worship/"
    } else {
        Write-Host "  No audio folder found at $audioPath" -ForegroundColor Yellow
    }
}
elseif ($Full) {
    Write-Host "  Uploading ALL files..." -ForegroundColor Red
    scp -r "$LOCAL_DIST/*" "${SERVER}:${REMOTE_PATH}/"
}
else {
    # Smart deploy: exclude audio
    Write-Host "  Uploading assets..." -ForegroundColor Gray
    scp -r "$LOCAL_DIST/assets" "${SERVER}:${REMOTE_PATH}/"
    
    Write-Host "  Uploading index.html..." -ForegroundColor Gray
    scp "$LOCAL_DIST/index.html" "${SERVER}:${REMOTE_PATH}/"
    
    Write-Host "  Uploading worship data (timing files)..." -ForegroundColor Gray
    ssh $SERVER "mkdir -p ${REMOTE_PATH}/worship/data"
    scp -r "$LOCAL_DIST/worship/data" "${SERVER}:${REMOTE_PATH}/worship/"
    
    # Upload other root files
    Get-ChildItem "$LOCAL_DIST" -File | ForEach-Object {
        $ext = $_.Extension.ToLower()
        if ($ext -notin @('.mp3', '.wav', '.ogg', '.m4a')) {
            Write-Host "  Uploading $($_.Name)..." -ForegroundColor Gray
            scp $_.FullName "${SERVER}:${REMOTE_PATH}/"
        }
    }
}

Write-Host "Upload complete!" -ForegroundColor Green
Write-Host ""

# Step 3: Restart backend
if ($Restart) {
    Write-Host "[3/4] Restarting backend..." -ForegroundColor Yellow
    ssh $SERVER "cd $BACKEND_PATH && pm2 restart all"
    Write-Host "Backend restarted!" -ForegroundColor Green
    Write-Host ""
}

# Step 4: Done
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deploy Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Test URLs:" -ForegroundColor Cyan
Write-Host "  Main:      https://samanabyar.online" -ForegroundColor White
Write-Host "  Worship:   https://samanabyar.online/#/worship" -ForegroundColor White
Write-Host "  Broadcast: https://samanabyar.online/#/admin/broadcast" -ForegroundColor White
Write-Host ""
Write-Host "Tip: Use Ctrl+Shift+R for hard refresh" -ForegroundColor Yellow
Write-Host ""

