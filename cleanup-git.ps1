# Git Cleanup - حذف فایل‌های بزرگ از تاریخچه Git
# این اسکریپت حجم Repository رو از 4GB به زیر 50MB کاهش میده

param([switch]$DryRun, [switch]$Force)

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "  GIT REPOSITORY CLEANUP" -ForegroundColor Red  
Write-Host "  Remove large files from history" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

$REPO_PATH = Get-Location

# چک کردن BFG
$BFG_JAR = "D:\Tools\bfg.jar"  # مسیر BFG را تنظیم کنید

if (-not (Test-Path $BFG_JAR)) {
    Write-Host "❌ BFG Repo Cleaner not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Download from: https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor Yellow
    Write-Host "Or install with: choco install bfg-repo-cleaner" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Then update BFG_JAR path in this script" -ForegroundColor Yellow
    exit 1
}

# اخطار
if (-not $Force) {
    Write-Host "⚠️  WARNING: This will permanently delete files from Git history!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Files to be removed:" -ForegroundColor Cyan
    Write-Host "  - All *.tar.gz files" -ForegroundColor White
    Write-Host "  - All *.mp3 files" -ForegroundColor White
    Write-Host "  - All *.mp4 files" -ForegroundColor White
    Write-Host "  - All *.pdf files larger than 1MB" -ForegroundColor White
    Write-Host "  - cache/ folder" -ForegroundColor White
    Write-Host "  - All files larger than 10MB" -ForegroundColor White
    Write-Host ""
    Write-Host "Current repo size: ~4 GB" -ForegroundColor Red
    Write-Host "After cleanup: ~50 MB" -ForegroundColor Green
    Write-Host ""
    
    $confirm = Read-Host "Type 'YES' to continue"
    if ($confirm -ne "YES") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# مرحله 1: بکاپ
Write-Host ""
Write-Host "Step 1: Creating backup..." -ForegroundColor Cyan

$backupPath = "$REPO_PATH.BACKUP_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

if ($DryRun) {
    Write-Host "  [DRY RUN] Would backup to: $backupPath" -ForegroundColor Gray
} else {
    Write-Host "  Backing up to: $backupPath" -ForegroundColor Yellow
    Copy-Item -Path $REPO_PATH -Destination $backupPath -Recurse
    Write-Host "  ✅ Backup complete" -ForegroundColor Green
}

Write-Host ""

# مرحله 2: لیست فایل‌های بزرگ
Write-Host "Step 2: Analyzing large files..." -ForegroundColor Cyan

if (-not $DryRun) {
    Write-Host "  Finding large blobs in Git history..." -ForegroundColor Yellow
    
    git rev-list --objects --all | `
        git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | `
        Where-Object {$_ -match '^blob'} | `
        Sort-Object {[int]($_ -split '\s+')[2]} -Descending | `
        Select-Object -First 10 | `
        ForEach-Object {
            $size = [int]($_ -split '\s+')[2]
            $sizeMB = [math]::Round($size / 1MB, 2)
            $file = ($_ -split '\s+', 4)[3]
            Write-Host "    $sizeMB MB - $file" -ForegroundColor Yellow
        }
}

Write-Host ""

# مرحله 3: حذف فایل‌های بزرگ با BFG
Write-Host "Step 3: Removing large files..." -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "  [DRY RUN] Would run BFG Repo Cleaner" -ForegroundColor Gray
} else {
    Write-Host "  Running BFG - removing blobs bigger than 10MB..." -ForegroundColor Yellow
    java -jar $BFG_JAR --strip-blobs-bigger-than 10M $REPO_PATH
    
    Write-Host "  Running BFG - removing specific patterns..." -ForegroundColor Yellow
    java -jar $BFG_JAR --delete-files "*.{mp3,mp4,tar.gz}" $REPO_PATH
    java -jar $BFG_JAR --delete-folders "{cache,dist,build,node_modules}" $REPO_PATH
    
    Write-Host "  ✅ BFG cleanup complete" -ForegroundColor Green
}

Write-Host ""

# مرحله 4: Git cleanup
Write-Host "Step 4: Git garbage collection..." -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "  [DRY RUN] Would run git reflog and gc" -ForegroundColor Gray
} else {
    Write-Host "  Expiring reflog..." -ForegroundColor Yellow
    git reflog expire --expire=now --all
    
    Write-Host "  Running aggressive garbage collection..." -ForegroundColor Yellow
    git gc --prune=now --aggressive
    
    Write-Host "  ✅ Git cleanup complete" -ForegroundColor Green
}

Write-Host ""

# مرحله 5: بررسی نتیجه
Write-Host "Step 5: Verification..." -ForegroundColor Cyan

if (-not $DryRun) {
    $gitSize = (Get-ChildItem -Path ".git" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    $gitSizeGB = [math]::Round($gitSize / 1024, 2)
    
    Write-Host "  New .git folder size: $([math]::Round($gitSize, 2)) MB" -ForegroundColor Cyan
    
    if ($gitSize -lt 100) {
        Write-Host "  ✅ Repository size OK (< 100 MB)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Repository still large (> 100 MB)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CLEANUP COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if (-not $DryRun) {
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test your repository locally" -ForegroundColor White
    Write-Host "  2. Make sure everything works" -ForegroundColor White
    Write-Host "  3. Force push to GitHub:" -ForegroundColor White
    Write-Host ""
    Write-Host "     git push --force --all" -ForegroundColor Cyan
    Write-Host "     git push --force --tags" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  WARNING: This will rewrite history on GitHub!" -ForegroundColor Red
    Write-Host "   Make sure team members are aware!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Backup location: $backupPath" -ForegroundColor Gray
} else {
    Write-Host "This was a dry run. Use without -DryRun to execute." -ForegroundColor Yellow
}

Write-Host ""
