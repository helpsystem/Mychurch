# ====================================
#  MyChurch Development Server Starter
# ====================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Starting MyChurch Development Servers" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan

# Kill any existing Node processes
Write-Host "[1/3] Stopping existing Node processes..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start Backend and Frontend together
Write-Host "[2/3] Starting Backend + Frontend..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "[3/3] Servers are starting..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop all servers" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan

# Run both servers with concurrently
npm run dev:full
