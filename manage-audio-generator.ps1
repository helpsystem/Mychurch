# Manage Background Audio Generator
# View status, logs, and control the background process

param(
    [Parameter(Position=0)]
    [ValidateSet('status', 'stop', 'log', 'progress', 'stats', 'help')]
    [string]$Action = 'status'
)

function Show-Help {
    Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "    🎵 Background Audio Generator - Management            " -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
    
    Write-Host "Usage: .\manage-audio-generator.ps1 [action]`n" -ForegroundColor Yellow
    
    Write-Host "Actions:" -ForegroundColor Magenta
    Write-Host "   status     - Show generator status and job info" -ForegroundColor White
    Write-Host "   stop       - Stop the background generator" -ForegroundColor White
    Write-Host "   log        - View recent log entries (last 30 lines)" -ForegroundColor White
    Write-Host "   progress   - Show generation progress" -ForegroundColor White
    Write-Host "   stats      - Show detailed statistics" -ForegroundColor White
    Write-Host "   help       - Show this help message`n" -ForegroundColor White
    
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "   .\manage-audio-generator.ps1 status" -ForegroundColor Gray
    Write-Host "   .\manage-audio-generator.ps1 log" -ForegroundColor Gray
    Write-Host "   .\manage-audio-generator.ps1 stop`n" -ForegroundColor Gray
}

function Show-Status {
    Write-Host "`n📊 Generator Status" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
    
    # Check if job ID file exists
    if (Test-Path "bg_audio_job.txt") {
        $jobId = Get-Content "bg_audio_job.txt"
        $job = Get-Job -Id $jobId -ErrorAction SilentlyContinue
        
        if ($job) {
            Write-Host "Job Information:" -ForegroundColor Yellow
            Write-Host "   Job ID: $($job.Id)" -ForegroundColor White
            Write-Host "   State: $($job.State)" -ForegroundColor $(if ($job.State -eq 'Running') { 'Green' } else { 'Red' })
            Write-Host "   Started: $($job.PSBeginTime)" -ForegroundColor White
            
            if ($job.State -eq 'Running') {
                $runtime = (Get-Date) - $job.PSBeginTime
                Write-Host "   Runtime: $($runtime.Hours)h $($runtime.Minutes)m $($runtime.Seconds)s" -ForegroundColor White
            }
            Write-Host ""
        } else {
            Write-Host "   ❌ Job not found (may have completed or been removed)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ℹ️ No background job found" -ForegroundColor Yellow
        Write-Host "   Start generator with: .\start-background-audio-generator.ps1`n" -ForegroundColor White
    }
}

function Show-Log {
    Write-Host "`n📋 Recent Log Entries (Last 30 lines)" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
    
    if (Test-Path "audio_generation_log.txt") {
        Get-Content "audio_generation_log.txt" -Tail 30
    } else {
        Write-Host "   ℹ️ No log file found yet" -ForegroundColor Yellow
    }
    Write-Host ""
}

function Show-Progress {
    Write-Host "`n⏱️ Generation Progress" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
    
    if (Test-Path "audio_generation_progress.json") {
        $progress = Get-Content "audio_generation_progress.json" | ConvertFrom-Json
        
        Write-Host "Current Progress:" -ForegroundColor Yellow
        Write-Host "   Last Book: $($progress.last_book)" -ForegroundColor White
        Write-Host "   Last Chapter: $($progress.last_chapter)" -ForegroundColor White
        Write-Host "   Total Generated: $($progress.total_generated) chapters" -ForegroundColor Green
        Write-Host "   Started At: $($progress.started_at)" -ForegroundColor White
        Write-Host "   Last Updated: $($progress.last_updated)" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "   ℹ️ No progress file found yet" -ForegroundColor Yellow
    }
}

function Show-Stats {
    Write-Host "`n📈 Detailed Statistics" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
    
    # Count audio files
    $audioCount = 0
    if (Test-Path "public/audio/bible/auto-generated") {
        $audioCount = (Get-ChildItem "public/audio/bible/auto-generated" -Filter "*.mp3" -ErrorAction SilentlyContinue).Count
    }
    
    # Count alignment files
    $alignmentCount = 0
    if (Test-Path "public/data/alignments") {
        $alignmentCount = (Get-ChildItem "public/data/alignments" -Filter "*_alignment.json" -ErrorAction SilentlyContinue).Count
    }
    
    # Calculate total size
    $totalSize = 0
    if (Test-Path "public/audio/bible/auto-generated") {
        $totalSize = (Get-ChildItem "public/audio/bible/auto-generated" -Filter "*.mp3" -Recurse -ErrorAction SilentlyContinue | 
                      Measure-Object -Property Length -Sum).Sum / 1MB
    }
    
    Write-Host "Files Generated:" -ForegroundColor Yellow
    Write-Host "   Audio Files: $audioCount" -ForegroundColor Green
    Write-Host "   Alignment Files: $alignmentCount" -ForegroundColor Green
    Write-Host "   Total Size: $([math]::Round($totalSize, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    
    # Show progress if available
    if (Test-Path "audio_generation_progress.json") {
        $progress = Get-Content "audio_generation_progress.json" | ConvertFrom-Json
        
        Write-Host "Progress Details:" -ForegroundColor Yellow
        Write-Host "   Chapters Completed: $($progress.total_generated)" -ForegroundColor Green
        
        if ($progress.started_at) {
            $started = [DateTime]::Parse($progress.started_at)
            $elapsed = (Get-Date) - $started
            Write-Host "   Time Elapsed: $($elapsed.Hours)h $($elapsed.Minutes)m" -ForegroundColor White
            
            if ($progress.total_generated -gt 0) {
                $avgPerChapter = $elapsed.TotalMinutes / $progress.total_generated
                Write-Host "   Avg Time/Chapter: $([math]::Round($avgPerChapter, 2)) minutes" -ForegroundColor White
                
                # Estimate remaining (assuming 1189 total chapters)
                $remaining = 1189 - $progress.total_generated
                $estimatedMinutes = $remaining * $avgPerChapter
                Write-Host "   Estimated Remaining: $([math]::Round($estimatedMinutes / 60, 1)) hours" -ForegroundColor Yellow
            }
        }
        Write-Host ""
    }
}

function Stop-Generator {
    Write-Host "`n⏹️ Stopping Background Generator" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Yellow
    
    if (Test-Path "bg_audio_job.txt") {
        $jobId = Get-Content "bg_audio_job.txt"
        $job = Get-Job -Id $jobId -ErrorAction SilentlyContinue
        
        if ($job) {
            if ($job.State -eq 'Running') {
                Stop-Job -Id $jobId
                Write-Host "   ⏸️ Job stopped" -ForegroundColor Yellow
            }
            
            Remove-Job -Id $jobId -Force
            Write-Host "   ✅ Job removed" -ForegroundColor Green
            
            Remove-Item "bg_audio_job.txt" -ErrorAction SilentlyContinue
            Write-Host "   🗑️ Job ID file deleted" -ForegroundColor Gray
            Write-Host ""
            
            # Show final stats
            Show-Stats
        } else {
            Write-Host "   ℹ️ No running job found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ℹ️ No job ID file found" -ForegroundColor Yellow
    }
}

# Main execution
switch ($Action) {
    'status' { Show-Status }
    'stop' { Stop-Generator }
    'log' { Show-Log }
    'progress' { Show-Progress }
    'stats' { Show-Stats }
    'help' { Show-Help }
    default { Show-Help }
}
