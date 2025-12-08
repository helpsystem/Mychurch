# Upload only essential dist files to server
# این اسکریپت فقط فایل‌های ضروری را آپلود می‌کند

$serverHost = "samanabyar.online"
$serverUser = "root"
$remotePath = "/root/Mychurch/dist/assets"

Write-Host "🚀 Starting upload of essential files..." -ForegroundColor Green

# فایل JS اصلی
$jsFile = "dist\assets\index-0qNjDMKb.js"
if (Test-Path $jsFile) {
    Write-Host "📤 Uploading JavaScript file..." -ForegroundColor Yellow
    scp $jsFile "${serverUser}@${serverHost}:${remotePath}/"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ JavaScript uploaded successfully" -ForegroundColor Green
    }
} else {
    Write-Host "❌ JS file not found: $jsFile" -ForegroundColor Red
}

# فایل CSS
$cssFile = "dist\assets\styles\index-gIW5H5BV.css"
if (Test-Path $cssFile) {
    Write-Host "📤 Uploading CSS file..." -ForegroundColor Yellow
    scp $cssFile "${serverUser}@${serverHost}:${remotePath}/styles/"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ CSS uploaded successfully" -ForegroundColor Green
    }
} else {
    Write-Host "❌ CSS file not found: $cssFile" -ForegroundColor Red
}

# فایل HTML
$htmlFile = "dist\index.html"
if (Test-Path $htmlFile) {
    Write-Host "📤 Uploading HTML file..." -ForegroundColor Yellow
    scp $htmlFile "${serverUser}@${serverHost}:/root/Mychurch/dist/"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ HTML uploaded successfully" -ForegroundColor Green
    }
} else {
    Write-Host "❌ HTML file not found: $htmlFile" -ForegroundColor Red
}

Write-Host ""
Write-Host "✨ Upload completed!" -ForegroundColor Green
Write-Host "🔄 Now restart backend with: ssh root@$serverHost 'pm2 restart mychurch-backend'" -ForegroundColor Cyan
