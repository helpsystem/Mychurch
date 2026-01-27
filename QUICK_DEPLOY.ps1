# Quick Deploy Script
# Based on DEPLOYMENT_STEPS.md

$Host.UI.RawUI.WindowTitle = "MyChurch Quick Deploy"

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "║         🚀 MyChurch - Quick Deploy to VPS                   ║" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 دستورات deployment را کپی کنید و در ترمینال سرور اجرا کنید:" -ForegroundColor Yellow
Write-Host ""

# فرمان اتصال SSH
Write-Host "1️⃣ اتصال به سرور:" -ForegroundColor Cyan
Write-Host "   ssh root@samanabyar.online" -ForegroundColor White
Write-Host ""

# فرمان deployment
Write-Host "2️⃣ Deployment (کپی کنید و یکجا در سرور paste کنید):" -ForegroundColor Cyan
Write-Host ""
Write-Host "cd /var/www/mychurch && git pull origin main && npm install && npm run build && cd backend && npm install --production && pm2 restart mychurch-backend && cd .. && pm2 status" -ForegroundColor Green
Write-Host ""

Write-Host ("=" * 80) -ForegroundColor Gray
Write-Host ""

Write-Host "✅ بعد از اجرا، سایت در آدرس زیر به‌روز می‌شود:" -ForegroundColor Yellow
Write-Host "   🌐 https://samanabyar.online" -ForegroundColor White
Write-Host ""

Write-Host ("=" * 80) -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
