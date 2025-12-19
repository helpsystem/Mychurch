# Start MyChurch Development Servers
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MyChurch Development Servers" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Add Node.js to PATH
$nodePath = "C:\Program Files\nodejs"
$env:Path = "$nodePath;$env:Path"

# Verify Node.js is available
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = & "$nodePath\node.exe" --version
$npmVersion = & "$nodePath\npm.cmd" --version
Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "npm: $npmVersion" -ForegroundColor Green
Write-Host ""

# Navigate to project directory
Set-Location -Path $PSScriptRoot

Write-Host "Starting servers..." -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the development servers
& "$nodePath\npm.cmd" run dev:full
