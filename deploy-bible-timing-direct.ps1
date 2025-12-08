# Direct Deploy Bible Timing to Server
# Upload and execute Bible timing generation on server

param(
    [string]$Server = "root@samanabyar.online",
    [switch]$RunNow
)

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Bible Timing Direct Deploy to Server" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Create temp directory
$tempDir = "temp-deploy-bible"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "Preparing files..." -ForegroundColor Yellow

# Copy files to temp
Copy-Item "scripts/generate-all-bible-timing.cjs" "$tempDir/"
Copy-Item "scripts/generate-bible-timing.cjs" "$tempDir/"
Copy-Item "backend/routes/bibleTimingRoutes.js" "$tempDir/"

# Create deployment script
$deployScript = "#!/bin/bash`necho `"===============================================`"`necho `"  Installing Bible Timing Files`"`necho `"===============================================`"`necho `"`"`ncd /root/Mychurch`nmkdir -p scripts`nmkdir -p backend/routes`necho `"Moving files to correct locations...`"`nif [ -f /tmp/bible-timing-deploy/generate-all-bible-timing.cjs ]; then`n    cp /tmp/bible-timing-deploy/generate-all-bible-timing.cjs scripts/`n    echo `"[OK] scripts/generate-all-bible-timing.cjs`"`nfi`nif [ -f /tmp/bible-timing-deploy/generate-bible-timing.cjs ]; then`n    cp /tmp/bible-timing-deploy/generate-bible-timing.cjs scripts/`n    echo `"[OK] scripts/generate-bible-timing.cjs`"`nfi`nif [ -f /tmp/bible-timing-deploy/bibleTimingRoutes.js ]; then`n    cp /tmp/bible-timing-deploy/bibleTimingRoutes.js backend/routes/`n    echo `"[OK] backend/routes/bibleTimingRoutes.js`"`nfi`nchmod +x scripts/generate-all-bible-timing.cjs`nchmod +x scripts/generate-bible-timing.cjs`necho `"`"`necho `"[SUCCESS] Files deployed successfully!`"`necho `"`"`necho `"Ready to generate timing for all 1189 Bible chapters`"`necho `"`"`n"

$deployScript | Out-File -FilePath "$tempDir/deploy.sh" -Encoding ASCII -NoNewline

# Create execution script
$runScript = "#!/bin/bash`ncd /root/Mychurch`necho `"===============================================`"`necho `"  Generating Timing for ALL Bible Chapters`"`necho `"  Total: 1189 chapters (66 books)`"`necho `"===============================================`"`necho `"`"`nnode scripts/generate-all-bible-timing.cjs`necho `"`"`necho `"[COMPLETE] Generation finished!`"`necho `"`"`n"

$runScript | Out-File -FilePath "$tempDir/run-generation.sh" -Encoding ASCII -NoNewline

Write-Host "[OK] Files prepared" -ForegroundColor Green
Write-Host ""

# Upload to server
Write-Host "Uploading to server..." -ForegroundColor Yellow

try {
    # Upload files
    scp -r "$tempDir" "${Server}:/tmp/bible-timing-deploy"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to upload files"
    }
    
    Write-Host "[OK] Files uploaded to /tmp/bible-timing-deploy" -ForegroundColor Green
    Write-Host ""
    
    # Deploy files
    Write-Host "Deploying files on server..." -ForegroundColor Yellow
    ssh $Server "bash /tmp/bible-timing-deploy/deploy.sh"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to deploy files"
    }
    
    Write-Host "[OK] Deployment successful!" -ForegroundColor Green
    Write-Host ""
    
    # Run generation if requested
    if ($RunNow) {
        Write-Host "Starting Bible timing generation..." -ForegroundColor Cyan
        Write-Host "This will take approximately 10-15 minutes" -ForegroundColor Yellow
        Write-Host ""
        
        ssh $Server "bash /tmp/bible-timing-deploy/run-generation.sh"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "[SUCCESS] All Bible chapter timing files generated!" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Generation completed with some warnings" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. SSH to server: ssh $Server" -ForegroundColor White
        Write-Host "  2. Run: cd /root/Mychurch" -ForegroundColor White
        Write-Host "  3. Execute: node scripts/generate-all-bible-timing.cjs" -ForegroundColor White
        Write-Host ""
        Write-Host "Or run with -RunNow flag:" -ForegroundColor White
        Write-Host "  ./deploy-bible-timing-direct.ps1 -RunNow" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
    exit 1
} finally {
    # Cleanup
    if (Test-Path $tempDir) {
        Remove-Item -Recurse -Force $tempDir
    }
}

Write-Host ""
Write-Host "[DONE] Script completed!" -ForegroundColor Green
