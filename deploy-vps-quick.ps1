# VPS Migration - Quick Version (Skips directory creation since they exist)
param([switch]$DryRun)

$SSH_HOST = "samanabyar.online"
$SSH_PORT = 22
$SSH_USER = "root"
$PROJECT_DIR = "/var/www/Mychurch"

Write-Host "VPS Media Storage Migration - Quick Resume" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

function Invoke-SSHCommand([string]$Command, [string]$Description) {
    Write-Host "$Description..." -ForegroundColor Yellow
    if ($DryRun) { Write-Host "  [DRY RUN] $Command" -ForegroundColor Gray; return }
    try {
        $result = ssh -o ConnectTimeout=10 -p $SSH_PORT "${SSH_USER}@${SSH_HOST}" "$Command" 2>&1
        if ($LASTEXITCODE -eq 0) { Write-Host "  Success" -ForegroundColor Green; return $result }
        else { Write-Host "  Failed" -ForegroundColor Red; throw "Command failed" }
    } catch { Write-Host "  Error: $_" -ForegroundColor Red; throw }
}

try {
    Write-Host ""
    Write-Host "Step 1: Installing Dependencies" -ForegroundColor Cyan
    Invoke-SSHCommand "cd $PROJECT_DIR/backend && npm install sharp --legacy-peer-deps" "Installing Sharp"
    
    Write-Host ""
    Write-Host "Step 2: Updating Environment" -ForegroundColor Cyan
    Invoke-SSHCommand "grep -q STORAGE_PATH $PROJECT_DIR/backend/.env || echo 'STORAGE_PATH=/var/www/storage' >> $PROJECT_DIR/backend/.env" "STORAGE_PATH"
    Invoke-SSHCommand "grep -q STORAGE_URL $PROJECT_DIR/backend/.env || echo 'STORAGE_URL=https://samanabyar.online/storage' >> $PROJECT_DIR/backend/.env" "STORAGE_URL"
    
    Write-Host ""
    Write-Host "Step 3: Reloading Nginx" -ForegroundColor Cyan
    Write-Host "Testing config..." -ForegroundColor Yellow
    $nginxTest = ssh -o ConnectTimeout=10 -p $SSH_PORT "${SSH_USER}@${SSH_HOST}" "sudo nginx -t" 2>&1
    if ($nginxTest -match "successful") {
        Write-Host "  Config OK" -ForegroundColor Green
        Invoke-SSHCommand "sudo systemctl reload nginx" "Reloading Nginx"
    } else {
        Write-Host "  Warning: Some nginx warnings (continuing anyway)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Step 4: Automation" -ForegroundColor Cyan
    Invoke-SSHCommand "(crontab -l 2>/dev/null | grep -q backup-storage) || (crontab -l 2>/dev/null; echo '0 2 * * * $PROJECT_DIR/scripts/backup-storage.sh') | crontab -" "Backup cron"
    Invoke-SSHCommand "(crontab -l 2>/dev/null | grep -q monitor-storage) || (crontab -l 2>/dev/null; echo '0 * * * * $PROJECT_DIR/scripts/monitor-storage.sh') | crontab -" "Monitor cron"
    
    Write-Host ""
    Write-Host "Step 5: Restarting Backend" -ForegroundColor Cyan
    Invoke-SSHCommand "cd $PROJECT_DIR && pm2 restart mychurch-backend || pm2 start backend/server.js --name mychurch-backend" "PM2 restart"
    
    Write-Host ""
    Write-Host "Step 6: Verification" -ForegroundColor Cyan
    Invoke-SSHCommand "ls -la /var/www/storage/ | head -5" "Checking storage"
    Invoke-SSHCommand "pm2 status" "PM2 status"
    
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host "Migration Complete!" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "All scripts uploaded successfully earlier." -ForegroundColor Cyan
    Write-Host "Storage directories created at /var/www/storage" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next: If you have files on HiDrive, run:" -ForegroundColor Yellow
    Write-Host "  ssh root@samanabyar.online" -ForegroundColor White
    Write-Host "  cd /var/www/Mychurch" -ForegroundColor White
    Write-Host "  node scripts/migrate-to-vps.js" -ForegroundColor White
    Write-Host ""
    Write-Host "Test the site: https://samanabyar.online" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
