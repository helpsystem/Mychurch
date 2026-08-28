# Apply official church emblem logo to public assets
$source = "C:\Users\SamYar\.gemini\antigravity-ide\brain\5c16f79e-26e0-4e21-aaa9-bb93a87c2bf2\church_official_logo_1787949944977.jpg"
$publicDir = Join-Path $PSScriptRoot "..\public"

if (-not (Test-Path $source)) {
    Write-Host "Source image not found: $source" -ForegroundColor Red
    exit 1
}

$targets = @("logo.png", "logo-transparent.png", "favicon.ico", "apple-touch-icon.png")

foreach ($t in $targets) {
    $dest = Join-Path $publicDir $t
    Copy-Item -Path $source -Destination $dest -Force
    Write-Host "Replaced: $t" -ForegroundColor Green
}

Write-Host "`nAll church logo assets updated successfully!" -ForegroundColor Cyan
