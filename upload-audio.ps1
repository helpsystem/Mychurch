# Upload Bible Audio Files to Production Server
# Size: 1.49 GB (1192 files in 66 books)

Write-Host "`n=== Bible Audio Upload ===" -ForegroundColor Cyan
Write-Host "Total Size: 1.49 GB" -ForegroundColor Yellow
Write-Host "Files: 1192 audio files" -ForegroundColor Yellow
Write-Host "Books: 66 books" -ForegroundColor Yellow

Write-Host "`n  This will take 15-30 minutes!" -ForegroundColor Yellow
$confirm = Read-Host "`nStart upload now? (yes/no)"

if ($confirm -eq "yes") {
    Write-Host "`n Creating audio directory..." -ForegroundColor Cyan
    ssh root@samanabyar.online "mkdir -p /root/Mychurch/backend/bible_data/audio"
    
    Write-Host "`n Uploading audio files..." -ForegroundColor Cyan
    Write-Host "Starting at: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    
    scp -r bible_data/audio/TPV root@samanabyar.online:/root/Mychurch/backend/bible_data/audio/
    
    Write-Host "`n Upload Complete!" -ForegroundColor Green
    Write-Host "Finished at: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    
    Write-Host "`n Verifying..." -ForegroundColor Cyan
    ssh root@samanabyar.online "ls -lah /root/Mychurch/backend/bible_data/audio/TPV/ | head -10"
} else {
    Write-Host "`n Upload cancelled" -ForegroundColor Red
}
