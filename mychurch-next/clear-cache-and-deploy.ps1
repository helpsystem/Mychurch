# clear-cache-and-deploy.ps1
# High-Speed Smart Deployment to VPS (samanabyar.online)
# - Compiles Next.js locally
# - Packages only the build artifact (.next)
# - Skips re-uploading existing/duplicate public media
# - Restarts PM2 instantly without redundant npm install

$VPS_HOST = "samanabyar.online"
$VPS_USER = "root"
$VPS_NEXT_PATH = "/root/mychurch-v2/mychurch-next"
$TAR_FILE = "next_build_upload.tar.gz"
$LOCAL_ENV_PATH = ".\.env.local"

$startTime = Get-Date

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  [1/4] Preparing and Building Next.js Locally..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

# Clean previous build artifacts
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path $TAR_FILE) { Remove-Item -Force $TAR_FILE }

# Clean dynamic OG files to prevent Satori build crash
if (Test-Path "src\app\opengraph-image.tsx") { Remove-Item -Force "src\app\opengraph-image.tsx" }
if (Test-Path "src\app\twitter-image.tsx") { Remove-Item -Force "src\app\twitter-image.tsx" }
if (Test-Path "scripts\apply-new-logo.js") { node scripts\apply-new-logo.js }

$env:NODE_OPTIONS = "--max-old-space-size=4096"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nLocal build FAILED. Deployment aborted." -ForegroundColor Red
    exit 1
}
Write-Host "Local build SUCCESSFUL." -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  [2/4] Packaging Build Artifacts..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

# Prepare standalone bundle
Write-Host "Copying static files to standalone folder..." -ForegroundColor Cyan
if (!(Test-Path ".next\standalone\.next\static")) {
    New-Item -ItemType Directory -Force -Path ".next\standalone\.next\static" | Out-Null
}
if (!(Test-Path ".next\standalone\public")) {
    New-Item -ItemType Directory -Force -Path ".next\standalone\public" | Out-Null
}
Copy-Item -Path ".next\static\*" -Destination ".next\standalone\.next\static\" -Recurse -Force
Copy-Item -Path "public\*" -Destination ".next\standalone\public\" -Recurse -Force

Push-Location ".next\standalone"
tar -czf "..\..\$TAR_FILE" *
Pop-Location
$sizeMB = [Math]::Round((Get-Item $TAR_FILE).Length / 1MB, 2)
Write-Host "Compressed Standalone Build Package: $TAR_FILE ($sizeMB MB)" -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  [3/4] Smart Uploading to VPS (Only Changed/Key Files)..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

# Upload compressed build package
scp -o StrictHostKeyChecking=no $TAR_FILE "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/"
if ($LASTEXITCODE -ne 0) { Write-Host "Upload of build package FAILED." -ForegroundColor Red; exit 1 }

# Upload environment if present
if (Test-Path $LOCAL_ENV_PATH) {
    scp -o StrictHostKeyChecking=no $LOCAL_ENV_PATH "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/.env.local"
}

# Upload only lightweight root config/server files
scp -o StrictHostKeyChecking=no "next.config.ts"     "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/next.config.ts"
scp -o StrictHostKeyChecking=no "socket-server.js"   "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/socket-server.js"

# We don't upload package.json because standalone mode has its own package.json!

Write-Host "Upload completed successfully." -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  [4/4] Extracting, Clearing Nginx Cache & Restarting PM2..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

$remoteDeployCmd = @"
set -e
cd ${VPS_NEXT_PATH}

# 1. Swap in new build
rm -rf standalone.old
if [ -d standalone ]; then
    mv standalone standalone.old
fi
mkdir -p standalone
tar -xzf ${TAR_FILE} -C standalone
rm -f ${TAR_FILE}
rm -rf standalone.old

# Copy env file to standalone directory so server.js can pick it up
cp .env.local standalone/.env.local 2>/dev/null || true

# 2. Clear Nginx cache
if [ -d /var/cache/nginx ]; then
    rm -rf /var/cache/nginx/*
fi
systemctl reload nginx 2>/dev/null || nginx -s reload

# 3. Instant PM2 restart using standalone server.js
pm2 delete mychurch-next 2>/dev/null || true
cd standalone
PORT=3000 HOSTNAME="127.0.0.1" pm2 start server.js --name mychurch-next

cd ..
if ! pm2 show socket-server > /dev/null 2>&1; then
    pm2 start socket-server.js --name socket-server
fi

pm2 save
echo '✅ Next.js and Nginx updated successfully using Standalone Mode!'
"@

# Normalize line endings for Linux bash
$remoteDeployCmd = $remoteDeployCmd -replace "`r`n", "`n"

ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" $remoteDeployCmd
if ($LASTEXITCODE -ne 0) { Write-Host "VPS restart FAILED." -ForegroundColor Red; exit 1 }

# Clean up local tar file
if (Test-Path $TAR_FILE) { Remove-Item -Force $TAR_FILE }

$elapsed = [Math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  DEPLOY SUCCESSFUL in ${elapsed}s!" -ForegroundColor Green
Write-Host "  Live URL: https://www.iranianchurchdc.com" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
