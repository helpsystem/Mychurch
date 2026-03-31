param(
  [Parameter(Mandatory = $true)]
  [string]$Tag,

  [Parameter(Mandatory = $false)]
  [string]$Title,

  [Parameter(Mandatory = $false)]
  [string]$NotesFile
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

if (-not $Title -or $Title.Trim().Length -eq 0) {
  $Title = $Tag
}

if (-not $NotesFile -or $NotesFile.Trim().Length -eq 0) {
  $NotesFile = "GITHUB_RELEASE_$Tag.md"
}

$ghPath = "C:\Program Files\GitHub CLI\gh.exe"
if (Test-Path $ghPath) {
  $ghCmd = $ghPath
} else {
  $ghCmd = "gh"
}

Write-Host "[1/4] Checking git tag exists: $Tag"
$tagExists = git tag --list $Tag
if (-not $tagExists) {
  throw "Tag '$Tag' does not exist. Create and push tag first."
}

Write-Host "[2/4] Checking release notes file: $NotesFile"
if (-not (Test-Path $NotesFile)) {
  throw "Notes file '$NotesFile' not found in repo root."
}

Write-Host "[3/5] Checking GitHub auth status"
& $ghCmd auth status | Out-Null

Write-Host "[4/5] Checking existing release for tag: $Tag"
& $ghCmd release view $Tag *> $null
if ($LASTEXITCODE -eq 0) {
  throw "A release for tag '$Tag' already exists. Use a new tag or edit the existing release."
}

Write-Host "[5/5] Creating draft release"
& $ghCmd release create $Tag --title $Title --notes-file $NotesFile --draft

Write-Host "Draft release created successfully for tag '$Tag'."
