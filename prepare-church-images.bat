@echo off
REM Quick script to prepare and upload church images

echo ================================
echo Church Image Preparation Script
echo ================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.
    pause
    exit /b 1
)

REM Check if PIL/Pillow is installed
python -c "import PIL" >nul 2>&1
if errorlevel 1 (
    echo Installing Pillow...
    pip install Pillow
)

echo.
echo Step 1: Creating directories...
if not exist "church-photos-source" mkdir church-photos-source
if not exist "church-photos-optimized" mkdir church-photos-optimized

echo.
echo Step 2: Copy your church photos to: church-photos-source\
echo         (The script will wait for you)
echo.
echo Press any key when photos are ready...
pause >nul

echo.
echo Step 3: Optimizing images...
python optimize-church-images.py

echo.
echo Step 4: Would you like to upload now? (Y/N)
set /p upload="Upload to server? "

if /i "%upload%"=="Y" (
    echo.
    echo Uploading images to server...
    
    REM Upload church photos
    scp church-photos-optimized\church-interior-*.jpg root@samanabyar.online:/root/Mychurch/public/church-photos/
    
    REM Upload icons
    scp church-photos-optimized\apple.png root@samanabyar.online:/root/Mychurch/public/images/
    scp church-photos-optimized\google.png root@samanabyar.online:/root/Mychurch/public/images/
    scp church-photos-optimized\card.png root@samanabyar.online:/root/Mychurch/public/images/
    
    echo.
    echo ✅ Upload complete!
    echo.
    echo Step 5: Rebuilding site on server...
    ssh root@samanabyar.online "cd /root/Mychurch && npm run build"
    
    echo.
    echo ✅ All done! Check: https://samanabyar.online
) else (
    echo.
    echo Skipped upload. To upload later, run:
    echo   bash upload-images.sh
)

echo.
pause
