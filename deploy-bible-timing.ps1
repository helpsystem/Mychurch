#!/usr/bin/env pwsh
# Deploy Bible Timing files to server

Write-Host "📦 Deploying Bible Timing System..." -ForegroundColor Cyan

# Create temp directory
$tempDir = "temp-bible-timing-deploy"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files
Write-Host "📁 Copying files..." -ForegroundColor Yellow
Copy-Item "scripts/generate-all-bible-timing.cjs" "$tempDir/"
Copy-Item "scripts/generate-bible-timing.cjs" "$tempDir/"
Copy-Item "backend/routes/bibleTimingRoutes.js" "$tempDir/"

# Create archive
Write-Host "📦 Creating archive..." -ForegroundColor Yellow
Compress-Archive -Path "$tempDir/*" -DestinationPath "bible-timing-deploy.zip" -Force

# Cleanup
Remove-Item -Recurse -Force $tempDir

Write-Host "✅ Archive created: bible-timing-deploy.zip" -ForegroundColor Green
Write-Host ""
Write-Host "📤 Next steps:" -ForegroundColor Cyan
Write-Host "1. Upload bible-timing-deploy.zip to server"
Write-Host "2. SSH to server: ssh root@samanabyar.online"
Write-Host "3. cd /root/Mychurch"
Write-Host "4. unzip -o bible-timing-deploy.zip"
Write-Host "5. mv generate-all-bible-timing.cjs scripts/"
Write-Host "6. mv generate-bible-timing.cjs scripts/"
Write-Host "7. mv bibleTimingRoutes.js backend/routes/"
Write-Host "8. node scripts/generate-all-bible-timing.cjs"
