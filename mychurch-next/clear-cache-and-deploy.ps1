# clear-cache-and-deploy.ps1
# Clears Nginx cache on VPS, then deploys fresh standalone build locally
# Uses Next.js standalone output — NO npm install needed on VPS!

$VPS_HOST = "samanabyar.online"
$VPS_USER = "root"
$VPS_NEXT_PATH = "/root/mychurch-v2/mychurch-next"
$TAR_FILE = "next_build_upload.tar.gz"
$LOCAL_ENV_PATH = ".\.env.local"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Step 1: Clearing Nginx cache on VPS..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

$clearCmd = "set -e; if [ -d /var/cache/nginx ]; then rm -rf /var/cache/nginx/*; fi; nginx -s reload; echo 'Cache cleared and Nginx reloaded.'"
ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" $clearCmd
Write-Host "Cache cleared and Nginx reloaded." -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Step 2: Building Next.js LOCALLY (standalone)..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path $TAR_FILE) { Remove-Item -Force $TAR_FILE }

$env:NODE_OPTIONS = "--max-old-space-size=4096"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Local build FAILED." -ForegroundColor Red
    exit 1
}
Write-Host "Build SUCCESSFUL." -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Step 3: Packaging standalone build..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

# Remove cache/dev dirs to reduce package size
$dirsToRemove = @(".next\cache", ".next\dev")
foreach ($d in $dirsToRemove) {
    if (Test-Path $d) { Remove-Item -Recurse -Force $d }
}

# Copy public and static into standalone (required for standalone mode)
if (Test-Path "public") {
    Copy-Item -Recurse -Force "public" ".next\standalone\public"
}
if (Test-Path ".next\static") {
    New-Item -ItemType Directory -Force -Path ".next\standalone\.next\static" | Out-Null
    Copy-Item -Recurse -Force ".next\static\*" ".next\standalone\.next\static\"
}

# Package only .next/standalone (includes server.js + minimal node_modules)
tar -czf $TAR_FILE -C ".next" "standalone"
$sizeMB = [Math]::Round((Get-Item $TAR_FILE).Length / 1MB, 2)
Write-Host "Package: $TAR_FILE ($sizeMB MB) - standalone with bundled deps" -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Step 4: Uploading to VPS..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

scp -o StrictHostKeyChecking=no $TAR_FILE "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/"
if ($LASTEXITCODE -ne 0) { Write-Host "Upload FAILED." -ForegroundColor Red; exit 1 }

if (Test-Path $LOCAL_ENV_PATH) {
    scp -o StrictHostKeyChecking=no $LOCAL_ENV_PATH "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/.env.local"
}
Write-Host "Upload complete." -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Step 5: Extracting and restarting on VPS..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

$deployCmd = "set +e; cd ${VPS_NEXT_PATH}; rm -rf standalone.old; if [ -d standalone ]; then mv standalone standalone.old; fi; tar -xzf ${TAR_FILE}; rm -f ${TAR_FILE}; rm -rf standalone.old; if [ -f .env.local ]; then cp .env.local standalone/.env.local; fi; pm2 delete mychurch-next 2>/dev/null; set -e; cd standalone; PORT=3000 pm2 start server.js --name mychurch-next --update-env; pm2 save; if [ -d /var/cache/nginx ]; then rm -rf /var/cache/nginx/*; fi; nginx -s reload; echo DONE"
ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" $deployCmd
if ($LASTEXITCODE -ne 0) { Write-Host "VPS restart FAILED." -ForegroundColor Red; exit 1 }

if (Test-Path $TAR_FILE) { Remove-Item -Force $TAR_FILE }

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  SUCCESS! Standalone deploy complete." -ForegroundColor Green
Write-Host "  Visit: https://www.iranianchurchdc.com" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
