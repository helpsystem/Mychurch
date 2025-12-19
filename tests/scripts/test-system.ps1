# MyChurch Website - Automated Test Script
# Complete System Test

$ErrorActionPreference = "Continue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MyChurch Website - System Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Check Servers
Write-Host "Test 1: Checking Servers..." -ForegroundColor Yellow

$backendRunning = $false
$frontendRunning = $false

try {
    $backendTest = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($backendTest.TcpTestSucceeded) {
        Write-Host "  [OK] Backend Server: http://localhost:3001" -ForegroundColor Green
        $backendRunning = $true
    } else {
        Write-Host "  [FAIL] Backend Server NOT RUNNING (Port 3001)" -ForegroundColor Red
    }
} catch {
    Write-Host "  [ERROR] Backend test failed" -ForegroundColor Red
}

try {
    $frontendTest = Test-NetConnection -ComputerName localhost -Port 5173 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($frontendTest.TcpTestSucceeded) {
        Write-Host "  [OK] Frontend Server: http://localhost:5173" -ForegroundColor Green
        $frontendRunning = $true
    } else {
        Write-Host "  [FAIL] Frontend Server NOT RUNNING (Port 5173)" -ForegroundColor Red
    }
} catch {
    Write-Host "  [ERROR] Frontend test failed" -ForegroundColor Red
}

Write-Host ""

# Test 2: API Endpoints
Write-Host "Test 2: Testing API Endpoints..." -ForegroundColor Yellow

if ($backendRunning) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/bible/books" -Method Get -TimeoutSec 5
        if ($response.success -and $response.books) {
            Write-Host "  [OK] Bible Books API: $($response.books.Count) books loaded" -ForegroundColor Green
            
            $firstBook = $response.books[0].key
            try {
                $chapterResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/bible/content/$firstBook/1" -Method Get -TimeoutSec 5
                if ($chapterResponse.success) {
                    Write-Host "  [OK] Bible Content API: $($chapterResponse.verses.fa.Count) verses loaded" -ForegroundColor Green
                }
            } catch {
                Write-Host "  [WARN] Bible Content API failed" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  [FAIL] Bible Books API: Invalid response" -ForegroundColor Red
        }
    } catch {
        Write-Host "  [FAIL] Bible Books API: $($_.Exception.Message)" -ForegroundColor Red
    }

    try {
        $healthResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get -TimeoutSec 3
        Write-Host "  [OK] Health Check API" -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] Health Check API failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [SKIP] API tests - Backend not running" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Check Important Files
Write-Host "Test 3: Checking Project Files..." -ForegroundColor Yellow

$projectRoot = "c:\Users\Sami\Desktop\Iran Church DC\Git\Mychurch"
$importantFiles = @(
    "components\FlipBookBibleReader.tsx",
    "components\FlipBookBibleReader.css",
    "components\ModernBibleReader.tsx",
    "pages\BibleReaderPage.tsx",
    "backend\dev-server.js"
)

$allFilesExist = $true
foreach ($file in $importantFiles) {
    $fullPath = Join-Path $projectRoot $file
    if (Test-Path $fullPath) {
        $fileInfo = Get-Item $fullPath
        $lineCount = (Get-Content $fullPath -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
        Write-Host "  [OK] $file ($lineCount lines)" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $file NOT FOUND" -ForegroundColor Red
        $allFilesExist = $false
    }
}

Write-Host ""

# Test 4: Git Status
Write-Host "Test 4: Checking Git Status..." -ForegroundColor Yellow

Push-Location $projectRoot
try {
    $gitStatus = git status --short 2>&1
    if ($LASTEXITCODE -eq 0) {
        $modifiedFiles = ($gitStatus | Select-String "^\s*M" | Measure-Object).Count
        $newFiles = ($gitStatus | Select-String "^\?\?" | Measure-Object).Count
        
        Write-Host "  Modified files: $modifiedFiles" -ForegroundColor Cyan
        Write-Host "  New files: $newFiles" -ForegroundColor Cyan
        
        if ($modifiedFiles -gt 0 -or $newFiles -gt 0) {
            Write-Host "  [INFO] You have uncommitted changes" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [WARN] Not a git repository" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [ERROR] Git error" -ForegroundColor Red
} finally {
    Pop-Location
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($backendRunning -and $frontendRunning -and $allFilesExist) {
    Write-Host "`n  Status: ALL TESTS PASSED" -ForegroundColor Green
    Write-Host "`n  Website: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "  Backend: http://localhost:3001" -ForegroundColor Cyan
} else {
    Write-Host "`n  Status: SOME TESTS FAILED" -ForegroundColor Yellow
    if (-not $backendRunning -or -not $frontendRunning) {
        Write-Host "`n  To start servers: npm run dev:full" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
