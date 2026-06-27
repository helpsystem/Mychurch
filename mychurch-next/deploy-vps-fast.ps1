# deploy-vps-fast.ps1
# Deploy Next.js Project (mychurch-next) to VPS by compiling locally and uploading the build artifact.

Write-Host "Starting Local Next.js Build and Fast VPS Deployment..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

# Configuration
$VPS_HOST = "samanabyar.online"
$VPS_USER = "root"
$VPS_NEXT_PATH = "/root/mychurch-v2/mychurch-next"
$LOCAL_ENV_PATH = ".\.env.local"

# 1. Run local build
Write-Host "`n[1/5] Building Next.js locally..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Local build failed. Deployment aborted." -ForegroundColor Red
    exit 1
}

# 2. Package build
Write-Host "`n[2/5] Cleaning caches and packaging build..." -ForegroundColor Yellow
$nextDir = ".next"
$devDir = Join-Path $nextDir "dev"
$cacheDir = Join-Path $nextDir "cache"

if (Test-Path $devDir) {
    Remove-Item -Recurse -Force $devDir
}
if (Test-Path $cacheDir) {
    Remove-Item -Recurse -Force $cacheDir
}

$tarFile = "next-build.tar.gz"
if (Test-Path $tarFile) {
    Remove-Item -Force $tarFile
}

tar -czf $tarFile $nextDir
if (-not (Test-Path $tarFile)) {
    Write-Host "Failed to create build package." -ForegroundColor Red
    exit 1
}
$size = (Get-Item $tarFile).Length / 1MB
Write-Host "Package created: $tarFile ($([Math]::Round($size, 2)) MB)" -ForegroundColor Green

# 3. Upload package and .env.local
Write-Host "`n[3/5] Uploading package and environment to VPS..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=no $tarFile "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to upload build package." -ForegroundColor Red
    exit 1
}

if (Test-Path $LOCAL_ENV_PATH) {
    scp -o StrictHostKeyChecking=no $LOCAL_ENV_PATH "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/.env.local"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to upload .env.local." -ForegroundColor Red
        exit 1
    }
}

# 4. Deploy and restart on VPS
Write-Host "`n[4/5] Extracting build and restarting Next.js on VPS..." -ForegroundColor Yellow
$deployCmd = @"
set -e
cd ${VPS_NEXT_PATH}

echo '🔗 Extracting build package...'
# Back up old build just in case
rm -rf .next.old
if [ -d .next ]; then
    mv .next .next.old
fi

tar -xzf ${tarFile}
rm -f ${tarFile}
rm -rf .next.old

echo '🚀 Restarting mychurch-next via PM2...'
if pm2 show mychurch-next > /dev/null 2>&1; then
    pm2 restart mychurch-next --update-env
else
    pm2 start npm --name 'mychurch-next' -- start
fi
pm2 save
echo '✅ Next.js restarted successfully!'
"@

# Replace CRLF with LF for bash execution
$deployCmd = $deployCmd -replace "`r`n", "`n"

ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} $deployCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "VPS deployment/restart failed." -ForegroundColor Red
    exit 1
}

# 5. Clean up local package
Write-Host "`n[5/5] Cleaning up local temporary package..." -ForegroundColor Yellow
if (Test-Path $tarFile) {
    Remove-Item -Force $tarFile
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Gray
Write-Host "Done! Next.js application has been deployed successfully to samanabyar.online." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Gray
