# Deploy Auto-Sync System to Production
# Run from project root: ./deploy-auto-sync.ps1

Write-Host "🚀 Deploying Auto-Sync System to Production..." -ForegroundColor Cyan

# Step 1: Create migrations directory on server
Write-Host "`n📁 Creating migrations directory..." -ForegroundColor Yellow
ssh root@samanabyar.online "mkdir -p /root/Mychurch/backend/migrations"

# Step 2: Upload migration SQL
Write-Host "`n📤 Uploading database migration..." -ForegroundColor Yellow
scp backend\migrations\create_sync_jobs_table.sql root@samanabyar.online:/root/Mychurch/backend/migrations/

# Step 3: Run migration
Write-Host "`n🗄️ Running database migration..." -ForegroundColor Yellow
ssh root@samanabyar.online "psql -U myuser -d mychurch -f /root/Mychurch/backend/migrations/create_sync_jobs_table.sql"

# Step 4: Upload syncWorker service
Write-Host "`n📤 Uploading Background Worker..." -ForegroundColor Yellow
ssh root@samanabyar.online "mkdir -p /root/Mychurch/backend/services"
scp backend\services\syncWorker.js root@samanabyar.online:/root/Mychurch/backend/services/

# Step 5: Upload updated routes
Write-Host "`n📤 Uploading updated worship routes..." -ForegroundColor Yellow
scp backend\routes\worshipRoutes.js root@samanabyar.online:/root/Mychurch/backend/routes/

# Step 6: Upload updated server.js
Write-Host "`n📤 Uploading updated server..." -ForegroundColor Yellow
scp backend\server.js root@samanabyar.online:/root/Mychurch/backend/

# Step 7: Restart backend
Write-Host "`n🔄 Restarting backend server..." -ForegroundColor Yellow
ssh root@samanabyar.online "pm2 restart mychurch-backend"

Start-Sleep -Seconds 3

# Step 8: Check backend status
Write-Host "`n✅ Checking backend status..." -ForegroundColor Yellow
ssh root@samanabyar.online "pm2 status mychurch-backend"

# Step 9: Show recent logs
Write-Host "`n📋 Recent backend logs:" -ForegroundColor Yellow
ssh root@samanabyar.online "pm2 logs mychurch-backend --lines 30 --nostream"

Write-Host "`n✅ Backend deployment complete!" -ForegroundColor Green
Write-Host "`nℹ️  Worker should show: '🚀 Background Sync Worker started'" -ForegroundColor Cyan

# Step 10: Build frontend
Write-Host "`n🔨 Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}

# Step 11: Deploy frontend
Write-Host "`n📤 Deploying frontend..." -ForegroundColor Yellow

# Remove old JS bundles
Write-Host "Cleaning old bundles..." -ForegroundColor Gray
ssh root@samanabyar.online "rm -f /var/www/html/assets/index-*.js 2>/dev/null || true"

# Upload new bundle
$bundleFile = Get-ChildItem -Path "dist\assets\index-*.js" | Select-Object -First 1
if ($bundleFile) {
    Write-Host "Uploading $($bundleFile.Name)..." -ForegroundColor Gray
    scp $bundleFile.FullName root@samanabyar.online:/var/www/html/assets/
}

# Upload index.html
Write-Host "Uploading index.html..." -ForegroundColor Gray
scp dist\index.html root@samanabyar.online:/var/www/html/

Write-Host "`n✅ Frontend deployment complete!" -ForegroundColor Green

# Step 12: Verification
Write-Host "`n🔍 Verifying deployment..." -ForegroundColor Yellow

Write-Host "`nChecking database table..." -ForegroundColor Gray
ssh root@samanabyar.online "psql -U myuser -d mychurch -c '\d sync_jobs' 2>/dev/null | head -n 10"

Write-Host "`nChecking worker file..." -ForegroundColor Gray
ssh root@samanabyar.online "ls -lh /root/Mychurch/backend/services/syncWorker.js"

Write-Host "`n✅ Deployment verification complete!" -ForegroundColor Green
Write-Host "`n📚 See AUTO_SYNC_SYSTEM_GUIDE.md for usage instructions" -ForegroundColor Cyan
Write-Host "🌐 Access: https://samanabyar.online/#/admin/sync-management" -ForegroundColor Cyan
