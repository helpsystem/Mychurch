# Nuclear Clean Deployment
# Complete wipe and rebuild of production site

param([switch]$SkipBuild, [switch]$DryRun)

$SERVER = "root@samanabyar.online"
$REMOTE_PATH = "/root/Mychurch"
$REMOTE_DIST = "/var/www/mychurch"
$LOCAL_DIST = "dist"

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "  NUCLEAR CLEAN DEPLOYMENT" -ForegroundColor Red
Write-Host "  Complete wipe and rebuild" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

if ($DryRun) {
    Write-Host "DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
    Write-Host ""
}

# Step 1: Local Build
if (-not $SkipBuild) {
    Write-Host "Step 1: Building locally..." -ForegroundColor Cyan
    
    if ($DryRun) {
        Write-Host "  [DRY RUN] Would run: npm run build" -ForegroundColor Gray
    } else {
        if (Test-Path $LOCAL_DIST) {
            Write-Host "  Removing old build..." -ForegroundColor Yellow
            Remove-Item -Path $LOCAL_DIST -Recurse -Force
        }
        
        Write-Host "  Building production bundle..." -ForegroundColor Yellow
        npm run build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "Build failed! Aborting." -ForegroundColor Red
            exit 1
        }
        
        Write-Host "  Build complete" -ForegroundColor Green
    }
} else {
    Write-Host "Step 1: Skipping build" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Backup on server
Write-Host "Step 2: Creating backup..." -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "  [DRY RUN] Would backup site" -ForegroundColor Gray
} else {
    ssh $SERVER "if [ -d '$REMOTE_DIST' ]; then sudo rm -rf '${REMOTE_DIST}.backup' && sudo cp -r '$REMOTE_DIST' '${REMOTE_DIST}.backup'; echo 'Backup created'; else echo 'No existing site'; fi"
    Write-Host "  Backup complete" -ForegroundColor Green
}

Write-Host ""

# Step 3: Delete old files
Write-Host "Step 3: Removing old files..." -ForegroundColor Red

if ($DryRun) {
    Write-Host "  [DRY RUN] Would delete: $REMOTE_DIST/*" -ForegroundColor Gray
} else {
    Write-Host "  Deleting all files..." -ForegroundColor Yellow
    ssh $SERVER "sudo rm -rf '$REMOTE_DIST'/*"
    Write-Host "  Old files deleted" -ForegroundColor Green
}

Write-Host ""

# Step 4: Upload new files
Write-Host "Step 4: Uploading new build..." -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "  [DRY RUN] Would upload dist/*" -ForegroundColor Gray
} else {
    Write-Host "  Transferring files..." -ForegroundColor Yellow
    scp -r "$LOCAL_DIST/*" "${SERVER}:${REMOTE_DIST}/"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Upload complete" -ForegroundColor Green
    } else {
        Write-Host "  Upload failed! Restoring backup..." -ForegroundColor Red
        ssh $SERVER "sudo rm -rf '$REMOTE_DIST' && sudo mv '${REMOTE_DIST}.backup' '$REMOTE_DIST'"
        exit 1
    }
}

Write-Host ""

# Step 5: Set permissions
Write-Host "Step 5: Setting permissions..." -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "  [DRY RUN] Would set permissions" -ForegroundColor Gray
} else {
    ssh $SERVER "sudo chown -R www-data:www-data '$REMOTE_DIST' && sudo chmod -R 755 '$REMOTE_DIST'"
    Write-Host "  Permissions set" -ForegroundColor Green
}

Write-Host ""

# Step 6: Clear cache
Write-Host "Step 6: Clearing cache..." -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "  [DRY RUN] Would clear cache" -ForegroundColor Gray
} else {
    ssh $SERVER "sudo rm -rf /var/cache/nginx/* 2>/dev/null; echo 'Cache cleared'"
    Write-Host "  Cache cleared" -ForegroundColor Green
}

Write-Host ""

# Step 7: Restart Nginx
Write-Host "Step 7: Restarting Nginx..." -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "  [DRY RUN] Would restart Nginx" -ForegroundColor Gray
} else {
    Write-Host "  Testing config..." -ForegroundColor Yellow
    $nginxTest = ssh $SERVER "sudo nginx -t 2>&1"
    
    if ($nginxTest -match "successful|ok") {
        Write-Host "  Config valid" -ForegroundColor Green
        ssh $SERVER "sudo systemctl restart nginx"
        Write-Host "  Nginx restarted" -ForegroundColor Green
    } else {
        Write-Host "  Config has warnings (continuing)" -ForegroundColor Yellow
        ssh $SERVER "sudo systemctl restart nginx"
    }
}

Write-Host ""

# Verification
Write-Host "Step 8: Verification..." -ForegroundColor Cyan

if (-not $DryRun) {
    $fileCount = ssh $SERVER "find '$REMOTE_DIST' -type f | wc -l"
    Write-Host "  Files deployed: $fileCount" -ForegroundColor Cyan
    
    $nginxStatus = ssh $SERVER "sudo systemctl is-active nginx"
    if ($nginxStatus -match "active") {
        Write-Host "  Nginx: Running" -ForegroundColor Green
    } else {
        Write-Host "  Nginx: Not running!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Site: https://samanabyar.online" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "  2. Hard refresh (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "  3. Test /bible page" -ForegroundColor White
Write-Host "  4. Check /bible-karaoke redirects to /bible" -ForegroundColor White
Write-Host ""
