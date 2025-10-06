param(
  [string]$LocalProject = "C:\Users\Sami\Desktop\Iran Church DC\Git\Mychurch",
  [string]$BibleFolder = "C:\Users\Sami\Desktop\En Fr Bible",
  [string]$ZipPath = "C:\Users\Sami\Desktop\Mychurch-deploy.zip",
  [string]$RemoteUser = "root",
  [string]$RemoteHost = "samanabyar.online",
  [string]$RemoteTmp = "/tmp",
  [switch]$UseScp = $true
)

Write-Host "Project:" $LocalProject
Write-Host "Bible folder:" $BibleFolder

# Ensure attached_assets exists
$attached = Join-Path $LocalProject 'attached_assets'
if (-not (Test-Path $attached)) {
    New-Item -ItemType Directory -Path $attached | Out-Null
}

# Copy sqlite/sql files from BibleFolder into attached_assets
Get-ChildItem -Path $BibleFolder -Include *.sqlite,*.db,*.sql -File -Recurse | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $attached -Force
    Write-Host "Copied $($_.Name) -> attached_assets"
}

# Create zip package (exclude node_modules)
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
Write-Host "Creating zip archive..."
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($LocalProject, $ZipPath)

if ($UseScp) {
    Write-Host "Uploading $ZipPath to $RemoteUser@$RemoteHost:$RemoteTmp ..."
    scp $ZipPath "$RemoteUser@$RemoteHost:$RemoteTmp/"
    if ($LASTEXITCODE -ne 0) { Write-Error "SCP failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }
    Write-Host "Upload finished." 
} else {
    Write-Host "UseScp not set; zip created at $ZipPath"
}

Write-Host "Done. SSH to the server and run the server deploy script: /tmp/server-deploy.sh"
