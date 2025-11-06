# SCP Upload Script
param([string]$Folder = "church-photos")

$Server = "195.250.25.185"
$User = "root"
$RemotePath = "/root/Mychurch/public"
$LocalPath = "public"

Write-Host "`nSCP Upload - Testing..." -ForegroundColor Cyan

# Check if folder exists
$localFolder = Join-Path $LocalPath $Folder
if (-not (Test-Path $localFolder)) {
    Write-Host "Error: Folder not found: $localFolder" -ForegroundColor Red
    exit 1
}

# Count files
$files = Get-ChildItem -Path $localFolder -Recurse -File
$count = $files.Count
$size = ($files | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($size / 1MB, 2)

Write-Host "Folder: $Folder" -ForegroundColor White
Write-Host "Files: $count" -ForegroundColor White
Write-Host "Size: $sizeMB MB`n" -ForegroundColor White

Write-Host "Starting upload..." -ForegroundColor Yellow
Write-Host "Password: jIVeuzsrkoWPkhUY`n" -ForegroundColor Gray

# SCP command
$remoteFolder = "$User@$($Server):$RemotePath/"
scp -r -C -p $localFolder $remoteFolder

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccess!" -ForegroundColor Green
} else {
    Write-Host "`nFailed! Exit code: $LASTEXITCODE" -ForegroundColor Red
}
