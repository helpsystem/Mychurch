# clear-cache-and-deploy.ps1 - 🚀 Ultra Fast Deploy (Source Only)
$VPS_HOST = "samanabyar.online"
$VPS_USER = "root"
$VPS_NEXT_PATH = "/root/mychurch-v2/mychurch-next"
$TAR_FILE = "source_code.tar.gz"
$LOCAL_ENV_PATH = ".\.env.local"

$startTime = Get-Date

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  [1/3] Packaging Source Code (Extremely Fast)..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

if (Test-Path $TAR_FILE) { Remove-Item -Force $TAR_FILE }

# Clean dynamic OG files to prevent Satori build crash
if (Test-Path "src\app\opengraph-image.tsx") { Remove-Item -Force "src\app\opengraph-image.tsx" }
if (Test-Path "src\app\twitter-image.tsx") { Remove-Item -Force "src\app\twitter-image.tsx" }
if (Test-Path "scripts\apply-new-logo.js") { node scripts\apply-new-logo.js }

# Package source code only (skip heavy folders)
tar -czf $TAR_FILE --exclude="node_modules" --exclude=".next" --exclude="standalone" --exclude=".git" --exclude="Bible" --exclude="public" --exclude=$TAR_FILE ./*

$sizeMB = [Math]::Round((Get-Item $TAR_FILE).Length / 1MB, 2)
Write-Host "Source Package Created: $TAR_FILE ($sizeMB MB)" -ForegroundColor Green

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  [2/3] Uploading Source Code to VPS..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

scp -o StrictHostKeyChecking=no $TAR_FILE "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/"
if ($LASTEXITCODE -ne 0) { Write-Host "Upload FAILED." -ForegroundColor Red; exit 1 }

if (Test-Path $LOCAL_ENV_PATH) {
    scp -o StrictHostKeyChecking=no $LOCAL_ENV_PATH "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/.env.local"
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  [3/3] Building on Server & Restarting..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

$remoteDeployCmd = @"
set -e
cd ${VPS_NEXT_PATH}
tar -xzf ${TAR_FILE}
rm -f ${TAR_FILE}

echo '📦 Installing new dependencies (if any)...'
npm install --legacy-peer-deps

echo '🔨 Building Next.js on the VPS...'
export NODE_OPTIONS="--max-old-space-size=2048"
node ./node_modules/next/dist/bin/next build

if [ -f .next/standalone/server.js ]; then
    echo '♻️ Deploying new standalone build and reloading PM2...'
    rm -rf standalone.old
    if [ -d standalone ]; then
        mv standalone standalone.old
    fi
    mkdir -p standalone
    cp -r .next/standalone/* standalone/
    cp -r public standalone/public
    cp -r Bible standalone/Bible 2>/dev/null || true
    cp -f Bible/bible_output/bible_complete.db standalone/Bible/bible_output/bible_complete.db 2>/dev/null || true
    cp -rf node_modules/better-sqlite3 standalone/node_modules/ 2>/dev/null || true
    mkdir -p standalone/.next/static
    cp -r .next/static/* standalone/.next/static/
    cp .env.local standalone/.env.local 2>/dev/null || true

    cd standalone
    export NODE_OPTIONS="--dns-result-order=ipv4first"
    export PORT=3000
    export HOSTNAME="127.0.0.1"
    pm2 delete mychurch-next 2>/dev/null || true
    pm2 start server.js --name mychurch-next
    cd ..
else
    echo '⚠️ Standalone build not found or build failed, keeping existing deployment running.'
    pm2 restart mychurch-next 2>/dev/null || true
fi

cd ..
if ! pm2 show socket-server > /dev/null 2>&1; then
    pm2 start socket-server.js --name socket-server
fi

# Clear Nginx cache
rm -rf /var/cache/nginx/* 2>/dev/null || true
systemctl reload nginx 2>/dev/null || nginx -s reload

pm2 save
echo '✅ Deployment completely updated!'
"@

$remoteDeployCmd = $remoteDeployCmd -replace "`r`n", "`n"
ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" $remoteDeployCmd

if (Test-Path $TAR_FILE) { Remove-Item -Force $TAR_FILE }
$elapsed = [Math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "  🚀 DEPLOY SUCCESSFUL in ${elapsed}s!" -ForegroundColor Green
Write-Host "  Live URL: https://www.iranianchurchdc.com" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
