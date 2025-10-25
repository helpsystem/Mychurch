Param(
  [string]$LocalDir = "C:\MyChurchSync\local",
  [string]$ServerHost = "your.server.com",
  [int]$Port = 22,
  [string]$UserName = "username",
  [securestring]$Password,
  [string]$RemoteDir = "/home/youruser/public_html/worship/",
  [string]$ConverterScript = "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\scripts\convert_kalameh_export_to_frontend.py"
)

Write-Host "🚀 Starting Worship Sync..." -ForegroundColor Green
Write-Host " LocalDir:    $LocalDir"
Write-Host (" Host:        {0}:{1}" -f $ServerHost, $Port)
Write-Host " RemoteDir:   $RemoteDir"
Write-Host " Converter:   $ConverterScript"

$scriptPath = Join-Path $PSScriptRoot 'sync_to_server.py'
if (!(Test-Path $scriptPath)) {
  Write-Error "sync_to_server.py not found at $scriptPath"
  exit 1
}

# Prompt for password if not provided
if (-not $Password) {
  $Password = Read-Host -AsSecureString -Prompt "Enter server password"
}

function Get-PlainText([SecureString]$sec) {
  $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  try {
    return [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
  } finally {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

$pwdPlain = Get-PlainText $Password

# Activate venv if present
$venvPy = Join-Path $PSScriptRoot '..\.venv\Scripts\python.exe'
if (Test-Path $venvPy) {
  Write-Host "Using venv Python: $venvPy" -ForegroundColor Yellow
  & $venvPy $scriptPath --local-dir "$LocalDir" --host "$ServerHost" --port $Port --user "$UserName" --password "$pwdPlain" --remote-dir "$RemoteDir" --converter "$ConverterScript"
} else {
  Write-Host "Using system Python (py)" -ForegroundColor Yellow
  py $scriptPath --local-dir "$LocalDir" --host "$ServerHost" --port $Port --user "$UserName" --password "$pwdPlain" --remote-dir "$RemoteDir" --converter "$ConverterScript"
}
