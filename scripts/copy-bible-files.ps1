# Script to copy Bible files from external directory to workspace
# Run this in PowerShell

$sourceDir = "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.bible.com"
$targetDir = "d:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\data\bible-source"

Write-Host "Bible Files Copy Script" -ForegroundColor Cyan
Write-Host "=" -NoNewline; 1..50 | ForEach-Object { Write-Host "=" -NoNewline }; Write-Host ""

# Check if source exists
if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ Source directory not found: $sourceDir" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please update the `$sourceDir variable with the correct path" -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Source: $sourceDir" -ForegroundColor Green
Write-Host "📁 Target: $targetDir" -ForegroundColor Green

# Create target directory
if (-not (Test-Path $targetDir)) {
    Write-Host "`n📂 Creating target directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Host "✅ Directory created" -ForegroundColor Green
}

# Copy files
Write-Host "`n📋 Copying files..." -ForegroundColor Yellow

try {
    # Copy all supported file types
    $fileTypes = @("*.html", "*.htm", "*.json", "*.xml", "*.txt")
    $copiedFiles = 0
    
    foreach ($fileType in $fileTypes) {
        $files = Get-ChildItem -Path $sourceDir -Filter $fileType -Recurse -File
        
        foreach ($file in $files) {
            $relativePath = $file.FullName.Substring($sourceDir.Length).TrimStart('\')
            $targetFile = Join-Path $targetDir $relativePath
            $targetFolder = Split-Path $targetFile -Parent
            
            # Create subdirectory if needed
            if (-not (Test-Path $targetFolder)) {
                New-Item -ItemType Directory -Path $targetFolder -Force | Out-Null
            }
            
            # Copy file
            Copy-Item -Path $file.FullName -Destination $targetFile -Force
            $copiedFiles++
            
            Write-Host "  ✓ $relativePath" -ForegroundColor Gray
        }
    }
    
    Write-Host "`n✅ Successfully copied $copiedFiles files" -ForegroundColor Green
    
    # List what was copied
    Write-Host "`n📊 File Summary:" -ForegroundColor Cyan
    foreach ($fileType in $fileTypes) {
        $count = (Get-ChildItem -Path $targetDir -Filter $fileType -Recurse -File).Count
        if ($count -gt 0) {
            Write-Host "  • ${fileType}: $count files" -ForegroundColor White
        }
    }
    
    Write-Host "`n✨ Ready to import!" -ForegroundColor Green
    Write-Host "Run: node scripts/bible-import-from-directory.js --source `"$targetDir`"" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n❌ Error copying files: $_" -ForegroundColor Red
    exit 1
}
