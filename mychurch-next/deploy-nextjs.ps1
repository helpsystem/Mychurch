# Deploy Next.js Project (mychurch-next) to VPS

Write-Host "Starting Next.js Deployment to VPS..." -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Gray

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Pre-deploy Audio KPI Gate
$PYTHON_EXE = "d:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/mychurch-next/Bible/.venv/Scripts/python.exe"
if (-not (Test-Path $PYTHON_EXE)) {
    Write-Host "Python venv not found for audio KPI gate: $PYTHON_EXE" -ForegroundColor Red
    exit 1
}

$skipAudioKpi = $env:SKIP_AUDIO_KPI -eq "1"
if ($skipAudioKpi) {
    Write-Host "`n[0/4] Audio KPI gate skipped (SKIP_AUDIO_KPI=1)." -ForegroundColor Yellow
}
else {
    Write-Host "`n[0/4] Running Audio KPI pre-deploy gate..." -ForegroundColor Yellow
    & $PYTHON_EXE "scripts/check_audio_kpis.py"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Audio KPI gate failed. Deployment stopped." -ForegroundColor Red
        exit 1
    }

    & $PYTHON_EXE "scripts/audio_kpi_brief.py" --lang fa --output "Bible/bible_output/audio_kpi_brief.txt"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Audio KPI brief generated: Bible/bible_output/audio_kpi_brief.txt" -ForegroundColor Green
    }
}

# VPS Configuration
$VPS_HOST = "samanabyar.online"
$VPS_USER = "root"
$VPS_REPO_PATH = "/root/mychurch-v2"
$VPS_NEXT_PATH = "/root/mychurch-v2/mychurch-next"
$LOCAL_ENV_PATH = ".\.env.local"

Write-Host "`n[1/4] Setting up fresh codebase on VPS..." -ForegroundColor Yellow
$gitPullCmd = "if [ ! -d $VPS_REPO_PATH ]; then git clone https://github.com/helpsystem/Mychurch.git $VPS_REPO_PATH; fi && cd $VPS_REPO_PATH && git restore . && git clean -df && git checkout main && (git pull origin main || git fetch origin main) && git reset --hard origin/main"
ssh ${VPS_USER}@${VPS_HOST} $gitPullCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to sync repository on VPS." -ForegroundColor Red
    exit 1
}

# Step 2: Upload .env.local
Write-Host "`n[2/4] Uploading .env.local via SCP..." -ForegroundColor Yellow
if (Test-Path $LOCAL_ENV_PATH) {
    scp $LOCAL_ENV_PATH ${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/.env.local
    if ($?) {
        Write-Host ".env.local uploaded successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "Failed to upload .env.local." -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "Warning: .env.local not found in current directory! ($LOCAL_ENV_PATH)" -ForegroundColor Red
    exit 1
}

# Step 3: Run the build and PM2 process directly via SSH
Write-Host "`n[3/4] Installing and Building Next.js on VPS..." -ForegroundColor Yellow
$deployCmd = "set -e; cd $VPS_NEXT_PATH; export NEXT_TELEMETRY_DISABLED=1; export NEXT_DISABLE_ESLINT=1; if [ ! -f /swapfile ] || [ $(stat -c%s /swapfile 2>/dev/null || echo 0) -lt 4294967296 ]; then swapoff /swapfile >/dev/null 2>&1 || true; rm -f /swapfile; (fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096) >/dev/null 2>&1; chmod 600 /swapfile; mkswap /swapfile >/dev/null 2>&1 || true; swapon /swapfile >/dev/null 2>&1 || true; fi; if [ -d node_modules ] && [ -f .deps-lock.json ] && cmp -s package-lock.json .deps-lock.json; then echo 'Dependencies unchanged, skipping npm install'; else npm ci --no-audit --no-fund; cp package-lock.json .deps-lock.json; fi; export NODE_OPTIONS=--max-old-space-size=2048; if npm run build -- --no-lint; then echo 'Build succeeded on first attempt'; else echo 'First build attempt failed, retrying with reduced workers'; rm -rf .next/cache; export NODE_OPTIONS=--max-old-space-size=1536; export NEXT_PRIVATE_BUILD_WORKER=1; npm run build -- --no-lint; fi; if pm2 show mychurch-next > /dev/null 2>&1; then pm2 restart mychurch-next --update-env; else pm2 start npm --name 'mychurch-next' -- start; fi; pm2 save"
ssh $VPS_USER@$VPS_HOST $deployCmd
if ($LASTEXITCODE -ne 0) {
        Write-Host "VPS build/deploy failed. Stop and fix before applying NGINX." -ForegroundColor Red
        exit 1
}

Write-Host "`n[4/4] Sending optional KPI notification (Slack/Telegram)..." -ForegroundColor Yellow
if (-not $skipAudioKpi -and (Test-Path "Bible/bible_output/audio_kpi_brief.txt")) {
    & $PYTHON_EXE "scripts/send_audio_kpi_notification.py" --text-file "Bible/bible_output/audio_kpi_brief.txt"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Notification step reported an issue (deployment continues)." -ForegroundColor Yellow
    }
}
else {
    Write-Host "Notification skipped (no KPI brief generated)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host '============================================================' -ForegroundColor Gray
Write-Host "Done! Next.js is now running on Port 3000 inside your VPS." -ForegroundColor Green
Write-Host "Next Step: Update NGINX to make it visible to the world." -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Gray
