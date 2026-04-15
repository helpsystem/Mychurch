@echo off
REM MyChurch Deployment Script
REM استريپت استقرار MyChurch
REM Usage: DEPLOY.bat

echo.
echo ================================
echo ^(^*^) MyChurch Deployment Started
echo ================================
echo.

REM Step 1: Pull latest code
echo [1/6] Pulling latest code from GitHub...
cd /d "%~dp0"
git pull origin main
if errorlevel 1 (
    echo ERROR: Failed to pull code
    pause
    exit /b 1
)
echo ^✓ Code pulled successfully
echo.

REM Step 2: Install dependencies
echo [2/6] Installing dependencies...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ^✓ Dependencies installed
echo.

REM Step 3: Build for production
echo [3/6] Building for production...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo ^✓ Build completed successfully
echo.

REM Step 4: Stop old process (if running)
echo [4/6] Stopping old process...
taskkill /F /IM node.exe 2>nul || (
    echo No running Node process found
)
timeout /t 2 /nobreak
echo.

REM Step 5: Start new process
echo [5/6] Starting new process...
start "" node node_modules/.bin/next start
timeout /t 3 /nobreak
echo ^✓ Process started (check running processes if not visible)
echo.

REM Step 6: Cache Clearing Instructions
echo [6/6] Cache Clearing Instructions
echo.
echo WARNING: Clear browser cache using one of these methods:
echo   1. Chrome/Firefox/Edge: Press Ctrl+Shift+Delete
echo   2. Or: Right-click page ^> Inspect ^> Network tab
echo   3. Check "Disable cache" and reload with F5
echo.

echo.
echo ================================
echo ^✓ Deployment completed!
echo ================================
echo.
echo DEPLOYED FEATURES:
echo   ^✓ Slide Preview Modal
echo   ^✓ Preview Button (Eye icon)
echo   ^✓ Bible Dropdown z-index Fix
echo.
echo TESTING CHECKLIST:
echo   - [ ] Click preview button on any slide
echo   - [ ] Verify modal opens and shows verse info
echo   - [ ] Click to expand verses and see full text
echo   - [ ] Test Copy button for verse content
echo   - [ ] Check Bible dropdown appears ABOVE chapter content
echo.
pause
