
# fix-502.ps1
# Run this to diagnose and fix the 502 Bad Gateway error on samanabyar.online

param(
    [string]$SshHost = "samanabyar.online",
    [string]$SshUser = "root"
)

$sshTarget = "$SshUser@$SshHost"

Write-Host "=== Diagnosing 502 Bad Gateway on $SshHost ===" -ForegroundColor Cyan

# Step 1: Check PM2 status
Write-Host "`n[1] Checking PM2 process status..." -ForegroundColor Yellow
ssh $sshTarget "pm2 list"

# Step 2: Check if port 3000 is listening
Write-Host "`n[2] Checking if port 3000 is listening..." -ForegroundColor Yellow
ssh $sshTarget "ss -tlnp | grep 3000 || echo 'PORT 3000 NOT LISTENING'"

# Step 3: Check PM2 logs for errors
Write-Host "`n[3] Last 30 lines of PM2 error log..." -ForegroundColor Yellow
ssh $sshTarget "pm2 logs --lines 30 --nostream 2>/dev/null || journalctl -u pm2-root -n 30 2>/dev/null || echo 'No PM2 logs found'"

# Step 4: Check disk space (full disk can crash Node)
Write-Host "`n[4] Disk usage..." -ForegroundColor Yellow
ssh $sshTarget "df -h /"

# Step 5: Check memory 
Write-Host "`n[5] Memory usage..." -ForegroundColor Yellow
ssh $sshTarget "free -h"

# Step 6: Attempt fix - restart PM2
Write-Host "`n[6] Attempting PM2 restart..." -ForegroundColor Green
ssh $sshTarget @"
cd /var/www/mychurch-next 2>/dev/null || cd /root/mychurch-next 2>/dev/null || cd /home/*/mychurch-next 2>/dev/null

echo '--- Current directory ---'
pwd

echo '--- PM2 restart ---'
pm2 restart all 2>/dev/null || pm2 start ecosystem.config.js 2>/dev/null || pm2 start npm --name 'nextjs' -- start

echo '--- Waiting 5 seconds ---'
sleep 5

echo '--- PM2 status after restart ---'
pm2 list

echo '--- Port 3000 after restart ---'
ss -tlnp | grep 3000 || echo 'Still not on port 3000!'
"@

Write-Host "`n=== Done! Check https://$SshHost now ===" -ForegroundColor Cyan
