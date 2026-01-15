# ============================================
# Bible Audio Download Script v2 (ASCII-Safe)
# ============================================

param(
    [string]$OutputDir = "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\bible_data\audio",
    [switch]$SkipExisting = $true
)

# Book list with chapter counts
$books = @(
    @{code = "GEN"; name = "genesis"; chapters = 50 },
    @{code = "EXO"; name = "exodus"; chapters = 40 },
    @{code = "LEV"; name = "leviticus"; chapters = 27 },
    @{code = "NUM"; name = "numbers"; chapters = 36 },
    @{code = "DEU"; name = "deuteronomy"; chapters = 34 },
    @{code = "JOS"; name = "joshua"; chapters = 24 },
    @{code = "JDG"; name = "judges"; chapters = 21 },
    @{code = "RUT"; name = "ruth"; chapters = 4 },
    @{code = "1SA"; name = "1samuel"; chapters = 31 },
    @{code = "2SA"; name = "2samuel"; chapters = 24 },
    @{code = "1KI"; name = "1kings"; chapters = 22 },
    @{code = "2KI"; name = "2kings"; chapters = 25 },
    @{code = "1CH"; name = "1chronicles"; chapters = 29 },
    @{code = "2CH"; name = "2chronicles"; chapters = 36 },
    @{code = "EZR"; name = "ezra"; chapters = 10 },
    @{code = "NEH"; name = "nehemiah"; chapters = 13 },
    @{code = "EST"; name = "esther"; chapters = 10 },
    @{code = "JOB"; name = "job"; chapters = 42 },
    @{code = "PSA"; name = "psalms"; chapters = 150 },
    @{code = "PRO"; name = "proverbs"; chapters = 31 },
    @{code = "ECC"; name = "ecclesiastes"; chapters = 12 },
    @{code = "SNG"; name = "songofsolomon"; chapters = 8 },
    @{code = "ISA"; name = "isaiah"; chapters = 66 },
    @{code = "JER"; name = "jeremiah"; chapters = 52 },
    @{code = "LAM"; name = "lamentations"; chapters = 5 },
    @{code = "EZK"; name = "ezekiel"; chapters = 48 },
    @{code = "DAN"; name = "daniel"; chapters = 12 },
    @{code = "HOS"; name = "hosea"; chapters = 14 },
    @{code = "JOL"; name = "joel"; chapters = 3 },
    @{code = "AMO"; name = "amos"; chapters = 9 },
    @{code = "OBA"; name = "obadiah"; chapters = 1 },
    @{code = "JON"; name = "jonah"; chapters = 4 },
    @{code = "MIC"; name = "micah"; chapters = 7 },
    @{code = "NAM"; name = "nahum"; chapters = 3 },
    @{code = "HAB"; name = "habakkuk"; chapters = 3 },
    @{code = "ZEP"; name = "zephaniah"; chapters = 3 },
    @{code = "HAG"; name = "haggai"; chapters = 2 },
    @{code = "ZEC"; name = "zechariah"; chapters = 14 },
    @{code = "MAL"; name = "malachi"; chapters = 4 },
    # New Testament
    @{code = "MAT"; name = "matthew"; chapters = 28 },
    @{code = "MRK"; name = "mark"; chapters = 16 },
    @{code = "LUK"; name = "luke"; chapters = 24 },
    @{code = "JHN"; name = "john"; chapters = 21 },
    @{code = "ACT"; name = "acts"; chapters = 28 },
    @{code = "ROM"; name = "romans"; chapters = 16 },
    @{code = "1CO"; name = "1corinthians"; chapters = 16 },
    @{code = "2CO"; name = "2corinthians"; chapters = 13 },
    @{code = "GAL"; name = "galatians"; chapters = 6 },
    @{code = "EPH"; name = "ephesians"; chapters = 6 },
    @{code = "PHP"; name = "philippians"; chapters = 4 },
    @{code = "COL"; name = "colossians"; chapters = 4 },
    @{code = "1TH"; name = "1thessalonians"; chapters = 5 },
    @{code = "2TH"; name = "2thessalonians"; chapters = 3 },
    @{code = "1TI"; name = "1timothy"; chapters = 6 },
    @{code = "2TI"; name = "2timothy"; chapters = 4 },
    @{code = "TIT"; name = "titus"; chapters = 3 },
    @{code = "PHM"; name = "philemon"; chapters = 1 },
    @{code = "HEB"; name = "hebrews"; chapters = 13 },
    @{code = "JAS"; name = "james"; chapters = 5 },
    @{code = "1PE"; name = "1peter"; chapters = 5 },
    @{code = "2PE"; name = "2peter"; chapters = 3 },
    @{code = "1JN"; name = "1john"; chapters = 5 },
    @{code = "2JN"; name = "2john"; chapters = 1 },
    @{code = "3JN"; name = "3john"; chapters = 1 },
    @{code = "JUD"; name = "jude"; chapters = 1 },
    @{code = "REV"; name = "revelation"; chapters = 22 }
)

