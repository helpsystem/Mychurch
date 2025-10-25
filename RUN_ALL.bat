@echo off
chcp 65001 > nul
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║         🎵 سیستم مدیریت سرودها — اجرای کامل 🎵                  ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo این اسکریپت ۳ مرحله را به‌صورت خودکار انجام می‌دهد:
echo   1️⃣  استخراج سرودها از آرشیو HTML
echo   2️⃣  ساخت پروژه React
echo   3️⃣  راه‌اندازی سرور تست
echo.
pause
echo.

REM ═══════════════════════════════════════════════════════════════════
REM مرحله 1: استخراج سرودها
REM ═══════════════════════════════════════════════════════════════════
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║              مرحله 1️⃣ : استخراج سرودها                          ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

REM Check Python
py --version >nul 2>&1
if %errorlevel% neq 0 (
    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Python یافت نشد!
        echo 📥 لطفاً Python را نصب کنید: https://www.python.org/downloads/
        pause
        exit /b 1
    )
)

echo ✅ Python آماده است
echo.

REM Install dependencies
echo 📦 نصب کتابخانه‌های Python...
pip install -q beautifulsoup4 lxml mutagen 2>nul
if %errorlevel% equ 0 (
    echo ✅ کتابخانه‌ها نصب شدند
) else (
    echo ⚠️  برخی کتابخانه‌ها ممکن است قبلاً نصب شده باشند
)
echo.

REM Run extraction
echo 🚀 شروع استخراج سرودها...
echo    این ممکن است چند دقیقه طول بکشد...
echo.

cd scripts
py extract_worship_songs.py

if %errorlevel% neq 0 (
    echo.
    echo ❌ خطا در استخراج! لطفاً لاگ بالا را بررسی کنید.
    cd ..
    pause
    exit /b 1
)

cd ..
echo.
echo ✅ مرحله 1 با موفقیت انجام شد!
echo.
pause

REM ═══════════════════════════════════════════════════════════════════
REM مرحله 2: ساخت پروژه
REM ═══════════════════════════════════════════════════════════════════
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║              مرحله 2️⃣ : ساخت پروژه React                        ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo 📦 نصب dependencies...
    call npm install
    echo.
)

echo 🔨 در حال ساخت پروژه...
echo.

call npm run build

if %errorlevel% neq 0 (
    echo.
    echo ❌ خطا در build! لطفاً خطاها را بررسی کنید.
    pause
    exit /b 1
)

echo.
echo ✅ مرحله 2 با موفقیت انجام شد!
echo 📂 فایل‌های ساخته شده در: dist\
echo.
pause

REM ═══════════════════════════════════════════════════════════════════
REM مرحله 3: بررسی نهایی
REM ═══════════════════════════════════════════════════════════════════
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║              مرحله 3️⃣ : بررسی فایل‌ها                          ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

REM Check JSON file
if exist "dist\worship\data\worship_songs.json" (
    echo ✅ فایل JSON موجود است
    for %%F in (dist\worship\data\worship_songs.json) do echo    📊 حجم: %%~zF bytes
) else (
    echo ❌ فایل JSON یافت نشد!
    echo    انتظار: dist\worship\data\worship_songs.json
)

echo.

REM Check audio files
if exist "dist\worship\audio\" (
    for /f %%A in ('dir /b /a-d dist\worship\audio\*.mp3 2^>nul ^| find /c /v ""') do set audioCount=%%A
    if defined audioCount (
        echo ✅ فایل‌های صوتی: !audioCount! عدد
    ) else (
        echo ⚠️  هیچ فایل MP3 یافت نشد
    )
) else (
    echo ⚠️  فولدر audio یافت نشد
)

echo.

REM Check PPTX files
if exist "dist\worship\pptx\" (
    for /f %%P in ('dir /b /a-d dist\worship\pptx\*.pptx 2^>nul ^| find /c /v ""') do set pptxCount=%%P
    if defined pptxCount (
        echo ✅ فایل‌های پاورپوینت: !pptxCount! عدد
    ) else (
        echo ⚠️  هیچ فایل PPTX یافت نشد
    )
) else (
    echo ⚠️  فولدر pptx یافت نشد
)

echo.
echo ════════════════════════════════════════════════════════════════════
echo.
echo ✅ همه مراحل با موفقیت انجام شد!
echo.
echo 🎯 مراحل بعدی:
echo.
echo    1️⃣  تست محلی:
echo       cd dist
echo       python -m http.server 8080
echo       سپس باز کنید: http://localhost:8080/#/worship
echo.
echo    2️⃣  آپلود به سرور:
echo       - فولدر dist\ را به سرور آپلود کنید
echo       - یا از FTP/SFTP استفاده کنید
echo.
echo    3️⃣  بررسی نهایی:
echo       - باز کردن صفحه Worship
echo       - تست پخش صوت
echo       - تست حالت پرزنتیشن
echo.
echo ════════════════════════════════════════════════════════════════════
echo.

REM Ask to start test server
echo آیا می‌خواهید سرور تست را الان راه‌اندازی کنید؟
echo.
choice /C YN /M "بله (Y) یا خیر (N)"

if errorlevel 2 (
    echo.
    echo 👋 باشه! برای تست بعداً، دستور زیر را اجرا کنید:
    echo    cd dist
    echo    python -m http.server 8080
    echo.
    pause
    exit /b 0
)

if errorlevel 1 (
    echo.
    echo 🚀 راه‌اندازی سرور تست...
    echo 🌐 سایت در حال اجرا: http://localhost:8080
    echo 🎵 صفحه سرودها: http://localhost:8080/#/worship
    echo.
    echo ⚠️  برای توقف سرور: Ctrl+C
    echo.
    cd dist
    py -m http.server 8080
)
