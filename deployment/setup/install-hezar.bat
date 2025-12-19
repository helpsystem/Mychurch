@echo off
chcp 65001 >nul
echo ====================================
echo نصب و راه‌اندازی Hezar TTS
echo ====================================
echo.

REM بررسی وجود Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python یافت نشد!
    echo لطفاً Python 3.8+ را نصب کنید: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✓ Python یافت شد
python --version

echo.
echo 📦 نصب کتابخانه‌های مورد نیاز...
echo.

REM نصب Hezar
echo [1/5] نصب Hezar...
pip install hezar -q

REM نصب کتابخانه‌های صوتی
echo [2/5] نصب SoundFile...
pip install soundfile -q

echo [3/5] نصب Librosa...
pip install librosa -q

echo [4/5] نصب PyDub...
pip install pydub -q

echo [5/5] نصب NumPy...
pip install numpy -q

echo.
echo ====================================
echo ✅ نصب کامل شد!
echo ====================================
echo.

REM بررسی ffmpeg
where ffmpeg >nul 2>&1
if errorlevel 1 (
    echo ⚠️  ffmpeg یافت نشد
    echo برای ترکیب فایل‌های صوتی، ffmpeg نیاز است:
    echo   - دانلود: https://ffmpeg.org/download.html
    echo   - یا نصب با Chocolatey: choco install ffmpeg
    echo.
) else (
    echo ✓ ffmpeg یافت شد
    ffmpeg -version | findstr "ffmpeg version"
)

echo.
echo 📖 راهنمای استفاده:
echo.
echo   تولید یک فصل:
echo     python scripts\hezar_tts_generator.py --book EPH --chapter 1
echo.
echo   تولید و ترکیب:
echo     python scripts\hezar_tts_generator.py --book EPH --chapter 1 --combine
echo.
echo   تولید تمام کتاب مقدس:
echo     python scripts\generate_all_bible_audio.py
echo.
echo   تولید از کتاب خاص:
echo     python scripts\generate_all_bible_audio.py --start-from EPH
echo.

pause
