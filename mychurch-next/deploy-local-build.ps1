# deploy-local-build.ps1
# Builds the Next.js project LOCALLY then uploads only the build output to VPS.
# This avoids VPS OOM issues during compilation entirely.

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  MyChurch - Local Build + VPS Deploy" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$VPS_HOST = "samanabyar.online"
$VPS_USER = "root"
$VPS_NEXT_PATH = "/root/mychurch-v2/mychurch-next"
$LOCAL_ENV_PATH = ".\.env.local"
$TAR_FILE = "next_build_upload.tar.gz"

# ─── Step 1: Clean old build artifacts ───────────────────────────────────────
Write-Host "`n[1/5] Cleaning old .next build cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "  Removed old .next directory." -ForegroundColor Gray
}
if (Test-Path $TAR_FILE) {
    Remove-Item -Force $TAR_FILE
}

# ─── Step 2: Build locally ───────────────────────────────────────────────────
Write-Host "`n[2/5] Building Next.js LOCALLY (this uses your machine's RAM)..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--max-old-space-size=4096"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Local build FAILED. Check the output above for errors." -ForegroundColor Red
    exit 1
}
Write-Host "  Local build SUCCESSFUL." -ForegroundColor Green

# ─── Step 3: Package the build ───────────────────────────────────────────────
Write-Host "`n[3/5] Packaging build output (.next)..." -ForegroundColor Yellow

# Remove heavy cache dirs before packaging to reduce upload size
$dirsToRemove = @(".next\cache", ".next\dev")
foreach ($d in $dirsToRemove) {
    if (Test-Path $d) {
        Remove-Item -Recurse -Force $d
    }
}

tar -czf $TAR_FILE ".next"
if (-not (Test-Path $TAR_FILE) -or (Get-Item $TAR_FILE).Length -lt 1000) {
    Write-Host "Packaging FAILED - archive not created or empty." -ForegroundColor Red
    exit 1
}
$sizeMB = [Math]::Round((Get-Item $TAR_FILE).Length / 1MB, 2)
Write-Host "  Package created: $TAR_FILE ($sizeMB MB)" -ForegroundColor Green

# ─── Step 4: Upload to VPS ───────────────────────────────────────────────────
Write-Host "`n[4/5] Uploading build package and .env.local to VPS..." -ForegroundColor Yellow

scp -o StrictHostKeyChecking=no $TAR_FILE "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "SCP upload of build package FAILED." -ForegroundColor Red
    exit 1
}

if (Test-Path $LOCAL_ENV_PATH) {
    scp -o StrictHostKeyChecking=no $LOCAL_ENV_PATH "${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/.env.local"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "SCP upload of .env.local FAILED." -ForegroundColor Red
        exit 1
    }
    Write-Host "  .env.local uploaded." -ForegroundColor Gray
}
Write-Host "  Upload complete." -ForegroundColor Green

# ─── Step 5: Extract and restart on VPS ─────────────────────────────────────
Write-Host "`n[5/5] Extracting on VPS and restarting PM2..." -ForegroundColor Yellow

$remoteScript = @"
set -e
cd $VPS_NEXT_PATH

echo 'Backing up old build...'
rm -rf .next.old
[ -d .next ] && mv .next .next.old || true

echo 'Extracting new build...'
tar -xzf $TAR_FILE
rm -f $TAR_FILE
rm -rf .next.old

echo 'Restarting mychurch-next via PM2...'
if pm2 show mychurch-next > /dev/null 2>&1; then
    pm2 restart mychurch-next --update-env
else
    pm2 start npm --name 'mychurch-next' -- start
fi
pm2 save
echo 'DONE: mychurch-next restarted successfully!'
"@

# Normalize line endings for SSH
$remoteScript = $remoteScript -replace "`r`n", "`n"

ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_HOST}" $remoteScript
if ($LASTEXITCODE -ne 0) {
    Write-Host "VPS extraction/restart FAILED." -ForegroundColor Red
    exit 1
}

# ─── Cleanup local package ───────────────────────────────────────────────────
if (Test-Path $TAR_FILE) {
    Remove-Item -Force $TAR_FILE
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  SUCCESS! Site deployed to samanabyar.online" -ForegroundColor Green
Write-Host "  Visit: https://www.iranianchurchdc.com" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
