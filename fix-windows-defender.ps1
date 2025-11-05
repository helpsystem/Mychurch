# Fix Windows Defender - Add Node.js to Exclusions
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "`nNeed Administrator privileges! Restarting...`n" -ForegroundColor Yellow
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoExit", "-File", "`"$PSCommandPath`""
    exit
}

Write-Host "`n=================================================" -ForegroundColor Green
Write-Host "   Running as Administrator" -ForegroundColor Green
Write-Host "=================================================`n" -ForegroundColor Green

$projectPath = "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch"
$nodePath = "C:\Program Files\nodejs\node.exe"

Write-Host "Adding Exclusions to Windows Defender...`n" -ForegroundColor Yellow

try {
    Write-Host "1. Node.exe..." -NoNewline -ForegroundColor Cyan
    Add-MpPreference -ExclusionPath $nodePath -ErrorAction Stop
    Write-Host " OK" -ForegroundColor Green
    
    Write-Host "2. Project folder..." -NoNewline -ForegroundColor Cyan
    Add-MpPreference -ExclusionPath $projectPath -ErrorAction Stop
    Write-Host " OK" -ForegroundColor Green
    
    Write-Host "3. node_modules..." -NoNewline -ForegroundColor Cyan
    Add-MpPreference -ExclusionPath "$projectPath\node_modules" -ErrorAction Stop
    Write-Host " OK" -ForegroundColor Green
    
    Write-Host "4. backend..." -NoNewline -ForegroundColor Cyan
    Add-MpPreference -ExclusionPath "$projectPath\backend" -ErrorAction Stop
    Write-Host " OK" -ForegroundColor Green
    
    Write-Host "5. dist..." -NoNewline -ForegroundColor Cyan
    Add-MpPreference -ExclusionPath "$projectPath\dist" -ErrorAction Stop
    Write-Host " OK" -ForegroundColor Green
    
    Write-Host "`n=================================================" -ForegroundColor Green
    Write-Host "   SUCCESS! All exclusions added!" -ForegroundColor Green
    Write-Host "=================================================`n" -ForegroundColor Green
    
    Write-Host "Exclusions added:`n" -ForegroundColor Yellow
    Write-Host "   $nodePath" -ForegroundColor White
    Write-Host "   $projectPath" -ForegroundColor White
    Write-Host "   $projectPath\node_modules" -ForegroundColor White
    Write-Host "   $projectPath\backend" -ForegroundColor White
    Write-Host "   $projectPath\dist`n" -ForegroundColor White
    
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "   Now restart VS Code Terminal and test!" -ForegroundColor Cyan
    Write-Host "=================================================`n" -ForegroundColor Cyan
    
    Write-Host "Next: node backend/minimal-test-server.js`n" -ForegroundColor Green
    
} catch {
    Write-Host "`nError: $_`n" -ForegroundColor Red
}

Write-Host "Press Enter to close..." -ForegroundColor Gray
Read-Host
