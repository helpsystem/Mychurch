# Start Local Development Environment
Write-Host "🚀 شروع محیط توسعه محلی..." -ForegroundColor Cyan

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 نصب وابستگی‌ها..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "backend/node_modules")) {
    Write-Host "📦 نصب وابستگی‌های backend..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

# Start Backend Server
Write-Host "🔧 راه‌اندازی Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; node dev-server.js"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "🎨 راه‌اندازی Frontend Server..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "`n✅ سرورها در حال راه‌اندازی هستند..." -ForegroundColor Green
Write-Host "   - Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "`n⏳ لطفا چند ثانیه صبر کنید..." -ForegroundColor Yellow
