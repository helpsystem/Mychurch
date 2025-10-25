@echo off
chcp 65001 > nul
title Worship Songs Extractor

echo ═══════════════════════════════════════════════════════════
echo 🎵 Worship Songs Extractor
echo ═══════════════════════════════════════════════════════════
echo.

REM Check if Python is installed
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python یافت نشد!
    echo.
    echo لطفاً Python 3.7+ را نصب کنید:
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo ✅ Python نصب است
echo.

REM Check if beautifulsoup4 is installed
python -c "import bs4" > nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  beautifulsoup4 نصب نیست
    echo 📦 در حال نصب کتابخانه‌های مورد نیاز...
    echo.
    pip install -r requirements.txt
    echo.
)

echo ═══════════════════════════════════════════════════════════
echo 🚀 اجرای اسکریپت استخراج...
echo ═══════════════════════════════════════════════════════════
echo.

REM Run the extractor
python extract_worship_songs.py

echo.
echo ═══════════════════════════════════════════════════════════
echo ✨ اتمام
echo ═══════════════════════════════════════════════════════════
echo.

pause
