@echo off
chcp 65001 >nul
title MyChurch Development Server
color 0A

echo ╔════════════════════════════════════════╗
echo ║   🚀 راه‌اندازی سایت MyChurch         ║
echo ╚════════════════════════════════════════╝
echo.

:: بررسی نصب node_modules
if not exist "node_modules\" (
    echo [📦] نصب وابستگی‌های root...
    call npm install
)

if not exist "backend\node_modules\" (
    echo [📦] نصب وابستگی‌های backend...
    cd backend
    call npm install
    cd ..
)

echo.
echo [✓] وابستگی‌ها نصب شده
echo.
echo [🔧] راه‌اندازی Backend Server...
start "MyChurch Backend" cmd /k "cd /d "%~dp0backend" && node dev-server.js"

timeout /t 3 /nobreak >nul

echo [🎨] راه‌اندازی Frontend Server...
start "MyChurch Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ╔════════════════════════════════════════╗
echo ║   ✅ سرورها در حال راه‌اندازی...     ║
echo ╠════════════════════════════════════════╣
echo ║   Backend:  http://localhost:3001     ║
echo ║   Frontend: http://localhost:5173     ║
echo ╚════════════════════════════════════════╝
echo.
echo ⏳ لطفاً چند ثانیه صبر کنید تا سرورها کامل راه‌اندازی شوند...
echo.
echo 💡 هر دو سرور در پنجره‌های جداگانه باز شدند.
echo 🌐 بعد از 10 ثانیه، مرورگر خودکار باز می‌شود.
echo.

timeout /t 10 /nobreak >nul

start http://localhost:5173

echo.
echo ✨ مرورگر باز شد! سایت شما در http://localhost:5173 در دسترس است.
echo.
pause
