# Test Bible API for 2 Kings Chapter 16
Write-Host "Testing Bible API..." -ForegroundColor Cyan
Write-Host "Endpoint: http://localhost:3001/api/bible/content/2KI/16" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/bible/content/2KI/16" -Method Get -ErrorAction Stop
    
    Write-Host "✅ Success: $($response.success)" -ForegroundColor Green
    Write-Host "📖 Book (EN): $($response.book.name.en)" -ForegroundColor Cyan
    Write-Host "📖 Book (FA): $($response.book.name.fa)" -ForegroundColor Cyan
    Write-Host "📄 Chapter: $($response.chapter)" -ForegroundColor Cyan
    Write-Host "📊 English Verses: $($response.verses.en.Count)" -ForegroundColor Cyan
    Write-Host "📊 Persian Verses: $($response.verses.fa.Count)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($response.verses.en.Count -gt 0) {
        Write-Host "First English verse:" -ForegroundColor Yellow
        Write-Host "  $($response.verses.en[0])" -ForegroundColor White
        Write-Host ""
    }
    
    if ($response.verses.fa.Count -gt 0) {
        Write-Host "First Persian verse:" -ForegroundColor Yellow
        Write-Host "  $($response.verses.fa[0])" -ForegroundColor White
        Write-Host ""
    }
    
    # Check if it's Genesis 1 (the problem)
    if ($response.verses.en[0] -like "*In the beginning God created*") {
        Write-Host "❌ ERROR: Still returning Genesis 1!" -ForegroundColor Red
    } else {
        Write-Host "✅ CORRECT: Not Genesis 1!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "   Make sure backend is running on port 3001" -ForegroundColor Yellow
}