# Translation sources from Archive.org
$translations = @{
    "POV" = "https://archive.org/download/bible_Audio_Persian"
}

function Download-BibleAudio {
    param(
        [string]$Translation,
        [string]$BaseUrl
    )
    
    $translationDir = Join-Path $OutputDir $Translation
    
    Write-Host ""
    Write-Host "========================================"
    Write-Host "  Downloading: $Translation"
    Write-Host "========================================"
    
    $totalFiles = 0
    $downloadedFiles = 0
    $skippedFiles = 0
    $errorFiles = 0
    
    foreach ($book in $books) {
        $bookDir = Join-Path $translationDir $book.code
        
        if (-not (Test-Path $bookDir)) {
            New-Item -ItemType Directory -Path $bookDir -Force | Out-Null
        }
        
        Write-Host ""
        Write-Host "[BOOK] $($book.code) - $($book.name) ($($book.chapters) chapters)"
        
        for ($chapter = 1; $chapter -le $book.chapters; $chapter++) {
            $totalFiles++
            $chapterPad = $chapter.ToString().PadLeft(3, '0')
            $outputFile = Join-Path $bookDir "$chapter.mp3"
            
            if ($SkipExisting -and (Test-Path $outputFile)) {
                $skippedFiles++
                Write-Host "." -NoNewline
                continue
            }
            
            $url = "$BaseUrl/$($book.name)/$chapterPad.mp3"
            
            try {
                Invoke-WebRequest -Uri $url -OutFile $outputFile -TimeoutSec 120 -ErrorAction Stop
                $downloadedFiles++
                Write-Host "+" -NoNewline -ForegroundColor Green
            }
            catch {
                $errorFiles++
                Write-Host "x" -NoNewline -ForegroundColor Red
                "$Translation/$($book.code)/$chapter - $($_.Exception.Message)" | Out-File -Append "$OutputDir\download_errors.log"
            }
        }
    }
    
    Write-Host ""
    Write-Host ""
    Write-Host "=== Stats for $Translation ==="
    Write-Host "Total files: $totalFiles"
    Write-Host "Downloaded: $downloadedFiles" -ForegroundColor Green
    Write-Host "Skipped: $skippedFiles" -ForegroundColor Yellow
    Write-Host "Errors: $errorFiles" -ForegroundColor Red
}

# ============================================
# Start Download
# ============================================

Write-Host ""
Write-Host "=============================================="
Write-Host "   Bible Audio Downloader from Archive.org"
Write-Host "=============================================="
Write-Host ""
Write-Host "Output: $OutputDir"
Write-Host ""

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Download each translation
foreach ($trans in $translations.GetEnumerator()) {
    Download-BibleAudio -Translation $trans.Key -BaseUrl $trans.Value
}

Write-Host ""
Write-Host "=== Download Complete ===" -ForegroundColor Green
Write-Host "Errors saved to: $OutputDir\download_errors.log"
