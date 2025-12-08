#!/usr/bin/env pwsh
# Deploy Storage System to Server

Write-Host "=== Storage System Deployment ===" -ForegroundColor Cyan
Write-Host ""

$SERVER = "root@samanabyar.online"
$PROJECT_DIR = "/root/Mychurch"

# 1. Upload Storage Service
Write-Host "[1/5] Uploading Storage Service..." -ForegroundColor Yellow
scp backend/services/storageService.js "${SERVER}:${PROJECT_DIR}/backend/services/"
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Failed to upload storageService.js" -ForegroundColor Red
    exit 1 
}
Write-Host "✓ Storage service uploaded" -ForegroundColor Green

# 2. Upload Storage Routes
Write-Host "[2/5] Uploading Storage Routes..." -ForegroundColor Yellow
scp backend/routes/storageRoutes.js "${SERVER}:${PROJECT_DIR}/backend/routes/"
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Failed to upload storageRoutes.js" -ForegroundColor Red
    exit 1 
}
Write-Host "✓ Storage routes uploaded" -ForegroundColor Green

# 3. Upload Migration Script
Write-Host "[3/5] Uploading Migration Script..." -ForegroundColor Yellow
scp scripts/migrate-to-storage.cjs "${SERVER}:${PROJECT_DIR}/scripts/"
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Failed to upload migrate-to-storage.cjs" -ForegroundColor Red
    exit 1 
}
Write-Host "✓ Migration script uploaded" -ForegroundColor Green

# 4. Upload Updated server.js
Write-Host "[4/5] Uploading Updated server.js..." -ForegroundColor Yellow
scp backend/server.js "${SERVER}:${PROJECT_DIR}/backend/"
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Failed to upload server.js" -ForegroundColor Red
    exit 1 
}
Write-Host "✓ Server.js uploaded" -ForegroundColor Green

# 5. Restart Backend
Write-Host "[5/5] Restarting Backend..." -ForegroundColor Yellow
ssh $SERVER "cd $PROJECT_DIR && pm2 restart mychurch-backend"
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Failed to restart backend" -ForegroundColor Red
    exit 1 
}
Write-Host "✓ Backend restarted" -ForegroundColor Green

Write-Host ""
Write-Host "=== Deployment Complete! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test API: curl https://samanabyar.online/api/storage/buckets"
Write-Host "2. Setup buckets: ssh $SERVER 'cd $PROJECT_DIR && node scripts/migrate-to-storage.cjs --type=setup'"
Write-Host "3. Test migration: ssh $SERVER 'cd $PROJECT_DIR && node scripts/migrate-to-storage.cjs --type=bible-timings'"
Write-Host ""
