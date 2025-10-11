# Mychurch Remote Deployment Script (Windows)

Write-Host "`n=== Mychurch Deployment ===" -ForegroundColor Cyan

$commands = @"
cd /root/Mychurch
git pull origin main
npm install
cd backend
npm install
cd ..
npm run build
rm -rf /var/www/mychurch/*
cp -r dist/* /var/www/mychurch/
pm2 restart mychurch-backend
pm2 save
pm2 status
"@

Write-Host "`nServer: ssh.samanabyar.online" -ForegroundColor Yellow
Write-Host "User: root" -ForegroundColor Yellow
Write-Host "Password: jIVeuzsrkoWPkhUY" -ForegroundColor Green

Write-Host "`n=== Deployment Commands ===" -ForegroundColor Cyan
Write-Host $commands -ForegroundColor White

Write-Host "`n=== Instructions ===" -ForegroundColor Cyan
Write-Host "1. Use PuTTY or Windows Terminal to connect:" -ForegroundColor Yellow
Write-Host "   ssh root@ssh.samanabyar.online" -ForegroundColor White
Write-Host "`n2. Copy and paste the commands above" -ForegroundColor Yellow
Write-Host "`n3. After deployment, visit:" -ForegroundColor Yellow
Write-Host "   http://samanabyar.online/bible" -ForegroundColor Green

Write-Host "`n=== Copying commands to clipboard ===" -ForegroundColor Cyan
Set-Clipboard -Value $commands
Write-Host "Commands copied! Ready to paste in SSH terminal." -ForegroundColor Green

Write-Host "`n==========================" -ForegroundColor Cyan
