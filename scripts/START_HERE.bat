@echo off
chcp 65001 > nul
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     🎵 استخراج سرودها از آرشیو Kalameh.com 🎵                ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Check if Python is installed
py --version >nul 2>&1
if %errorlevel% neq 0 (
    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Python یافت نشد! لطفاً Python نصب کنید.
        echo 📥 دانلود از: https://www.python.org/downloads/
        echo.
        pause
        exit /b 1
    )
)

echo ✅ Python نصب است
echo.

REM Check if required packages are installed
echo 📦 بررسی کتابخانه‌های مورد نیاز...
pip show beautifulsoup4 >nul 2>&1
if %errorlevel% neq 0 (
    echo 📥 نصب beautifulsoup4...
    pip install beautifulsoup4
)

pip show lxml >nul 2>&1
if %errorlevel% neq 0 (
    echo 📥 نصب lxml...
    pip install lxml
)

pip show mutagen >nul 2>&1
if %errorlevel% neq 0 (
    echo 📥 نصب mutagen...
    pip install mutagen
)

echo ✅ تمام کتابخانه‌ها آماده است
echo.

REM Run the extraction script
echo 🚀 شروع استخراج...
echo.
py extract_worship_songs.py

REM Check if extraction was successful
if %errorlevel% equ 0 (
    echo.
    echo ╔═══════════════════════════════════════════════════════════════╗
    echo ║              ✅ استخراج با موفقیت انجام شد! ✅               ║
    echo ╚═══════════════════════════════════════════════════════════════╝
    echo.
    echo 📂 فایل‌ها استخراج شده در: ..\public\worship\
    echo 📝 فایل JSON: ..\public\worship\data\worship_songs.json
    echo.
    echo 🎯 مراحل بعدی:
    echo    1. بررسی فایل worship_songs.json
    echo    2. اجرای: npm run build
    echo    3. تست صفحه Worship در مرورگر
    echo.
) else (
    echo.
    echo ╔═══════════════════════════════════════════════════════════════╗
    echo ║                 ❌ خطا در استخراج ❌                        ║
    echo ╚═══════════════════════════════════════════════════════════════╝
    echo.
    echo 💡 راهنمایی:
    echo    - مطمئن شوید فایل HTML موجود است
    echo    - مسیر فایل را در extract_worship_songs.py چک کنید
    echo    - راهنما را بخوانید: ..\WORSHIP_SETUP_GUIDE.md
    echo.
)

pause
