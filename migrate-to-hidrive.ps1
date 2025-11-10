# ====================================
# IONOS HiDrive Storage Migration Script
# Migrates heavy files (audio, images, videos) to HiDrive
# ====================================

param(
    [string]$Mode = "dry-run",  # Options: dry-run, upload, update-db
    [string]$HiDriveUser = "adminchurch",
    [string]$HiDriveHost = "sftp.hidrive.ionos.com",
    [string]$HiDriveBasePath = "/users/adminchurch/mychurch",
    [string]$HiDrivePublicUrl = "https://webdav.hidrive.ionos.com/users/adminchurch/mychurch"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   IONOS HiDrive Migration Script" -ForegroundColor Cyan
Write-Host "   Mode: $Mode" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Define file categories to migrate
$FilesToMigrate = @{
    "worship-audio" = @{
        LocalPath = "public/worship/data/audio"
        RemotePath = "$HiDriveBasePath/worship/audio"
        Extensions = @("*.mp3", "*.m4a", "*.wav", "*.ogg")
        TableUpdate = @{
            Table = "worship_songs"
            Column = "audiourl"
            PathPrefix = "/worship/data/audio/"
            NewPrefix = "$HiDrivePublicUrl/worship/audio/"
        }
    }
    "worship-videos" = @{
        LocalPath = "public/worship/videos"
        RemotePath = "$HiDriveBasePath/worship/videos"
        Extensions = @("*.mp4", "*.webm", "*.mov")
        TableUpdate = @{
            Table = "worship_songs"
            Column = "videourl"
            PathPrefix = "/worship/videos/"
            NewPrefix = "$HiDrivePublicUrl/worship/videos/"
        }
    }
    "sermon-audio" = @{
        LocalPath = "public/audio"
        RemotePath = "$HiDriveBasePath/sermons/audio"
        Extensions = @("*.mp3", "*.m4a", "*.wav")
        TableUpdate = @{
            Table = "sermons"
            Column = "audiourl"
            PathPrefix = "/audio/"
            NewPrefix = "$HiDrivePublicUrl/sermons/audio/"
        }
    }
    "event-images" = @{
        LocalPath = "public/images"
        RemotePath = "$HiDriveBasePath/events/images"
        Extensions = @("*.jpg", "*.jpeg", "*.png", "*.webp", "*.gif")
        TableUpdate = @{
            Table = "events"
            Column = "imageurl"
            PathPrefix = "/images/"
            NewPrefix = "$HiDrivePublicUrl/events/images/"
        }
    }
    "church-photos" = @{
        LocalPath = "public/church-photos"
        RemotePath = "$HiDriveBasePath/church/photos"
        Extensions = @("*.jpg", "*.jpeg", "*.png", "*.webp")
        TableUpdate = $null  # Static files, no DB update needed
    }
    "generated-images" = @{
        LocalPath = "public/generated-images"
        RemotePath = "$HiDriveBasePath/ai/generated"
        Extensions = @("*.jpg", "*.jpeg", "*.png", "*.webp")
        TableUpdate = $null  # AI generated, paths handled dynamically
    }
    "bible-audio" = @{
        LocalPath = "public/bible-timings"
        RemotePath = "$HiDriveBasePath/bible/audio"
        Extensions = @("*.mp3", "*.m4a", "*.wav")
        TableUpdate = @{
            Table = "bible_audio_timings"
            Column = "audiourl"
            PathPrefix = "/bible-timings/"
            NewPrefix = "$HiDrivePublicUrl/bible/audio/"
        }
    }
    "documents" = @{
        LocalPath = "public/documents"
        RemotePath = "$HiDriveBasePath/documents"
        Extensions = @("*.pdf", "*.docx", "*.pptx", "*.xlsx")
        TableUpdate = $null  # Document downloads, paths in metadata
    }
}

# Function to get file size
function Get-FolderSize {
    param([string]$Path)
    if (Test-Path $Path) {
        $size = (Get-ChildItem $Path -Recurse -File | Measure-Object -Property Length -Sum).Sum
        return [math]::Round($size / 1MB, 2)
    }
    return 0
}

# Function to create rsync batch file
function Create-RsyncBatch {
    param(
        [hashtable]$Category,
        [string]$Name
    )
    
    $localPath = $Category.LocalPath
    $remotePath = $Category.RemotePath
    
    if (-not (Test-Path $localPath)) {
        Write-Host "  ⚠ Local path not found: $localPath" -ForegroundColor Yellow
        return $null
    }
    
    $fileCount = (Get-ChildItem $localPath -Recurse -File).Count
    $sizeMB = Get-FolderSize -Path $localPath
    
    Write-Host "  📁 $Name" -ForegroundColor White
    Write-Host "     Local: $localPath" -ForegroundColor Gray
    Write-Host "     Remote: $remotePath" -ForegroundColor Gray
    Write-Host "     Files: $fileCount | Size: ${sizeMB} MB" -ForegroundColor Green
    
    # Create rsync command
    $rsyncCmd = "rsync -avz --progress -e ssh `"$localPath/`" `"${HiDriveUser}@rsync.hidrive.ionos.com:$remotePath/`""
    
    return @{
        Name = $Name
        Command = $rsyncCmd
        FileCount = $fileCount
        SizeMB = $sizeMB
        LocalPath = $localPath
        RemotePath = $remotePath
    }
}

# Dry Run Mode: Analyze files and show migration plan
if ($Mode -eq "dry-run") {
    Write-Host "📊 ANALYSIS MODE - Scanning files..." -ForegroundColor Cyan
    Write-Host ""
    
    $totalFiles = 0
    $totalSizeMB = 0
    $migrationPlan = @()
    
    foreach ($key in $FilesToMigrate.Keys) {
        $category = $FilesToMigrate[$key]
        $batchInfo = Create-RsyncBatch -Category $category -Name $key
        
        if ($batchInfo) {
            $totalFiles += $batchInfo.FileCount
            $totalSizeMB += $batchInfo.SizeMB
            $migrationPlan += $batchInfo
        }
        Write-Host ""
    }
    
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "📦 MIGRATION SUMMARY" -ForegroundColor White
    Write-Host "   Total Files: $totalFiles" -ForegroundColor Green
    Write-Host "   Total Size: ${totalSizeMB} MB (~$([math]::Round($totalSizeMB/1024, 2)) GB)" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Save migration plan to JSON
    $migrationPlan | ConvertTo-Json -Depth 5 | Out-File "migration-plan.json" -Encoding UTF8
    Write-Host "✅ Migration plan saved to: migration-plan.json" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Review migration-plan.json" -ForegroundColor White
    Write-Host "   2. Run: .\migrate-to-hidrive.ps1 -Mode upload" -ForegroundColor White
    Write-Host "   3. After upload: .\migrate-to-hidrive.ps1 -Mode update-db" -ForegroundColor White
    Write-Host ""
}

# Upload Mode: Execute rsync to upload files
elseif ($Mode -eq "upload") {
    Write-Host "📤 UPLOAD MODE - Starting file transfer..." -ForegroundColor Cyan
    Write-Host ""
    
    # Read migration plan
    if (-not (Test-Path "migration-plan.json")) {
        Write-Host "❌ Error: migration-plan.json not found. Run dry-run first." -ForegroundColor Red
        exit 1
    }
    
    $migrationPlan = Get-Content "migration-plan.json" | ConvertFrom-Json
    
    Write-Host "⚠ IMPORTANT: This will upload ~$($migrationPlan.SizeMB) MB to HiDrive" -ForegroundColor Yellow
    Write-Host "   Make sure you have sufficient storage space." -ForegroundColor Yellow
    Write-Host ""
    
    $confirm = Read-Host "Continue? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "❌ Upload cancelled." -ForegroundColor Red
        exit 0
    }
    
    Write-Host ""
    Write-Host "🔄 Creating remote directories..." -ForegroundColor Cyan
    
    # Create all remote directories via SFTP
    $sftpBatch = @()
    foreach ($item in $migrationPlan) {
        $remoteDir = $item.RemotePath -replace '\\', '/'
        $sftpBatch += "mkdir -p $remoteDir"
    }
    
    $sftpBatch += "exit"
    $sftpBatchFile = "sftp-mkdir.txt"
    $sftpBatch -join "`n" | Out-File $sftpBatchFile -Encoding ASCII
    
    Write-Host "   Executing SFTP batch commands..." -ForegroundColor Gray
    & sftp -b $sftpBatchFile "${HiDriveUser}@${HiDriveHost}"
    Remove-Item $sftpBatchFile
    
    Write-Host "✅ Remote directories created" -ForegroundColor Green
    Write-Host ""
    
    # Execute rsync for each category
    $uploadLog = @()
    foreach ($item in $migrationPlan) {
        Write-Host "📤 Uploading: $($item.Name)" -ForegroundColor Cyan
        Write-Host "   Files: $($item.FileCount) | Size: $($item.SizeMB) MB" -ForegroundColor Gray
        Write-Host ""
        
        try {
            # Note: rsync requires Cygwin/WSL on Windows or use WinSCP
            Write-Host "   Command: $($item.Command)" -ForegroundColor Gray
            Write-Host ""
            Write-Host "   ⚠ NOTE: rsync requires WSL or Cygwin on Windows" -ForegroundColor Yellow
            Write-Host "   Alternative: Use WinSCP or FileZilla for SFTP upload" -ForegroundColor Yellow
            Write-Host ""
            
            $uploadLog += @{
                Category = $item.Name
                Status = "Ready"
                Command = $item.Command
            }
        }
        catch {
            Write-Host "   ❌ Error: $_" -ForegroundColor Red
            $uploadLog += @{
                Category = $item.Name
                Status = "Failed"
                Error = $_.Exception.Message
            }
        }
    }
    
    # Save upload log
    $uploadLog | ConvertTo-Json -Depth 5 | Out-File "upload-log.json" -Encoding UTF8
    Write-Host "✅ Upload commands saved to: upload-log.json" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Manual Upload Steps (if rsync unavailable):" -ForegroundColor Yellow
    Write-Host "   1. Use WinSCP or FileZilla" -ForegroundColor White
    Write-Host "   2. Connect: sftp://adminchurch@sftp.hidrive.ionos.com" -ForegroundColor White
    Write-Host "   3. Upload folders as per migration-plan.json" -ForegroundColor White
    Write-Host "   4. After upload: .\migrate-to-hidrive.ps1 -Mode update-db" -ForegroundColor White
    Write-Host ""
}

