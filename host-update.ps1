# 🚀 Auto Deploy - هاست آپدیت شو!

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🚀 AUTOMATIC DEPLOYMENT TO HOST       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# چک کردن وجود node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js نصب نیست! لطفاً Node.js را نصب کنید." -ForegroundColor Red
    exit 1
}

# چک کردن وجود npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm نصب نیست! لطفاً Node.js را نصب کنید." -ForegroundColor Red
    exit 1
}

Write-Host "📦 بررسی وجود ssh2 module..." -ForegroundColor Yellow

# نصب ssh2 در صورت عدم وجود
$ssh2Exists = npm list ssh2 --depth=0 2>$null
if (-not $ssh2Exists -or $LASTEXITCODE -ne 0) {
    Write-Host "📥 نصب ssh2 module..." -ForegroundColor Yellow
    npm install ssh2 --no-save
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ خطا در نصب ssh2. لطفاً دستی نصب کنید: npm install ssh2" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🚀 شروع deployment..." -ForegroundColor Green
Write-Host ""

# اجرای اسکریپت deployment
node deploy-to-host.cjs

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment با موفقیت انجام شد!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 سایت شما آماده است: https://samanabyar.online" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment با خطا مواجه شد!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 راهنمای عیب‌یابی:" -ForegroundColor Yellow
    Write-Host "   - بررسی اتصال اینترنت" -ForegroundColor Gray
    Write-Host "   - چک کردن اطلاعات SSH در backend/.env" -ForegroundColor Gray
    Write-Host "   - مطالعه فایل REMOTE_DEPLOYMENT_GUIDE.md" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
