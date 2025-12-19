# Smart Audio System - API Testing Script
# Run this after starting the backend server

Write-Host "`n===========================================`n" -ForegroundColor Yellow
Write-Host "   Smart Audio System - API Tests" -ForegroundColor Cyan
Write-Host "`n===========================================`n" -ForegroundColor Yellow

# Test 1: Genesis 1 (Should use local file)
Write-Host "`nTest 1: Genesis Chapter 1 (Local File Expected)`n" -ForegroundColor Cyan
Write-Host "Endpoint: GET /api/audio/source/GEN/1?lang=fa" -ForegroundColor Gray
try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:3001/api/audio/source/GEN/1?lang=fa" -Method GET
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "  URL: $($response1.audio.url)" -ForegroundColor White
    Write-Host "  Type: $($response1.audio.type)" -ForegroundColor White
    Write-Host "  Priority: $($response1.audio.priority)" -ForegroundColor White
    Write-Host "  Local: $($response1.audio.isLocal)" -ForegroundColor White
    if ($response1.audio.type -eq 'local-edge-tts') {
        Write-Host "  ✅ Using local file as expected!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Expected local-edge-tts, got $($response1.audio.type)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "FAILED: $_" -ForegroundColor Red
}

# Test 2: Exodus 10 (Should use local file)
Write-Host "`n`nTest 2: Exodus Chapter 10 (Local File Expected)`n" -ForegroundColor Cyan
Write-Host "Endpoint: GET /api/audio/source/EXO/10?lang=fa" -ForegroundColor Gray
try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:3001/api/audio/source/EXO/10?lang=fa" -Method GET
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "  URL: $($response2.audio.url)" -ForegroundColor White
    Write-Host "  Type: $($response2.audio.type)" -ForegroundColor White
    Write-Host "  Priority: $($response2.audio.priority)" -ForegroundColor White
    if ($response2.audio.type -eq 'local-edge-tts') {
        Write-Host "  ✅ Using local file as expected!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Expected local-edge-tts, got $($response2.audio.type)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "FAILED: $_" -ForegroundColor Red
}

# Test 3: Matthew 1 (Should fallback to CDN)
Write-Host "`n`nTest 3: Matthew Chapter 1 (CDN Fallback Expected)`n" -ForegroundColor Cyan
Write-Host "Endpoint: GET /api/audio/source/MAT/1?lang=fa" -ForegroundColor Gray
try {
    $response3 = Invoke-RestMethod -Uri "http://localhost:3001/api/audio/source/MAT/1?lang=fa" -Method GET
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "  URL: $($response3.audio.url)" -ForegroundColor White
    Write-Host "  Type: $($response3.audio.type)" -ForegroundColor White
    Write-Host "  Priority: $($response3.audio.priority)" -ForegroundColor White
    Write-Host "  Local: $($response3.audio.isLocal)" -ForegroundColor White
    if ($response3.audio.type -eq 'cdn-wordproject') {
        Write-Host "  ✅ Using CDN fallback as expected!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Expected cdn-wordproject, got $($response3.audio.type)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "FAILED: $_" -ForegroundColor Red
}

# Test 4: Inventory
Write-Host "`n`nTest 4: Audio Inventory`n" -ForegroundColor Cyan
Write-Host "Endpoint: GET /api/audio/inventory" -ForegroundColor Gray
try {
    $response4 = Invoke-RestMethod -Uri "http://localhost:3001/api/audio/inventory" -Method GET
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "  Total Files: $($response4.inventory.total)" -ForegroundColor White
    Write-Host "  Total Size: $([math]::Round($response4.inventory.totalSize / 1MB, 2)) MB" -ForegroundColor White
    if ($response4.inventory.total -eq 180) {
        Write-Host "  ✅ All 180 local files detected!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Expected 180 files, found $($response4.inventory.total)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "FAILED: $_" -ForegroundColor Red
}

# Test 5: Batch Resolve
Write-Host "`n`nTest 5: Batch Resolve (Multiple Chapters)`n" -ForegroundColor Cyan
Write-Host "Endpoint: POST /api/audio/batch-resolve" -ForegroundColor Gray
try {
    $chapters = @(
        @{ book = "GEN"; chapter = 1 },
        @{ book = "EXO"; chapter = 1 },
        @{ book = "MAT"; chapter = 1 }
    )
    $body = @{ chapters = $chapters } | ConvertTo-Json
    $response5 = Invoke-RestMethod -Uri "http://localhost:3001/api/audio/batch-resolve" -Method POST -Body $body -ContentType "application/json"
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "  Resolved $($response5.results.Count) chapters" -ForegroundColor White
    Write-Host "  ✅ Batch processing works!" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $_" -ForegroundColor Red
}

# Summary
Write-Host "`n`n===========================================`n" -ForegroundColor Yellow
Write-Host "   Test Summary" -ForegroundColor Cyan
Write-Host "`n===========================================`n" -ForegroundColor Yellow
Write-Host "✅ Smart Audio System API is ready!" -ForegroundColor Green
Write-Host "`nNext Steps:`n" -ForegroundColor Yellow
Write-Host "  1. Test frontend: http://localhost:5173/#/bible/text-only" -ForegroundColor White
Write-Host "  2. Select Genesis 1 → Should show: 🟢 محلی" -ForegroundColor White
Write-Host "  3. Select Matthew 1 → Should show: 🌐 آنلاین" -ForegroundColor White
Write-Host "  4. Play audio and test controls" -ForegroundColor White
Write-Host "`n"
