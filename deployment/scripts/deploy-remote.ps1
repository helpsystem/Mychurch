# 🚀 Mychurch Remote Deployment Script (Windows)
# This script connects to server and deploys the latest code

Write-Host "`n🚀 Mychurch Remote Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$serverHost = "ssh.samanabyar.online"
$serverUser = "root"
$serverPassword = "jIVeuzsrkoWPkhUY"
$projectPath = "/root/Mychurch"

Write-Host "`n📋 Deployment Information:" -ForegroundColor Yellow
Write-Host "Server: $serverHost" -ForegroundColor White
Write-Host "User: $serverUser" -ForegroundColor White
Write-Host "Project: $projectPath" -ForegroundColor White

Write-Host "`n⚠️  Manual Deployment Steps:" -ForegroundColor Yellow
Write-Host "Since SSH from PowerShell requires additional setup," -ForegroundColor White
Write-Host "please follow these steps:" -ForegroundColor White

Write-Host "`n1️⃣  Connect to server using PuTTY or WSL:" -ForegroundColor Cyan
Write-Host "   ssh root@ssh.samanabyar.online" -ForegroundColor White

Write-Host "`n2️⃣  Enter password when prompted:" -ForegroundColor Cyan
Write-Host "   $serverPassword" -ForegroundColor Green

Write-Host "`n3️⃣  Run these commands on server:" -ForegroundColor Cyan

$commands = @(
    "cd /root/Mychurch",
    "git pull origin main",
    "npm install",
    "cd backend; npm install; cd ..",
    "npm run build",
    "rm -rf /var/www/mychurch/*",
    "cp -r dist/* /var/www/mychurch/",
    "pm2 restart mychurch-backend",
    "pm2 save"
)

$commandNumber = 1
foreach ($cmd in $commands) {
    Write-Host "   $commandNumber. " -NoNewline -ForegroundColor Yellow
    Write-Host "$cmd" -ForegroundColor White
    $commandNumber++
}

Write-Host "`n4️⃣  Verify deployment:" -ForegroundColor Cyan
Write-Host "   pm2 status" -ForegroundColor White
Write-Host "   pm2 logs mychurch-backend --lines 20" -ForegroundColor White

Write-Host "`n📝 Or use the automated deployment script:" -ForegroundColor Yellow
Write-Host "   chmod +x deploy.sh" -ForegroundColor White
Write-Host "   ./deploy.sh" -ForegroundColor White

Write-Host "`n🌐 After deployment, visit:" -ForegroundColor Cyan
Write-Host "   http://samanabyar.online" -ForegroundColor Green
Write-Host "   http://samanabyar.online/bible" -ForegroundColor Green

Write-Host "`n🔒 To enable HTTPS:" -ForegroundColor Cyan
Write-Host "   certbot --nginx -d samanabyar.online -d www.samanabyar.online" -ForegroundColor White

Write-Host "`n✨ Press Enter to copy all commands to clipboard..." -ForegroundColor Yellow
Read-Host

# Copy all commands to clipboard
$allCommands = $commands -join "`n"
Set-Clipboard -Value $allCommands
Write-Host "✅ Commands copied to clipboard! Paste in SSH terminal." -ForegroundColor Green

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "🎯 Alternative: Use PuTTY/WSL for SSH" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
