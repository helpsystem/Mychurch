# Deploy Next.js Project (mychurch-next) to VPS

Write-Host "Starting Next.js Deployment to VPS..." -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Gray

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($PSVersionTable.PSVersion.Major -ge 7) {
    $PSNativeCommandUseErrorActionPreference = $false
}

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
$gitPullCmd = "if [ ! -d $VPS_REPO_PATH ]; then git clone https://github.com/helpsystem/Mychurch.git $VPS_REPO_PATH; fi && cd $VPS_REPO_PATH && git restore . && git clean -df -e mychurch-next/.deps-lock.json && (git checkout main || true) && (git pull origin main || git fetch origin main) && git reset --hard origin/main"
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
$deployCmd = @'
set -e
cd {0}
export NEXT_TELEMETRY_DISABLED=1
export NEXT_DISABLE_ESLINT=1

echo '🔗 Restoring and verifying persistent upload directories...'
mkdir -p /var/www/storage/uploads
mkdir -p /var/www/storage/media
mkdir -p /var/www/storage/worship/audio

# If public/uploads is a directory, migrate its contents and replace it with a symlink
if mountpoint -q public/uploads; then
    echo "public/uploads is a mountpoint, skipping symlink setup."
else
    if [ -d public/uploads ] && [ ! -L public/uploads ]; then
        echo 'Migrating public/uploads to persistent storage...'
        cp -rn public/uploads/. /var/www/storage/uploads/ || true
        rm -rf public/uploads
    fi
    rm -f public/uploads
    ln -sfn /var/www/storage/uploads public/uploads
fi

# If public/media is a directory, migrate its contents and replace it with a symlink
if mountpoint -q public/media; then
    echo "public/media is a mountpoint, skipping symlink setup."
else
    if [ -d public/media ] && [ ! -L public/media ]; then
        echo 'Migrating public/media to persistent storage...'
        cp -rn public/media/. /var/www/storage/media/ || true
        rm -rf public/media
    fi
    rm -f public/media
    ln -sfn /var/www/storage/media public/media
fi

# If public/worship/audio is a directory, migrate its contents and replace it with a symlink
if mountpoint -q public/worship/audio; then
    echo "public/worship/audio is a mountpoint, skipping symlink setup."
else
    if [ -d public/worship/audio ] && [ ! -L public/worship/audio ]; then
        echo 'Migrating public/worship/audio to persistent storage...'
        cp -rn public/worship/audio/. /var/www/storage/worship/audio/ || true
        rm -rf public/worship/audio
    fi
    rm -f public/worship/audio
    mkdir -p public/worship
    ln -sfn /var/www/storage/worship/audio public/worship/audio
fi

# Ensure correct permissions
chown -R www-data:www-data /var/www/storage/uploads /var/www/storage/media /var/www/storage/worship || true
chmod -R 775 /var/www/storage/uploads /var/www/storage/media /var/www/storage/worship || true

current_swap_size=$(stat -c%s /swapfile 2>/dev/null || echo 0)
if [ ! -f /swapfile ] || [ "$current_swap_size" -lt 5368709120 ]; then
    echo 'Allocating 5GB swap for npm/build operations...'
    swapoff /swapfile >/dev/null 2>&1 || true
    rm -f /swapfile
    if ! fallocate -l 5G /swapfile >/dev/null 2>&1; then
        dd if=/dev/zero of=/swapfile bs=1M count=5120 >/dev/null 2>&1
    fi
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null 2>&1 || true
    swapon /swapfile >/dev/null 2>&1 || true
    free -h | grep Swap || echo 'Swap configured'
fi

if pm2 show mychurch-next > /dev/null 2>&1; then
    echo 'Stopping PM2 process mychurch-next to release file locks...'
    pm2 stop mychurch-next || true
    sleep 3
fi

if [ -d node_modules ] && [ -f .deps-lock.json ] && cmp -s package-lock.json .deps-lock.json; then
    echo 'Dependencies unchanged, skipping npm install'
else
    echo 'Installing dependencies...'
    if [ -d node_modules ]; then
        echo 'Clearing old node_modules synchronously...'
        rm -rf node_modules
    fi
    # Wipe the corrupted cache directory to completely eliminate TAR_ENTRY_ERROR
    echo 'Cleaning corrupted npm cache folder...'
    rm -rf /root/.npm ~/.npm || true
    
    if ! npm ci --no-audit --no-fund; then
        echo 'npm ci failed, cleaning cache and falling back to npm install...'
        rm -rf /root/.npm ~/.npm || true
        npm install --no-audit --no-fund --legacy-peer-deps || exit 1
    fi
    cp package-lock.json .deps-lock.json
    echo 'Dependencies installed successfully'
fi

# Build using a deterministic low-memory profile for slower VPS nodes.
rm -rf .next
export NODE_OPTIONS="--max-old-space-size=2048"
export NEXT_CPU_LIMIT=1
export NEXT_PRIVATE_BUILD_WORKER=0
echo 'Building Next.js (timeout: 120 minutes)...'
if ! timeout 120m npm run build; then
    echo 'Build failed, retrying after 30s...'
    sleep 30
    timeout 120m npm run build
fi

if pm2 show mychurch-next > /dev/null 2>&1; then
    pm2 start mychurch-next --update-env || pm2 restart mychurch-next --update-env
else
    pm2 start npm --name 'mychurch-next' -- start
fi
pm2 save
'@ -f $VPS_NEXT_PATH
$deployCmd = $deployCmd -replace "`r`n", "`n"
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
