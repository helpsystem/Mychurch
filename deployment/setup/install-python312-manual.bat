@echo off
chcp 65001 >nul
echo ============================================
echo نصب Python 3.12 برای Hezar
echo ============================================
echo.

echo لطفاً این مراحل را دنبال کنید:
echo.

echo 1. مرورگر را باز کنید و به این آدرس بروید:
echo    https://www.python.org/downloads/release/python-3128/
echo.

echo 2. فایل "Windows installer (64-bit)" را دانلود کنید
echo.

echo 3. فایل دانلود شده را اجرا کنید
echo.

echo 4. در پنجره نصب:
echo    ✓ تیک "Add Python to PATH" را بزنید
echo    ✓ روی "Install Now" کلیک کنید
echo.

echo 5. بعد از نصب، این پنجره را ببندید و یک PowerShell جدید باز کنید
echo.

echo 6. در PowerShell جدید این دستور را اجرا کنید:
echo    py -3.12 --version
echo.

echo 7. اگر موفق بود، Hezar را نصب کنید:
echo    py -3.12 -m pip install hezar scipy
echo.

echo ============================================
echo.

echo آیا می‌خواهید صفحه دانلود Python 3.12 را باز کنم؟ (Y/N)
set /p response=

if /i "%response%"=="Y" (
    start https://www.python.org/downloads/release/python-3128/
    echo.
    echo ✅ مرورگر باز شد. لطفاً مراحل بالا را دنبال کنید.
) else (
    echo.
    echo 👍 خودتان می‌توانید از این لینک دانلود کنید:
    echo https://www.python.org/downloads/release/python-3128/
)

echo.
pause
