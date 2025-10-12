# Quick System Status Check
# Run this while servers are running in another terminal

Write-Host "`n========== System Status ==========" -ForegroundColor Cyan

# Check Backend
try {
    $backendTest = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue -InformationLevel Quiet
    if ($backendTest) {
        Write-Host "[OK] Backend: http://localhost:3001" -ForegroundColor Green
        
        # Test API
        try {
            $books = Invoke-RestMethod "http://localhost:3001/api/bible/books" -TimeoutSec 3
            Write-Host "     Books API: $($books.books.Count) books" -ForegroundColor Cyan
        } catch {
            Write-Host "     API Error" -ForegroundColor Red
        }
    } else {
        Write-Host "[FAIL] Backend offline" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Backend offline" -ForegroundColor Red
}

# Check Frontend
try {
    $frontendTest = Test-NetConnection -ComputerName localhost -Port 5173 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue -InformationLevel Quiet
    if ($frontendTest) {
        Write-Host "[OK] Frontend: http://localhost:5173" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Frontend offline" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Frontend offline" -ForegroundColor Red
}

# Check Files
Write-Host "`n========== File Status ===========" -ForegroundColor Cyan
$files = @(
    "components\FlipBookBibleReader.tsx",
    "components\FlipBookBibleReader.css"
)

foreach ($f in $files) {
    if (Test-Path $f) {
        $lines = (Get-Content $f | Measure-Object -Line).Lines
        Write-Host "[OK] $f ($lines lines)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $f missing" -ForegroundColor Red
    }
}

# Git Status
Write-Host "`n========== Git Status ===========" -ForegroundColor Cyan
$status = git status --short 2>&1
$modified = ($status | Select-String "^\s*M" | Measure-Object).Count
$new = ($status | Select-String "^\?\?" | Measure-Object).Count
Write-Host "Modified: $modified | New: $new" -ForegroundColor Cyan

Write-Host "`n==================================`n" -ForegroundColor Cyan
