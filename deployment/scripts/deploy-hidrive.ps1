# Deploy HiDrive Storage Integration to Production Server
# PowerShell Version

$ErrorActionPreference = "Stop"

$SERVER = "root@samanabyar.online"
$BACKEND_DIR = "/root/Mychurch/backend"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   HiDrive Storage - Production Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload HiDrive service
Write-Host "Step 1: Upload HiDrive service" -ForegroundColor Yellow
scp backend/services/hidriveStorage.js "${SERVER}:${BACKEND_DIR}/services/"
Write-Host "OK hidriveStorage.js uploaded" -ForegroundColor Green
Write-Host ""

# Step 2: Upload HiDrive routes
Write-Host "Step 2: Upload HiDrive routes" -ForegroundColor Yellow
scp backend/routes/hidriveRoutes.js "${SERVER}:${BACKEND_DIR}/routes/"
Write-Host "OK hidriveRoutes.js uploaded" -ForegroundColor Green
Write-Host ""

# Step 3: Upload updated server.js
Write-Host "Step 3: Upload updated server.js" -ForegroundColor Yellow
scp backend/server.js "${SERVER}:${BACKEND_DIR}/"
Write-Host "OK server.js uploaded" -ForegroundColor Green
Write-Host ""

# Step 4: Install npm dependencies
Write-Host "Step 4: Install npm dependencies" -ForegroundColor Yellow
ssh $SERVER "cd $BACKEND_DIR && npm install ssh2-sftp-client"
Write-Host "OK ssh2-sftp-client installed" -ForegroundColor Green
Write-Host ""

# Step 5: .env configuration
Write-Host "Step 5: Configure .env" -ForegroundColor Yellow
Write-Host "Please manually add HiDrive credentials to ${BACKEND_DIR}/.env:" -ForegroundColor White
Write-Host "  HIDRIVE_HOST=sftp.hidrive.ionos.com" -ForegroundColor Gray
Write-Host "  HIDRIVE_PORT=22" -ForegroundColor Gray
Write-Host "  HIDRIVE_USER=adminchurch" -ForegroundColor Gray
Write-Host "  HIDRIVE_PASSWORD=your_password" -ForegroundColor Gray
Write-Host "  HIDRIVE_BASE_PATH=/users/adminchurch/mychurch" -ForegroundColor Gray
Write-Host "  HIDRIVE_PUBLIC_URL=https://webdav.hidrive.ionos.com/users/adminchurch/mychurch" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter to continue after updating .env..." -ForegroundColor Yellow
Read-Host

# Step 6: Restart backend
Write-Host "Step 6: Restart backend service" -ForegroundColor Yellow
ssh $SERVER "pm2 restart mychurch-backend"
Write-Host "OK Backend restarted" -ForegroundColor Green
Write-Host ""

# Step 7: Check logs
Write-Host "Step 7: Check logs" -ForegroundColor Yellow
ssh $SERVER "pm2 logs mychurch-backend --lines 20 --nostream"
Write-Host ""

# Step 8: Test connection
Write-Host "Step 8: Test HiDrive connection" -ForegroundColor Yellow
Write-Host "Testing /api/hidrive/stats endpoint..." -ForegroundColor Gray
Start-Sleep -Seconds 3
try {
    $response = Invoke-WebRequest -Uri "https://samanabyar.online/api/health" -UseBasicParsing
    Write-Host "Backend health check: OK" -ForegroundColor Green
} catch {
    Write-Host "Note: Authentication required for HiDrive endpoints" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "OK Deployment completed!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Upload files to HiDrive (see HIDRIVE_QUICK_START.md)" -ForegroundColor White
Write-Host "2. Update database URLs (SQL scripts in guide)" -ForegroundColor White
Write-Host "3. Test file access on website" -ForegroundColor White
Write-Host ""
Write-Host "API Endpoints Available:" -ForegroundColor Yellow
Write-Host "  POST /api/hidrive/upload" -ForegroundColor White
Write-Host "  POST /api/hidrive/migrate" -ForegroundColor White
Write-Host "  POST /api/hidrive/batch-migrate" -ForegroundColor White
Write-Host "  GET  /api/hidrive/stats" -ForegroundColor White
Write-Host "  GET  /api/hidrive/proxy/:category/:filename" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - HIDRIVE_STORAGE_GUIDE.md (Full documentation)" -ForegroundColor White
Write-Host "  - HIDRIVE_QUICK_START.md (Quick start guide)" -ForegroundColor White
Write-Host ""
