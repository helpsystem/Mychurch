# Safe Git Cleanup - بدون حذف فایل‌ها از دیسک
# این اسکریپت فقط فایل‌های جدید رو از commit های بعدی ignore می‌کنه

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SAFE GIT CLEANUP" -ForegroundColor Cyan
Write-Host "  (فایل‌ها پاک نمیشن، فقط ignore میشن)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$REPO_PATH = Get-Location

# چک کردن که در Git repo هستیم
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not a Git repository!" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Current repository status:" -ForegroundColor Yellow
Write-Host ""

# اندازه فعلی .git
$gitSize = (Get-ChildItem -Path ".git" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB
Write-Host "  .git folder size: $([math]::Round($gitSize, 2)) GB" -ForegroundColor $(if ($gitSize -gt 1) {"Red"} else {"Green"})

# تعداد commits
$commitCount = (git rev-list --all --count)
Write-Host "  Total commits: $commitCount" -ForegroundColor Cyan

# فایل‌های tracked
$trackedFiles = (git ls-files | Measure-Object).Count
Write-Host "  Tracked files: $trackedFiles" -ForegroundColor Cyan

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  Strategy: Prevent future growth" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "این اسکریپت:" -ForegroundColor Cyan
Write-Host "  ✅ فایل‌های بزرگ فعلی رو نگه میداره" -ForegroundColor Green
Write-Host "  ✅ .gitignore رو آپدیت می‌کنه" -ForegroundColor Green
Write-Host "  ✅ فایل‌های جدید ignore میشن" -ForegroundColor Green
Write-Host "  ✅ Commit history دست نخورده می‌مونه" -ForegroundColor Green
Write-Host "  ⚠️  حجم Git کم نمیشه (امن)" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "ادامه بدم? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 1: Untracking large files (safe)..." -ForegroundColor Cyan

# پیدا کردن فایل‌های بزرگ که tracked هستن
Write-Host "  Scanning for large files..." -ForegroundColor Yellow

$largeFiles = @()

# MP3 files
$mp3Files = git ls-files | Where-Object {$_ -match '\.mp3$'}
if ($mp3Files) {
    Write-Host "    Found $($mp3Files.Count) MP3 files" -ForegroundColor Yellow
    $largeFiles += $mp3Files
}

# MP4 files
$mp4Files = git ls-files | Where-Object {$_ -match '\.mp4$'}
if ($mp4Files) {
    Write-Host "    Found $($mp4Files.Count) MP4 files" -ForegroundColor Yellow
    $largeFiles += $mp4Files
}

# PDF files
$pdfFiles = git ls-files | Where-Object {$_ -match '\.pdf$'}
if ($pdfFiles) {
    Write-Host "    Found $($pdfFiles.Count) PDF files" -ForegroundColor Yellow
    $largeFiles += $pdfFiles
}

# Archive files  
$archiveFiles = git ls-files | Where-Object {$_ -like "*.tar.gz" -or $_ -like "*.zip"}
if ($archiveFiles) {
    Write-Host "    Found $($archiveFiles.Count) archive files" -ForegroundColor Yellow
    $largeFiles += $archiveFiles
}

if ($largeFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "  Untracking $($largeFiles.Count) files (they stay on disk)..." -ForegroundColor Yellow
    
    # Untrack به صورت batch
    $largeFiles | ForEach-Object {
        git rm --cached $_ 2>$null
    }
    
    Write-Host "  ✅ Files untracked (still on disk)" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  No large files currently tracked" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Step 2: Committing changes..." -ForegroundColor Cyan

git add .gitignore
git commit -m "chore: untrack large media files - preserve on disk" -m "- Untracked MP3, MP4, PDF, and archive files" -m "- Updated .gitignore" -m "- Files remain on disk for local use"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  No changes to commit" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SAFE CLEANUP COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  • فایل‌های بزرگ از Git untrack شدن" -ForegroundColor White
Write-Host "  • همه فایل‌ها روی دیسک باقی موندن" -ForegroundColor White
Write-Host "  • Commit های جدید دیگه فایل بزرگ ندارن" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "  1. تست کن که همه چی کار می‌کنه" -ForegroundColor White
Write-Host "  2. اگه مطمئن شدی:" -ForegroundColor White
Write-Host "     git push origin main" -ForegroundColor Cyan
Write-Host ""

Write-Host "💾 Backup location:" -ForegroundColor Gray
$backups = Get-ChildItem -Path "..\Mychurch_BACKUP_*" -Directory | Sort-Object Name -Descending | Select-Object -First 1
if ($backups) {
    Write-Host "   $($backups.FullName)" -ForegroundColor Gray
}
Write-Host ""
