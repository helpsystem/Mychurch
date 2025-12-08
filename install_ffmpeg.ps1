# Automatic ffmpeg Installer for Windows
# This script downloads and installs ffmpeg automatically

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FFMPEG AUTO-INSTALLER" -ForegroundColor Cyan
# Automatic ffmpeg Installer for Windows
# This script downloads and installs ffmpeg automatically

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FFMPEG AUTO-INSTALLER" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if ffmpeg is already installed
try {
    $existing = ffmpeg -version 2>$null
    if ($existing) {
        Write-Host "[OK] ffmpeg is already installed!" -ForegroundColor Green
        Write-Host "`nVersion info:"
        ffmpeg -version | Select-Object -First 1
        exit 0
    }
}
catch {
    Write-Host "ffmpeg not found. Installing...`n" -ForegroundColor Yellow
}

# Create temp directory
$tempDir = "$env:TEMP\ffmpeg-install"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "[>>] Downloading ffmpeg..." -ForegroundColor Yellow

# Download ffmpeg
$ffmpegUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$zipPath = "$tempDir\ffmpeg.zip"

try {
    Invoke-WebRequest -Uri $ffmpegUrl -OutFile $zipPath -UseBasicParsing
    Write-Host "[OK] Download complete!`n" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Download failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "[>>] Extracting..." -ForegroundColor Yellow

# Extract
try {
    Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force
    
    # Find the extracted folder (it has version number in name)
    $extractedFolder = Get-ChildItem -Path $tempDir -Directory | Where-Object { $_.Name -like "ffmpeg-*" } | Select-Object -First 1
    
    if (-not $extractedFolder) {
        throw "Could not find extracted ffmpeg folder"
    }
    
    # Install to C:\ffmpeg
    $installPath = "C:\ffmpeg"
    
    if (Test-Path $installPath) {
        Write-Host "Removing old installation..." -ForegroundColor Yellow
        Remove-Item $installPath -Recurse -Force
    }
    
    # Copy to installation directory
    Copy-Item -Path $extractedFolder.FullName -Destination $installPath -Recurse -Force
    
    Write-Host "[OK] Extracted to $installPath`n" -ForegroundColor Green
    
}
catch {
    Write-Host "[ERROR] Extraction failed: $_" -ForegroundColor Red
    exit 1
}

# Add to PATH
Write-Host "[>>] Adding to PATH..." -ForegroundColor Yellow

$binPath = "$installPath\bin"
$currentPath = [Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User)

if ($currentPath -notlike "*$binPath*") {
    $newPath = "$currentPath;$binPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::User)
    
    # Also add to current session
    $env:Path += ";$binPath"
    
    Write-Host "[OK] Added to PATH!`n" -ForegroundColor Green
}
else {
    Write-Host "[OK] Already in PATH!`n" -ForegroundColor Green
}

# Clean up
Remove-Item $tempDir -Recurse -Force

# Verify installation
Write-Host "[>>] Verifying installation..." -ForegroundColor Yellow
try {
    $version = ffmpeg -version 2>&1 | Select-Object -First 1
    Write-Host "[OK] ffmpeg installed successfully!`n" -ForegroundColor Green
    Write-Host "Version: $version`n" -ForegroundColor Cyan
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "INSTALLATION COMPLETE!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "You can now run: python scripts/generate_whisper_timestamps.py" -ForegroundColor Yellow
    Write-Host "`nNote: You may need to restart your terminal for PATH changes to take effect.`n" -ForegroundColor Gray
    
}
catch {
    Write-Host "[ERROR] Verification failed. Please restart your terminal and try again." -ForegroundColor Red
    exit 1
}
