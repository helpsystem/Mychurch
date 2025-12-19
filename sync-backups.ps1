# Sync Backups - دانلود بکاپ‌ها از سرور به سیستم لوکال
# این اسکریپت بکاپ‌های Database و Config را sync می‌کنه

param([switch]$DatabaseOnly, [switch]$ConfigOnly)

$SERVER = "root@samanabyar.online"
$REMOTE_BACKUP_PATH = "/var/www/storage/backups"
$LOCAL_BACKUP_PATH = "D:\Backups\Mychurch"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BACKUP SYNC TO LOCAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ایجاد فولدرهای لوکال
$folders = @(
    "$LOCAL_BACKUP_PATH\Database\daily",
    "$LOCAL_BACKUP_PATH\Database\monthly",
    "$LOCAL_BACKUP_PATH\Configs"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -Path $folder -ItemType Directory -Force | Out-Null
        Write-Host "✅ Created: $folder" -ForegroundColor Green
    }
}

Write-Host ""

# تست SSH
Write-Host "Testing connection..." -ForegroundColor Yellow
try {
    ssh $SERVER "echo 'Connection OK'"
    Write-Host "✅ Connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to server!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Sync Database Backups
if (-not $ConfigOnly) {
    Write-Host "Syncing database backups..." -ForegroundColor Cyan
    
    Write-Host "  Daily backups..." -ForegroundColor Yellow
    scp -r "${SERVER}:${REMOTE_BACKUP_PATH}/database/daily/*" "$LOCAL_BACKUP_PATH\Database\daily\"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Daily backups synced" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Some daily backups failed" -ForegroundColor Yellow
    }
    
    Write-Host "  Monthly backups..." -ForegroundColor Yellow
    scp -r "${SERVER}:${REMOTE_BACKUP_PATH}/database/monthly/*" "$LOCAL_BACKUP_PATH\Database\monthly\"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Monthly backups synced" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Some monthly backups failed" -ForegroundColor Yellow
    }
}

Write-Host ""

# Sync Config Files
if (-not $DatabaseOnly) {
    Write-Host "Syncing config files..." -ForegroundColor Cyan
    
    Write-Host "  .env file..." -ForegroundColor Yellow
    scp "${SERVER}:/root/Mychurch/backend/.env" "$LOCAL_BACKUP_PATH\Configs\.env.backup"
    
    Write-Host "  nginx config..." -ForegroundColor Yellow
    scp "${SERVER}:/etc/nginx/sites-available/mychurch" "$LOCAL_BACKUP_PATH\Configs\nginx.conf"
    
    Write-Host "  ✅ Config files synced" -ForegroundColor Green
}

Write-Host ""

# گزارش
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SYNC COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# آمار فایل‌ها
$dailyCount = (Get-ChildItem -Path "$LOCAL_BACKUP_PATH\Database\daily" -File).Count
$monthlyCount = (Get-ChildItem -Path "$LOCAL_BACKUP_PATH\Database\monthly" -File).Count

Write-Host "📊 Statistics:" -ForegroundColor Cyan
Write-Host "  Daily backups: $dailyCount files" -ForegroundColor White
Write-Host "  Monthly backups: $monthlyCount files" -ForegroundColor White
Write-Host ""
Write-Host "📁 Location: $LOCAL_BACKUP_PATH" -ForegroundColor Cyan
Write-Host ""

# حذف بکاپ‌های خیلی قدیمی (بیشتر از 60 روز)
Write-Host "Cleaning old backups..." -ForegroundColor Yellow
$oldFiles = Get-ChildItem -Path "$LOCAL_BACKUP_PATH\Database\daily" -File | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-60)}
$oldCount = $oldFiles.Count

if ($oldCount -gt 0) {
    $oldFiles | Remove-Item -Force
    Write-Host "  🗑️  Removed $oldCount old backup(s)" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ No old backups to remove" -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 Tip: Schedule this script with Task Scheduler" -ForegroundColor Gray
Write-Host "   Recommended: Every Sunday at 12:00 PM" -ForegroundColor Gray
Write-Host ""
