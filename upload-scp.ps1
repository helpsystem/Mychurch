<#
═══════════════════════════════════════════════════════════════
 📤 SCP Upload Script - Mychurch Static Files
═══════════════════════════════════════════════════════════════

این اسکریپت فایلهای استاتیک را با SCP به سرور منتقل می‌کند

مزایا نسبت به FTP:
 ✅ خیلی سریعتر (10-20 برابر)
 ✅ امن‌تر (رمزنگاری SSH)
 ✅ پشتیبانی از Resume
 ✅ فشرده‌سازی خودکار

نحوه اجرا:
  .\upload-scp.ps1
  .\upload-scp.ps1 -Folder images
  .\upload-scp.ps1 -Folder audio

نیازمندی:
  Windows 10/11 (SCP built-in)
  یا نصب OpenSSH Client
#>

param(
    [string]$Folder = "all",
    [string]$Server = "195.250.25.185",
    [string]$User = "root",
    [string]$RemotePath = "/root/Mychurch/public",
    [string]$LocalPath = "public"
)

$ErrorActionPreference = "Stop"

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   📤 SCP Upload - Mychurch Static Files" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# بررسی وجود SCP
Write-Host "🔍 بررسی SCP..." -ForegroundColor Cyan
$scpPath = Get-Command scp -ErrorAction SilentlyContinue

if (-not $scpPath) {
    Write-Host "`n❌ SCP پیدا نشد!`n" -ForegroundColor Red
    Write-Host "راه حل: نصب OpenSSH Client" -ForegroundColor Yellow
    Write-Host "1. Settings → Apps → Optional Features" -ForegroundColor White
    Write-Host "2. Add a feature → OpenSSH Client`n" -ForegroundColor White
    
    Write-Host "یا از PowerShell (Run as Admin):" -ForegroundColor Yellow
    Write-Host "Add-WindowsCapability -Online -Name OpenSSH.Client*`n" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ SCP موجود است: $($scpPath.Source)`n" -ForegroundColor Green

# تنظیمات
Write-Host "📋 تنظیمات:" -ForegroundColor White
Write-Host "   Server: $Server" -ForegroundColor Gray
Write-Host "   User: $User" -ForegroundColor Gray
Write-Host "   Remote: $RemotePath" -ForegroundColor Gray
Write-Host "   Local: $LocalPath" -ForegroundColor Gray
Write-Host "   Folder: $Folder`n" -ForegroundColor Gray

# بررسی وجود پوشه local
if (-not (Test-Path $LocalPath)) {
    Write-Host "❌ پوشه local پیدا نشد: $LocalPath`n" -ForegroundColor Red
    exit 1
}

# تعیین پوشه‌های آپلود
$foldersToUpload = @()
if ($Folder -eq "all") {
    $foldersToUpload = @("audio", "images", "church-photos", "generated-images", "worship")
} else {
    $foldersToUpload = @($Folder)
}

# شمارش فایلها
Write-Host "🔍 شمارش فایلها..." -ForegroundColor Cyan
$totalFiles = 0
$totalSize = 0

foreach ($folderName in $foldersToUpload) {
    $folderPath = Join-Path $LocalPath $folderName
    if (Test-Path $folderPath) {
        $items = Get-ChildItem -Path $folderPath -Recurse -File
        $count = $items.Count
        $size = ($items | Measure-Object -Property Length -Sum).Sum
        $totalFiles += $count
        $totalSize += $size
        
        $sizeMB = [math]::Round($size / 1MB, 2)
        Write-Host "   $folderName`: $count فایل ($sizeMB MB)" -ForegroundColor White
    }
}

$totalSizeMB = [math]::Round($totalSize / 1MB, 2)
Write-Host "`n📊 کل: $totalFiles فایل ($totalSizeMB MB)`n" -ForegroundColor Yellow

if ($totalFiles -eq 0) {
    Write-Host "⚠️ هیچ فایلی پیدا نشد!`n" -ForegroundColor Yellow
    exit 0
}

# تایید
Write-Host "⚠️ آماده آپلود؟ این عملیات ممکنه چند دقیقه طول بکشه..." -ForegroundColor Yellow
Write-Host "پسورد SSH را باید وارد کنی: jIVeuzsrkoWPkhUY`n" -ForegroundColor Gray
Write-Host "ادامه؟ [Y/N]: " -ForegroundColor Cyan -NoNewline
$confirm = Read-Host

if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "`n❌ لغو شد`n" -ForegroundColor Red
    exit 0
}

# شروع آپلود
Write-Host "`n" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   🚀 شروع آپلود..." -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Green

$startTime = Get-Date
$successCount = 0
$failCount = 0

foreach ($folderName in $foldersToUpload) {
    $localFolder = Join-Path $LocalPath $folderName
    
    if (-not (Test-Path $localFolder)) {
        Write-Host "⚠️ پوشه پیدا نشد: $folderName (رد شد)`n" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "📁 آپلود $folderName..." -ForegroundColor Cyan
    
    # دستور SCP
    # -r = recursive
    # -C = compression
    # -p = preserve times
    $remoteFolder = "$User@$($Server):$RemotePath/"
    
    try {
        # SCP command
        $scpCmd = "scp -r -C -p `"$localFolder`" `"$remoteFolder`""
        Write-Host "   دستور: $scpCmd" -ForegroundColor Gray
        
        # اجرا
        & scp -r -C -p "$localFolder" "$remoteFolder"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ موفق!`n" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "   ❌ خطا (exit code: $LASTEXITCODE)`n" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "   ❌ خطا: $_`n" -ForegroundColor Red
        $failCount++
    }
}

$duration = (Get-Date) - $startTime
$durationSec = [math]::Round($duration.TotalSeconds, 1)

# خلاصه
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   ✨ آپلود کامل شد!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "📊 خلاصه:" -ForegroundColor Yellow
Write-Host "   موفق: $successCount پوشه" -ForegroundColor Green
Write-Host "   ناموفق: $failCount پوشه" -ForegroundColor Red
Write-Host "   زمان کل: $durationSec ثانیه" -ForegroundColor White
Write-Host "   حجم: $totalSizeMB MB" -ForegroundColor White

if ($totalSizeMB -gt 0 -and $durationSec -gt 0) {
    $speed = [math]::Round($totalSizeMB / $durationSec, 2)
    Write-Host "   سرعت متوسط: $speed MB/s" -ForegroundColor White
}

Write-Host "`n🌐 فایلها در مسیر زیر قرار گرفتند:" -ForegroundColor Cyan
Write-Host "   $RemotePath/" -ForegroundColor White

Write-Host "`n💡 برای دسترسی از سرور:" -ForegroundColor Yellow
Write-Host "   ssh $User@$Server" -ForegroundColor Cyan
Write-Host "   cd $RemotePath" -ForegroundColor Cyan
Write-Host "   ls -lh audio/" -ForegroundColor Cyan
Write-Host "   ls -lh images/`n" -ForegroundColor Cyan

Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
