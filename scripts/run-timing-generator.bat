@echo off
REM ==================================================
REM Worship Timing Auto-Generator
REM Runs at 8:00 AM EST daily (when Gemini quota resets)
REM ==================================================

cd /d "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\backend"

echo.
echo [%date% %time%] Starting Worship Timing Generation...
echo.

REM Run the batch timing generator
node batch-generate-worship-timing.js

echo.
echo [%date% %time%] Completed!
echo.

pause
