# Deploy Latest Changes to VPS
# استقرار آخرین تغییرات روی سرور

Write-Host "🚀 Starting VPS Deployment..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# VPS Configuration - Update these values
$VPS_HOST = "samanabyar.online"
$VPS_USER = "root"  # یا نام کاربری SSH شما
$VPS_PATH = "/var/www/mychurch"  # مسیر پروژه روی سرور
$SSH_KEY = "~/.ssh/id_rsa"  # مسیر کلید SSH

Write-Host "`n📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Host: $VPS_HOST" -ForegroundColor White
Write-Host "   User: $VPS_USER" -ForegroundColor White
Write-Host "   Path: $VPS_PATH" -ForegroundColor White
Write-Host ""

# Deployment Commands
$deployCommands = @"
#!/bin/bash
set -e

echo '🔄 Pulling latest code from GitHub...'
cd $VPS_PATH
git pull origin main

echo '📦 Installing dependencies...'
npm install

echo '🎨 Building frontend...'
cd frontend
npm install
npm run build

echo '🔧 Restarting backend...'
cd ..
pm2 restart mychurch-backend || pm2 start backend/index.js --name mychurch-backend

echo '🌐 Reloading Nginx...'
sudo systemctl reload nginx

echo '✅ Deployment completed successfully!'
echo '🌍 Site: https://$VPS_HOST'
"@

# Save deployment script
$deployScriptPath = ".\deploy-commands.sh"
$deployCommands | Out-File -FilePath $deployScriptPath -Encoding UTF8 -NoNewline

Write-Host "✅ Deployment script created: $deployScriptPath" -ForegroundColor Green
Write-Host ""

# Option 1: Direct SSH Execution
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  گزینه ۱: اجرای مستقیم از طریق SSH                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "دستور زیر را کپی و اجرا کنید:" -ForegroundColor Yellow
Write-Host ""
Write-Host "ssh $VPS_USER@$VPS_HOST 'cd $VPS_PATH && git pull origin main && npm install && cd frontend && npm install && npm run build && cd .. && pm2 restart mychurch-backend && sudo systemctl reload nginx'" -ForegroundColor White
Write-Host ""

# Option 2: Using SCP + SSH
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  گزینه ۲: آپلود اسکریپت و اجرا                           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. آپلود اسکریپت به سرور:" -ForegroundColor Yellow
Write-Host "   scp $deployScriptPath ${VPS_USER}@${VPS_HOST}:/tmp/" -ForegroundColor White
Write-Host ""
Write-Host "2. اجرای اسکریپت روی سرور:" -ForegroundColor Yellow
Write-Host "   ssh $VPS_USER@$VPS_HOST 'bash /tmp/deploy-commands.sh'" -ForegroundColor White
Write-Host ""

# Option 3: Manual Steps
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  گزینه ۳: اجرای دستی (قدم به قدم)                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. اتصال به سرور:" -ForegroundColor Yellow
Write-Host "   ssh $VPS_USER@$VPS_HOST" -ForegroundColor White
Write-Host ""
Write-Host "2. رفتن به مسیر پروژه:" -ForegroundColor Yellow
Write-Host "   cd $VPS_PATH" -ForegroundColor White
Write-Host ""
Write-Host "3. دریافت آخرین کد:" -ForegroundColor Yellow
Write-Host "   git pull origin main" -ForegroundColor White
Write-Host ""
Write-Host "4. نصب dependencies:" -ForegroundColor Yellow
Write-Host "   npm install" -ForegroundColor White
Write-Host "   cd frontend && npm install && npm run build" -ForegroundColor White
Write-Host ""
Write-Host "5. ریستارت backend:" -ForegroundColor Yellow
Write-Host "   cd .." -ForegroundColor White
Write-Host "   pm2 restart mychurch-backend" -ForegroundColor White
Write-Host ""
Write-Host "6. ریلود Nginx:" -ForegroundColor Yellow
Write-Host "   sudo systemctl reload nginx" -ForegroundColor White
Write-Host ""

Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "✨ آماده برای deployment!" -ForegroundColor Green
Write-Host ""

# Ask user preference
Write-Host "کدام گزینه را ترجیح می‌دهید؟ (1/2/3)" -ForegroundColor Cyan
