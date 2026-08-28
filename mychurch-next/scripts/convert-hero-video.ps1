# Convert hero.mp4 to high-efficiency hero.webm with VP9 codec
# This reduces video file size by ~50-70% while preserving crisp 1080p visual quality.

$source = Join-Path $PSScriptRoot "..\public\hero.mp4"
$destination = Join-Path $PSScriptRoot "..\public\hero.webm"

if (-not (Test-Path $source)) {
    Write-Host "Source video not found at: $source" -ForegroundColor Red
    exit 1
}

Write-Host "Converting $source to WebM (VP9)..." -ForegroundColor Cyan

# Check if ffmpeg is available
$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
    Write-Host "FFmpeg is not installed or not in PATH." -ForegroundColor Yellow
    Write-Host "You can install it using: winget install Gyan.FFmpeg" -ForegroundColor Yellow
    exit 1
}

& ffmpeg -i $source -c:v libvpx-vp9 -b:v 0 -crf 33 -an -row-mt 1 -threads 4 $destination

if (Test-Path $destination) {
    $mp4Size = (Get-Item $source).Length / 1MB
    $webmSize = (Get-Item $destination).Length / 1MB
    Write-Host "Conversion completed successfully!" -ForegroundColor Green
    Write-Host "Original MP4: $([math]::Round($mp4Size, 2)) MB" -ForegroundColor Gray
    Write-Host "Optimized WebM: $([math]::Round($webmSize, 2)) MB" -ForegroundColor Green
}
