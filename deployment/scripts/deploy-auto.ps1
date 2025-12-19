# Auto-deploy script with embedded credentials
# Usage: .\deploy-auto.ps1

$SERVER = "root@samanabyar.online"
$SERVER_PASSWORD = "Iranian@1989"
$HIDRIVE_USER = "adminchurch"
$HIDRIVE_PASSWORD = "Iranian@1989"

Write-Host "🚀 Starting auto-deployment..." -ForegroundColor Cyan

# Function to run SSH command with password
function Invoke-SSHCommand {
    param(
        [string]$Command
    )
    
    Write-Host "📡 Executing: $Command" -ForegroundColor Gray
    
    # Use plink or sshpass if available, otherwise use expect
    $result = echo $SERVER_PASSWORD | ssh -o StrictHostKeyChecking=no $SERVER "$Command" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Command failed with exit code $LASTEXITCODE" -ForegroundColor Yellow
    }
    
    return $result
}

# Step 1: Build frontend
Write-Host "`n📦 Building frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Deploy frontend to server
Write-Host "`n🌐 Deploying frontend to server..." -ForegroundColor Yellow
Write-Host "⚠️ You need to enter password manually for scp..." -ForegroundColor Yellow
scp -r dist/* ${SERVER}:/var/www/html/

# Step 3: Update HiDrive environment variables on server
Write-Host "`n⚙️ Updating HiDrive config on server..." -ForegroundColor Yellow
$envConfig = @"
HIDRIVE_HOST=sftp.hidrive.ionos.com
HIDRIVE_PORT=22
HIDRIVE_USER=$HIDRIVE_USER
HIDRIVE_PASSWORD=$HIDRIVE_PASSWORD
HIDRIVE_PUBLIC_URL=https://webdav.hidrive.ionos.com/users/$HIDRIVE_USER/mychurch
HIDRIVE_BASE_PATH=/users/$HIDRIVE_USER/mychurch
"@

Write-Host $envConfig

Invoke-SSHCommand "cd /root/Mychurch/backend && grep -v HIDRIVE .env > .env.tmp && mv .env.tmp .env"
Invoke-SSHCommand "cd /root/Mychurch/backend && cat >> .env << 'ENVEOF'

# IONOS HiDrive Storage Configuration
$envConfig
ENVEOF"

# Step 4: Restart backend
Write-Host "`n🔄 Restarting backend..." -ForegroundColor Yellow
Invoke-SSHCommand "pm2 restart mychurch-backend --update-env"

# Step 5: Check status
Write-Host "`n✅ Deployment completed!" -ForegroundColor Green
Write-Host "`nChecking services status..." -ForegroundColor Cyan
Invoke-SSHCommand "pm2 list"

Write-Host "`n🎉 All done! Visit https://samanabyar.online" -ForegroundColor Green
