@echo off
CHCP 65001 >NUL
title MyChurch Next.js Safe Server

echo ===================================================
echo     MyChurch Local Development Server (Safe Mode)
echo ===================================================
echo.
echo این اسکریپت سرور را در حالت پایدار (Safe Mode) اجرا میکند
echo تا از قطع شدن اینترنت شما (خطای شبکه Turbopack) جلوگیری شود.
echo.

echo [1] پیدا کردن پوشه اصلی...
if exist "mychurch-next" (
    cd mychurch-next
) else (
    echo Error: Could not find 'mychurch-next' directory!
    pause
    exit /b
)

echo [2] پاکسازی حافظه پنهان (Cache) برای جلوگیری از تداخل...
if exist ".next" rmdir /s /q .next

echo [3] غیرفعال کردن سیستم‌های مخرب شبکه و اعمال تنظیمات پایدار...
set NEXT_TELEMETRY_DISABLED=1
set NODE_OPTIONS=--max-old-space-size=4096

echo.
echo [4] در حال راه‌اندازی سرور روی http://localhost:3000 ...
call npm run dev

echo.
echo Server Stopped.
pause
