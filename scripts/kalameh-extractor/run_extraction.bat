@echo off
REM Quick Start Script for Kalameh Song Extractor
REM Run this from the kalameh-extractor folder

echo.
echo ================================================
echo   Kalameh Song Archive Extractor
echo ================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org
    pause
    exit /b 1
)

echo [1/4] Checking Python dependencies...
pip show beautifulsoup4 >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r requirements.txt
) else (
    echo Dependencies already installed.
)

echo.
echo [2/4] Running extraction script...
echo This may take a few minutes...
echo.
python extract_kalameh_songs.py

if errorlevel 1 (
    echo.
    echo ERROR: Extraction failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Checking export folder...
if exist "export\songs_index.json" (
    echo SUCCESS: songs_index.json created
) else (
    echo WARNING: songs_index.json not found
)

if exist "export\songs.db" (
    echo SUCCESS: songs.db created
) else (
    echo WARNING: songs.db not found
)

echo.
echo [4/4] Next Steps:
echo    1. Import songs_schema.sql to Supabase
echo    2. Load songs_index.json to database
echo    3. Test API at http://localhost:3001/api/songs
echo    4. Open website at http://localhost:5173/songs
echo.
echo ================================================
echo   Extraction Complete!
echo ================================================
echo.

REM Open export folder
start explorer "export"

pause
