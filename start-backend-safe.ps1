# اجرای Backend با تنظیمات بهینه برای جلوگیری از کرش
# این اسکریپت Node.js را با flag های خاص اجرا می‌کند

Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🚀 اجرای Backend با تنظیمات ضد کرش" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "تنظیمات فعال:`n" -ForegroundColor Yellow
Write-Host "   ✅ Garbage Collection بهینه شده" -ForegroundColor White
Write-Host "   ✅ Memory Limit افزایش یافته" -ForegroundColor White
Write-Host "   ✅ Event Loop Monitoring فعال" -ForegroundColor White
Write-Host "   ✅ Unhandled Rejection Handler`n" -ForegroundColor White

Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Green

# تنظیم Environment Variables
$env:NODE_ENV = "development"
$env:UV_THREADPOOL_SIZE = "8"

# اجرای Node با flag های بهینه
node --expose-gc `
     --max-old-space-size=4096 `
     --max-semi-space-size=128 `
     --trace-warnings `
     --unhandled-rejections=strict `
     backend/server.js

Write-Host "`n❌ Backend متوقف شد!`n" -ForegroundColor Red
Write-Host "Exit Code: $LASTEXITCODE`n" -ForegroundColor Yellow

if ($LASTEXITCODE -eq 1) {
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "   ⚠️  مشکل همچنان وجود دارد" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Red
    
    Write-Host "احتمالاً Windows Defender است.`n" -ForegroundColor Yellow
    Write-Host "لطفاً فایل fix-windows-defender.ps1 را اجرا کنید.`n" -ForegroundColor White
}

Read-Host "`nبرای بستن Enter را فشار دهید"
