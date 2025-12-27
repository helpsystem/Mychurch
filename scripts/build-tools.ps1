# Safe Build Scripts for Mychurch

# Build with backup
$ErrorActionPreference = "Stop"

$PROJECT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent

function Write-Header([string]$text) {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host $text -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
}

function Write-Step([string]$text) {
    Write-Host "→ $text" -ForegroundColor Yellow
}

function Write-Success([string]$text) {
    Write-Host "✅ $text" -ForegroundColor Green
}

function Write-Error([string]$text) {
    Write-Host "❌ $text" -ForegroundColor Red
}

# Create backup with timestamp
function New-BuildBackup {
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupDir = "$PROJECT_DIR\backups\build-backup-$timestamp"
    
    Write-Header "Creating Backup"
    Write-Step "Backup location: $backupDir"
    
    try {
        New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
        
        if (Test-Path "$PROJECT_DIR\dist") {
            Write-Step "Copying dist folder..."
            Copy-Item -Path "$PROJECT_DIR\dist" -Destination "$backupDir\dist" -Recurse -Force
        }
        
        if (Test-Path "$PROJECT_DIR\frontend\public") {
            Write-Step "Copying frontend/public..."
            Copy-Item -Path "$PROJECT_DIR\frontend\public" -Destination "$backupDir\frontend-public" -Recurse -Force
        }
        
        Write-Step "Copying config files..."
        Copy-Item -Path "$PROJECT_DIR\vite.config.ts" -Destination "$backupDir\" -Force
        Copy-Item -Path "$PROJECT_DIR\package.json" -Destination "$backupDir\" -Force
        
        # Calculate backup size
        $size = (Get-ChildItem $backupDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        $count = (Get-ChildItem $backupDir -Recurse -File).Count
        
        Write-Success "Backup complete: $([math]::Round($size, 2)) MB, $count files"
        
        return $backupDir
    }
    catch {
        Write-Error "Backup failed: $_"
        throw
    }
}

# Clean only build artifacts (preserve custom files)
function Clear-BuildArtifacts {
    Write-Header "Smart Cleaning Build Artifacts"
    
    $distAssets = "$PROJECT_DIR\dist\assets"
    
    if (Test-Path $distAssets) {
        Write-Step "Cleaning old JS/CSS bundles..."
        
        # Count before
        $beforeCount = (Get-ChildItem $distAssets -File).Count
        
        # Delete all JS and CSS files in assets (these are build artifacts)
        Get-ChildItem $distAssets -Filter "*.js" | Remove-Item -Force
        Get-ChildItem $distAssets -Filter "*.css" | Remove-Item -Force
        
        $afterCount = (Get-ChildItem $distAssets -File -ErrorAction SilentlyContinue).Count
        $removed = $beforeCount - $afterCount
        
        Write-Success "Removed $removed old build files"
    }
    else {
        Write-Step "No assets folder found (first build)"
    }
    
    # Preserve these folders
    Write-Step "Preserved folders: worship/, images/, manifest.json"
}

# Main execution
switch ($args[0]) {
    "backup" {
        New-BuildBackup
    }
    "clean" {
        Clear-BuildArtifacts
    }
    "safe" {
        New-BuildBackup
        Write-Header "Running Build"
        Set-Location $PROJECT_DIR
        npm run build
    }
    default {
        Write-Host "Usage: build-tools.ps1 [backup|clean|safe]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Commands:" -ForegroundColor Cyan
        Write-Host "  backup - Create full backup of dist and configs"
        Write-Host "  clean  - Remove only JS/CSS build artifacts"
        Write-Host "  safe   - Create backup then run build"
    }
}
