# Deploy Next.js Project (mychurch-next) to VPS for the First Time
# استقرار پروژه اصلی و جدید روی سرور لینوکس

Write-Host "🚀 Starting Next.js Deployment to VPS..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# VPS Configuration
$VPS_HOST = "samanabyar.online"
$VPS_USER = "root"
$VPS_REPO_PATH = "/root/mychurch-v2"
$VPS_NEXT_PATH = "/root/mychurch-v2/mychurch-next"
$LOCAL_ENV_PATH = ".\.env.local"

Write-Host "`n[1/3] 🔄 Setting up fresh codebase on VPS..." -ForegroundColor Yellow
$gitPullCmd = "if [ ! -d $VPS_REPO_PATH ]; then git clone https://github.com/helpsystem/Mychurch.git $VPS_REPO_PATH; fi && cd $VPS_REPO_PATH && git restore . && git clean -df && git checkout main && git pull origin main"
ssh ${VPS_USER}@${VPS_HOST} $gitPullCmd

# Step 2: Upload .env.local
Write-Host "`n[2/3] 🔐 Uploading .env.local via SCP..." -ForegroundColor Yellow
if (Test-Path $LOCAL_ENV_PATH) {
    scp $LOCAL_ENV_PATH ${VPS_USER}@${VPS_HOST}:${VPS_NEXT_PATH}/.env.local
    if ($?) {
        Write-Host "✅ .env.local uploaded successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to upload .env.local." -ForegroundColor Red
        exit
    }
}
else {
    Write-Host "⚠️ Warning: .env.local not found in current directory! ($LOCAL_ENV_PATH)" -ForegroundColor Red
    exit
}

# Step 3: Run the build and PM2 process directly via SSH
Write-Host "`n[3/3] 📦 Installing and Building Next.js on VPS..." -ForegroundColor Yellow
$deployCmd = "cd $VPS_NEXT_PATH && npm install && npm run build && if pm2 show mychurch-next > /dev/null 2>&1; then pm2 restart mychurch-next --update-env; else pm2 start npm --name 'mychurch-next' -- start; fi && pm2 save"

ssh $VPS_USER@$VPS_HOST $deployCmd

Write-Host "`n=" * 60 -ForegroundColor Gray
Write-Host "✨ Done! Next.js is now running on Port 3000 inside your VPS." -ForegroundColor Green
Write-Host "Next Step: We just need to update NGINX to make it visible to the world." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
