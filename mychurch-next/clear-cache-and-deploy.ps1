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

# Strip cache & dev chunks before packaging to minimize size
$dirsToRemove = @(".next\cache", ".next\dev")
foreach ($d in $dirsToRemove) {
    if (Test-Path $d) { Remove-Item -Recurse -Force $d }
}

tar -czf $TAR_FILE ".next"
$sizeMB = [Math]::Round((Get-Item $TAR_FILE).Length / 1MB, 2)
Write-Host "Compressed Build Package: $TAR_FILE ($sizeMB MB)" -ForegroundColor Green

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
scp -o StrictHostKeyChecking=no "package.json"       "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/package.json"
scp -o StrictHostKeyChecking=no "socket-server.js"   "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/socket-server.js"

# Upload updated lightweight branding assets
$brandFiles = @(
    "logo.png",
    "logo-transparent.png",
    "favicon.ico",
    "apple-touch-icon.png",
    "og-image.jpg"
)
foreach ($bf in $brandFiles) {
    if (Test-Path "public\$bf") {
        scp -o StrictHostKeyChecking=no "public\$bf" "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/public/$bf"
    }
}

# Upload leader photos and public images folder
if (Test-Path "public\images") {
    scp -o StrictHostKeyChecking=no -r "public\images" "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/public/"
}

Write-Host "Upload completed successfully." -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  [4/4] Extracting, Clearing Nginx Cache & Restarting PM2..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

$remoteDeployCmd = @"
set -e
cd ${VPS_NEXT_PATH}

# 1. Swap in new build
rm -rf .next.old
if [ -d .next ]; then
    mv .next .next.old
fi
tar -xzf ${TAR_FILE}
rm -f ${TAR_FILE}
rm -rf .next.old

# 2. Ensure dependencies exist (only run install if node_modules missing)
if [ ! -d node_modules ]; then
    echo 'Installing node_modules on VPS...'
    npm install --legacy-peer-deps --production
fi

# 3. Clear Nginx cache
if [ -d /var/cache/nginx ]; then
    rm -rf /var/cache/nginx/*
fi
systemctl reload nginx 2>/dev/null || nginx -s reload

# 4. Instant PM2 restart
if pm2 show mychurch-next > /dev/null 2>&1; then
    pm2 restart mychurch-next --update-env
else
    pm2 start node_modules/.bin/next --name mychurch-next -- start
fi

if ! pm2 show socket-server > /dev/null 2>&1; then
    pm2 start socket-server.js --name socket-server
fi

pm2 save
echo '✅ Next.js and Nginx updated successfully!'
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
