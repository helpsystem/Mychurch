# PowerShell script to rename Persian audio files to Finglish

$ErrorActionPreference = "Continue"
$OutputEncoding = [System.Text.Encoding]::UTF8

$audioDir = "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\frontend\public\worship\audio\kalameh"
$jsonPath = "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\frontend\public\worship\data\worship_songs.json"

# Persian to Finglish mapping
$charMap = @{
    'آ' = 'a'; 'ا' = 'a'; 'ب' = 'b'; 'پ' = 'p'; 'ت' = 't'; 'ث' = 's'
    'ج' = 'j'; 'چ' = 'ch'; 'ح' = 'h'; 'خ' = 'kh'; 'د' = 'd'; 'ذ' = 'z'
    'ر' = 'r'; 'ز' = 'z'; 'ژ' = 'zh'; 'س' = 's'; 'ش' = 'sh'; 'ص' = 's'
    'ض' = 'z'; 'ط' = 't'; 'ظ' = 'z'; 'ع' = 'a'; 'غ' = 'gh'; 'ف' = 'f'
    'ق' = 'gh'; 'ک' = 'k'; 'گ' = 'g'; 'ل' = 'l'; 'م' = 'm'; 'ن' = 'n'
    'و' = 'o'; 'ه' = 'h'; 'ی' = 'i'; 'ي' = 'i'; 'ئ' = 'y'; 'ء' = ''
    'ة' = 'h'; 'أ' = 'a'; 'إ' = 'e'; 'ؤ' = 'o'; 'ى' = 'a'; 'ك' = 'k'
    '‌' = ''; '‍' = ''; ' ' = '_'
}

function ConvertTo-Finglish {
    param([string]$text)
    
    $result = ""
    foreach ($char in $text.ToCharArray()) {
        if ($charMap.ContainsKey([string]$char)) {
            $result += $charMap[[string]$char]
        }
        elseif ($char -match '[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]') {
            # Skip unknown Persian/Arabic chars
        }
        else {
            $result += $char
        }
    }
    
    # Clean up
    $result = $result -replace '[^\w\-_.]', ''
    $result = $result -replace '_+', '_'
    $result = $result.Trim('_')
    
    return $result
}

function Has-Persian {
    param([string]$text)
    return $text -match '[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]'
}

Write-Host "Reading audio directory..."
$files = Get-ChildItem -Path $audioDir -Filter "*.mp3"
$persianFiles = $files | Where-Object { Has-Persian $_.Name }

Write-Host "Found $($persianFiles.Count) Persian-named files out of $($files.Count) total"

# Create rename map
$renameMap = @{}
$usedNames = @{}
foreach ($f in $files) {
    $usedNames[$f.Name.ToLower()] = $true
}

foreach ($file in $persianFiles) {
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $ext = [System.IO.Path]::GetExtension($file.Name)
    
    $newBase = ConvertTo-Finglish $baseName
    
    if (-not $newBase -or $newBase.Length -lt 2) {
        $newBase = "song_" + [System.Guid]::NewGuid().ToString().Substring(0, 8)
    }
    
    $newName = "$newBase$ext"
    $counter = 1
    
    while ($usedNames.ContainsKey($newName.ToLower())) {
        $newName = "${newBase}_${counter}${ext}"
        $counter++
    }
    
    $usedNames[$newName.ToLower()] = $true
    $renameMap[$file.Name] = $newName
}

# Perform renames
Write-Host "`nRenaming files..."
$renameCount = 0
$errorCount = 0

foreach ($oldName in $renameMap.Keys) {
    $newName = $renameMap[$oldName]
    $oldPath = Join-Path $audioDir $oldName
    $newPath = Join-Path $audioDir $newName
    
    try {
        if (Test-Path $oldPath) {
            Rename-Item -Path $oldPath -NewName $newName -ErrorAction Stop
            Write-Host "OK: $oldName -> $newName"
            $renameCount++
        }
    }
    catch {
        Write-Host "ERR: $oldName - $($_.Exception.Message)"
        $errorCount++
    }
}

Write-Host "`nRenamed $renameCount files, $errorCount errors"

# Update JSON
Write-Host "`nUpdating worship_songs.json..."
$jsonContent = Get-Content -Path $jsonPath -Raw -Encoding UTF8
$songs = $jsonContent | ConvertFrom-Json

$jsonUpdates = 0
foreach ($song in $songs) {
    if ($song.audioUrl) {
        $filename = [System.IO.Path]::GetFileName($song.audioUrl)
        if ($renameMap.ContainsKey($filename)) {
            $song.audioUrl = $song.audioUrl.Replace($filename, $renameMap[$filename])
            $jsonUpdates++
        }
    }
}

$songs | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonPath -Encoding UTF8
Write-Host "Updated $jsonUpdates entries in JSON"

Write-Host "`nDone!"
