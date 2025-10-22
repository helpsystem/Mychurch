# 🔐 SSH Authentication Test

Write-Host ""
Write-Host "🔍 Testing SSH Authentication Methods..." -ForegroundColor Cyan
Write-Host ""

# Load .env
$envFile = ".\backend\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "✅ .env loaded" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    exit 1
}

$sshHost = $env:SSH_HOST
$sshPort = $env:SSH_PORT
$sshUser = $env:SSH_USER
$sshPass = $env:SSH_PASS

Write-Host "Host: $sshHost" -ForegroundColor Yellow
Write-Host "Port: $sshPort" -ForegroundColor Yellow
Write-Host "User: $sshUser" -ForegroundColor Yellow
Write-Host "Pass: $(if($sshPass){'***'}else{'NOT SET'})" -ForegroundColor Yellow
Write-Host ""

# Test با plink (اگر موجود باشد)
if (Get-Command plink -ErrorAction SilentlyContinue) {
    Write-Host "🔧 Testing with Plink..." -ForegroundColor Cyan
    echo y | plink -P $sshPort -pw $sshPass "$sshUser@$sshHost" "pwd && whoami"
} else {
    Write-Host "⚠️  Plink not found (PuTTY not installed)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💡 Alternative: Try manual SSH connection" -ForegroundColor Cyan
Write-Host "   ssh -p $sshPort $sshUser@$sshHost" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 برای A2 Hosting معمولاً از SSH Key استفاده می‌شود" -ForegroundColor Yellow
Write-Host "   شما باید از cPanel یک SSH Key بسازید یا از FTP استفاده کنید" -ForegroundColor Yellow
Write-Host ""
