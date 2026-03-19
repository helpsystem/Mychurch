@echo off
CHCP 65001 >NUL
title MyChurch Next.js Auto Deploy

echo ===================================================
echo     MyChurch Global Auto Deployer
echo ===================================================
echo.
echo این اسکریپت تمام تغییرات جدید را ابتدا در GitHub ذخیره می‌کند
echo و سپس بلافاصله دستور آپدیت و بیلد را به سرور اصلی (VPS) ارسال می‌کند.
echo.
pause

echo [1/3] Uploading changes to GitHub...
call git add .
call git commit -m "Auto deployment & System Fixes"
call git push origin main
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ آلارم: خطای اتصال به گیت‌هاب! لطفا فیلترشکن خود را چک کنید.
    pause
    exit /b
)

echo.
echo [2/3] Connecting to VPS (samanabyar.online) to pull latest changes...
cd mychurch-next
call powershell -ExecutionPolicy Bypass -File deploy-nextjs.ps1

echo.
echo ===================================================
echo ✅ عملیات با موفقیت انجام شد!
echo سایت شما اکنون آپدیت شده و در حال اجرا است.
echo ===================================================
pause
