# Check Whisper Progress
# Run this anytime to see current progress

$progressFile = "whisper_progress.json"

if (Test-Path $progressFile) {
    $progress = Get-Content $progressFile | ConvertFrom-Json
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "WHISPER TIMESTAMP GENERATION PROGRESS" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "Progress: $($progress.current)/$($progress.total) ($($progress.percentage)%)" -ForegroundColor White
    Write-Host "Success: $($progress.success)" -ForegroundColor Green
    Write-Host "Failed: $($progress.failed)" -ForegroundColor Red
    Write-Host "Elapsed: $($progress.elapsed_hours) hours" -ForegroundColor Yellow
    Write-Host "Remaining: $($progress.remaining_hours) hours" -ForegroundColor Yellow
    Write-Host "Last Update: $($progress.timestamp)" -ForegroundColor Gray
    
    Write-Host "`n========================================`n" -ForegroundColor Cyan
} else {
    Write-Host "No progress file found. Whisper processing hasn't started yet." -ForegroundColor Red
}
