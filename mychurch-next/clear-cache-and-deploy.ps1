# clear-cache-and-deploy.ps1
# Clears Nginx cache on VPS, then deploys fresh build locally
# Creates swap on VPS if needed to prevent OOM during npm install

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
Write-Host "  Step 2: Building Next.js LOCALLY..." -ForegroundColor Yellow
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
Write-Host "  Step 3: Packaging build..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

$dirsToRemove = @(".next\cache", ".next\dev")
foreach ($d in $dirsToRemove) {
    if (Test-Path $d) { Remove-Item -Recurse -Force $d }
}

tar -czf $TAR_FILE ".next"
$sizeMB = [Math]::Round((Get-Item $TAR_FILE).Length / 1MB, 2)
Write-Host "Package: $TAR_FILE ($sizeMB MB)" -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Step 4: Uploading to VPS..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

scp -o StrictHostKeyChecking=no $TAR_FILE "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/"
if ($LASTEXITCODE -ne 0) { Write-Host "Upload FAILED." -ForegroundColor Red; exit 1 }

# Upload .env.local
if (Test-Path $LOCAL_ENV_PATH) {
    scp -o StrictHostKeyChecking=no $LOCAL_ENV_PATH "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/.env.local"
}

# Upload package files for clean npm ci
scp -o StrictHostKeyChecking=no "package.json" "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/package.json"
scp -o StrictHostKeyChecking=no "package-lock.json" "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/package-lock.json"

Write-Host "Upload complete." -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Step 5: Ensuring swap + installing deps + restarting..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

$deployCmd = "set +e; if [ ! -f /swapfile ]; then echo 'Creating 2G swap...'; fallocate -l 2G /swapfile; chmod 600 /swapfile; mkswap /swapfile; swapon /swapfile; echo '/swapfile none swap sw 0 0' >> /etc/fstab; echo 'Swap created'; else swapon /swapfile 2>/dev/null; echo 'Swap active'; fi; set -e; cd ${VPS_NEXT_PATH}; rm -rf .next.old; if [ -d .next ]; then mv .next .next.old; fi; tar -xzf ${TAR_FILE} 2>/dev/null; rm -f ${TAR_FILE}; rm -rf .next.old; if [ ! -f node_modules/.bin/next ]; then echo 'Installing deps...'; rm -rf node_modules; npm install --omit=dev --legacy-peer-deps; echo 'npm install done'; fi; if pm2 show mychurch-next > /dev/null 2>&1; then pm2 restart mychurch-next --update-env; else pm2 start npm --name mychurch-next -- start; fi; pm2 save; if [ -d /var/cache/nginx ]; then rm -rf /var/cache/nginx/*; fi; nginx -s reload; echo DONE"
ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" $deployCmd
if ($LASTEXITCODE -ne 0) { Write-Host "VPS restart FAILED." -ForegroundColor Red; exit 1 }

if (Test-Path $TAR_FILE) { Remove-Item -Force $TAR_FILE }

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  SUCCESS! Cache cleared + Fresh deploy complete." -ForegroundColor Green
Write-Host "  Visit: https://www.iranianchurchdc.com" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
