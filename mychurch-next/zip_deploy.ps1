param()
$src = "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\mychurch-next\.next\standalone"
$dest = "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\mychurch-next\deploy_standalone.zip"

if (Test-Path $dest) {
    Remove-Item $dest -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($dest, [System.IO.Compression.ZipArchiveMode]::Create)

# Add server.js and package.json
$serverFile = Join-Path $src "server.js"
$packageFile = Join-Path $src "package.json"
if (Test-Path $serverFile) {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $serverFile, "server.js")
}
if (Test-Path $packageFile) {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $packageFile, "package.json")
}

# Add .next directory recursively
$nextDir = Join-Path $src ".next"
$files = Get-ChildItem -Path $nextDir -Recurse -File
$baseLen = $src.TrimEnd('\').Length + 1

foreach ($file in $files) {
    $relPath = $file.FullName.Substring($baseLen)
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relPath, [System.IO.Compression.CompressionLevel]::Fastest)
}

$zip.Dispose()
$sizeMB = [math]::round((Get-Item $dest).Length / 1MB, 2)
Write-Host "Created $dest ($sizeMB MB)"
