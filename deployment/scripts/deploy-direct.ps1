# Direct Deploy to Production (Skip Git Push)
# This script uploads changed files directly to the server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Direct Deploy to samanabyar.online" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$SERVER = "root@samanabyar.online"
$REMOTE_PATH = "/root/Mychurch"

# Step 1: Upload source code directories
Write-Host "Step 1: Uploading source code..." -ForegroundColor Blue

$DIRS_TO_UPLOAD = @(
    "components",
    "pages", 
    "lib",
    "utils",
    "backend",
    "scripts"
)

foreach ($dir in $DIRS_TO_UPLOAD) {
    if (Test-Path $dir) {
        Write-Host "  Uploading $dir/..." -ForegroundColor Gray
        scp -r $dir "${SERVER}:${REMOTE_PATH}/"
    }
}

# Step 2: Upload config files
Write-Host ""
Write-Host "Step 2: Uploading config files..." -ForegroundColor Blue

$FILES_TO_UPLOAD = @(
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tsconfig.json",
    "App.tsx",
    "index.tsx",
    "index.html",
    ".gitignore"
)

foreach ($file in $FILES_TO_UPLOAD) {
    if (Test-Path $file) {
        Write-Host "  Uploading $file..." -ForegroundColor Gray
        scp $file "${SERVER}:${REMOTE_PATH}/"
    }
}

# Step 3: Upload .env (if exists)
if (Test-Path ".env") {
    Write-Host ""
    Write-Host "Step 3: Uploading environment variables..." -ForegroundColor Blue
    scp .env "${SERVER}:${REMOTE_PATH}/"
}

# Step 4: Build and restart on server
Write-Host ""
Write-Host "Step 4: Building on server..." -ForegroundColor Blue
ssh $SERVER "bash -c 'cd $REMOTE_PATH && npm install && npm run build'"

Write-Host ""
Write-Host "Step 5: Restarting services..." -ForegroundColor Blue
ssh $SERVER "bash -c 'cd $REMOTE_PATH && (pm2 restart all || pm2 start backend/index.js --name mychurch-backend)'"

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Site: https://samanabyar.online" -ForegroundColor Cyan
Write-Host "Clear browser cache (Ctrl+Shift+R)" -ForegroundColor Yellow
Write-Host ""
