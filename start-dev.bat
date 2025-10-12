@echo off
REM ====================================
REM  MyChurch Development Server Starter
REM ====================================

echo.
echo ========================================
echo   Starting MyChurch Development Servers
echo ========================================
echo.

REM Kill any existing Node processes
echo [1/3] Stopping existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Start Backend and Frontend together
echo [2/3] Starting Backend + Frontend...
echo.
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5173
echo.
echo [3/3] Servers are starting...
echo.
echo ========================================
echo   Press Ctrl+C to stop all servers
echo ========================================
echo.

REM Run both servers with concurrently
npm run dev:full

pause