# Update Database Mode: Update URLs in database
elseif ($Mode -eq "update-db") {
    Write-Host "🗄 DATABASE UPDATE MODE - Updating URLs..." -ForegroundColor Cyan
    Write-Host ""
    
    # Generate SQL update scripts
    $sqlUpdates = @()
    $sqlUpdates += "-- IONOS HiDrive URL Migration SQL Script"
    $sqlUpdates += "-- Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    $sqlUpdates += "-- =========================================="
    $sqlUpdates += ""
    
    foreach ($key in $FilesToMigrate.Keys) {
        $category = $FilesToMigrate[$key]
        
        if ($category.TableUpdate) {
            $table = $category.TableUpdate.Table
            $column = $category.TableUpdate.Column
            $oldPrefix = $category.TableUpdate.PathPrefix
            $newPrefix = $category.TableUpdate.NewPrefix
            
            Write-Host "  📝 Generating SQL for: $table.$column" -ForegroundColor White
            
            $sqlUpdates += "-- Update $table.$column"
            $sqlUpdates += "UPDATE $table"
            $sqlUpdates += "SET $column = REPLACE($column, '$oldPrefix', '$newPrefix')"
            $sqlUpdates += "WHERE $column LIKE '$oldPrefix%';"
            $sqlUpdates += ""
            
            # Add verification query
            $sqlUpdates += "-- Verify $table.$column"
            $sqlUpdates += "SELECT id, $column FROM $table WHERE $column LIKE '${newPrefix}%' LIMIT 5;"
            $sqlUpdates += ""
        }
    }
    
    # Save SQL script
    $sqlFile = "hidrive-url-migration.sql"
    $sqlUpdates -join "`n" | Out-File $sqlFile -Encoding UTF8
    
    Write-Host "✅ SQL script generated: $sqlFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Review the SQL script: $sqlFile" -ForegroundColor White
    Write-Host "   2. Test on staging database first" -ForegroundColor White
    Write-Host "   3. Execute on production:" -ForegroundColor White
    Write-Host "      ssh root@samanabyar.online" -ForegroundColor Gray
    Write-Host "      psql -U myuser -d mychurch -f $sqlFile" -ForegroundColor Gray
    Write-Host ""
}

else {
    Write-Host "Invalid mode: $Mode" -ForegroundColor Red
    Write-Host "   Valid options: dry-run, upload, update-db" -ForegroundColor Yellow
    exit 1
}

Write-Host "Script completed successfully" -ForegroundColor Green
