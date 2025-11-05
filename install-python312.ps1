# نصب خودکار Python 3.12 برای استفاده از Hezar
# این اسکریپت Python 3.12 را دانلود و نصب می‌کند

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "نصب Python 3.12 برای استفاده از Hezar" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# تنظیمات
$pythonVersion = "3.12.8"
$downloadUrl = "https://www.python.org/ftp/python/$pythonVersion/python-$pythonVersion-amd64.exe"
$installerPath = "$env:TEMP\python-$pythonVersion-installer.exe"

Write-Host "📦 نسخه: Python $pythonVersion" -ForegroundColor Yellow
Write-Host "🔗 URL: $downloadUrl`n" -ForegroundColor Gray

# بررسی اتصال اینترنت
Write-Host "🌐 بررسی اتصال اینترنت..." -ForegroundColor Cyan
try {
    $null = Test-Connection -ComputerName www.python.org -Count 1 -Quiet
    Write-Host "✅ اتصال برقرار است`n" -ForegroundColor Green
} catch {
    Write-Host "❌ خطا: اتصال اینترنت برقرار نیست!" -ForegroundColor Red
    Write-Host "لطفاً اتصال خود را بررسی کنید." -ForegroundColor Yellow
    pause
    exit 1
}

# دانلود Python
Write-Host "📥 دانلود Python $pythonVersion..." -ForegroundColor Cyan
Write-Host "   (حدود 25 MB - ممکن است 1-2 دقیقه طول بکشد)`n" -ForegroundColor Gray

try {
    # حذف فایل قبلی اگر وجود دارد
    if (Test-Path $installerPath) {
        Remove-Item $installerPath -Force
    }
    
    # دانلود با نمایش پیشرفت
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
    $ProgressPreference = 'Continue'
    
    Write-Host "✅ دانلود کامل شد`n" -ForegroundColor Green
} catch {
    Write-Host "❌ خطا در دانلود: $_" -ForegroundColor Red
    Write-Host "`nلطفاً دستی دانلود کنید:" -ForegroundColor Yellow
    Write-Host $downloadUrl -ForegroundColor Cyan
    pause
    exit 1
}

# نصب Python
Write-Host "📦 نصب Python $pythonVersion..." -ForegroundColor Cyan
Write-Host "   (لطفاً در پنجره نصب 'Add to PATH' را تیک بزنید)`n" -ForegroundColor Yellow

try {
    # نصب خودکار با گزینه‌های پیشنهادی
    $installArgs = @(
        "/quiet",                    # نصب بدون تعامل
        "InstallAllUsers=0",         # نصب برای کاربر فعلی
        "PrependPath=1",             # اضافه کردن به PATH
        "Include_test=0",            # بدون تست‌ها
        "Include_pip=1",             # شامل pip
        "Include_tcltk=1",           # شامل Tkinter
        "Include_launcher=1",        # شامل Python Launcher
        "InstallLauncherAllUsers=0"  # Launcher برای کاربر فعلی
    )
    
    Write-Host "⚙️  در حال نصب... (لطفاً صبر کنید)" -ForegroundColor Yellow
    
    $process = Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✅ نصب کامل شد!`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  کد خروج: $($process.ExitCode)" -ForegroundColor Yellow
        Write-Host "نصب ممکن است ناقص باشد. لطفاً دستی بررسی کنید.`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ خطا در نصب: $_" -ForegroundColor Red
    Write-Host "`nلطفاً دستی نصب کنید:" -ForegroundColor Yellow
    Write-Host "فایل دانلود شده: $installerPath" -ForegroundColor Cyan
    pause
    exit 1
}

# پاکسازی
Write-Host "🧹 پاکسازی فایل‌های موقت..." -ForegroundColor Cyan
Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
Write-Host "✅ پاکسازی کامل شد`n" -ForegroundColor Green

# تازه‌سازی متغیرهای محیطی
Write-Host "🔄 تازه‌سازی متغیرهای محیطی..." -ForegroundColor Cyan
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# بررسی نصب
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "بررسی نصب" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green

Start-Sleep -Seconds 2

# تست Python 3.12
Write-Host "🔍 تست Python 3.12..." -ForegroundColor Cyan
try {
    $result = py -3.12 --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $result" -ForegroundColor Green
        $python312Works = $true
    } else {
        Write-Host "⚠️  py -3.12 کار نکرد" -ForegroundColor Yellow
        $python312Works = $false
    }
} catch {
    Write-Host "⚠️  py -3.12 در دسترس نیست" -ForegroundColor Yellow
    $python312Works = $false
}

if (-not $python312Works) {
    Write-Host "`n⚠️  لطفاً یک پنجره PowerShell جدید باز کنید" -ForegroundColor Yellow
    Write-Host "   (برای بارگذاری مجدد PATH)" -ForegroundColor Gray
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "مراحل بعدی" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

if ($python312Works) {
    Write-Host "1️⃣  نصب Hezar:" -ForegroundColor White
    Write-Host "   py -3.12 -m pip install hezar scipy`n" -ForegroundColor Cyan
    
    Write-Host "2️⃣  تست Hezar:" -ForegroundColor White
    Write-Host "   py -3.12 scripts/test_hezar_simple.py`n" -ForegroundColor Cyan
    
    Write-Host "3️⃣  تولید صوت:" -ForegroundColor White
    Write-Host "   py -3.12 scripts/hezar_tts_generator.py --book EPH --chapter 1`n" -ForegroundColor Cyan
    
    Write-Host "آیا می‌خواهید الان Hezar را نصب کنید؟ (Y/N) " -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    
    if ($response -eq 'Y' -or $response -eq 'y') {
        Write-Host "`n📦 نصب Hezar..." -ForegroundColor Cyan
        py -3.12 -m pip install hezar scipy pydub
        
        Write-Host "`n✅ تمام! حالا می‌توانید تست کنید:" -ForegroundColor Green
        Write-Host "   py -3.12 scripts/test_hezar_simple.py" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  لطفاً PowerShell را ببندید و دوباره باز کنید" -ForegroundColor Yellow
    Write-Host "   سپس این دستور را اجرا کنید:" -ForegroundColor Gray
    Write-Host "`n   py -3.12 --version`n" -ForegroundColor Cyan
}

Write-Host "`n✅ اسکریپت نصب به پایان رسید" -ForegroundColor Green
pause
