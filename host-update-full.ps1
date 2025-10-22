# 🚀 هاست آپدیت شو - نسخه کامل

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 AUTO DEPLOYMENT - هاست آپدیت شو!     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# مرحله 1: Commit و Push تغییرات
Write-Host "📝 مرحله 1: Commit و Push تغییرات به GitHub..." -ForegroundColor Yellow
Write-Host ""

$hasChanges = git status --porcelain
if ($hasChanges) {
    Write-Host "✓ تغییرات یافت شد، در حال commit..." -ForegroundColor Green
    
    $commitMsg = Read-Host "پیام commit را وارد کنید (Enter برای پیش‌فرض)"
    if ([string]::IsNullOrWhiteSpace($commitMsg)) {
        $commitMsg = "chore: Update project files - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    
    git add -A
    git commit -m $commitMsg
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ تغییرات با موفقیت به GitHub ارسال شد" -ForegroundColor Green
    } else {
        Write-Host "❌ خطا در push به GitHub" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ تغییری برای commit وجود ندارد" -ForegroundColor Gray
}

Write-Host ""

# مرحله 2: SSH Deployment
Write-Host "🚀 مرحله 2: آپدیت خودکار سرور..." -ForegroundColor Yellow
Write-Host ""

npm run deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║        ✅ آپدیت کامل انجام شد!            ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 سایت شما آماده است:" -ForegroundColor Cyan
    Write-Host "   https://samanabyar.online" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 برای مشاهده لاگ‌ها:" -ForegroundColor Cyan
    Write-Host "   ssh root@samanabyar.online" -ForegroundColor Gray
    Write-Host "   pm2 logs mychurch-backend" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║          ❌ خطا در deployment!            ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 بررسی کنید:" -ForegroundColor Yellow
    Write-Host "   - اتصال اینترنت" -ForegroundColor Gray
    Write-Host "   - اطلاعات SSH در backend/.env" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
