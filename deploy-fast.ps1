# Fast Deploy Script - Only uploads NEW build files
# Uses rsync via Git Bash for smart sync (only changed files)

$distPath = "d:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\dist"
$server = "root@samanabyar.online"
$remotePath = "/root/Mychurch/dist"
$gitBash = "C:\Program Files\Git\bin\bash.exe"

Write-Host "=== Smart Deploy ===" -ForegroundColor Cyan

# Check if Git Bash exists (has rsync)
if (Test-Path $gitBash) {
    Write-Host "Using rsync (only uploads changed files)..." -ForegroundColor Green
    
    # Convert Windows path to Unix style for bash
    $unixDist = $distPath -replace '\\','/' -replace '^([A-Z]):','/mnt/$1'.ToLower()
    # Actually for Git Bash it's different:
    $unixDist = $distPath -replace '\\','/' -replace '^([A-Z]):','/$1'.ToLower()
    
    # rsync with --delete removes old files, --checksum only uploads changed
    $cmd = "rsync -avz --progress --delete --exclude='worship/audio/*' --exclude='bible/audio/*' '$unixDist/' '${server}:${remotePath}/'"
    
    Write-Host "Running: $cmd" -ForegroundColor Gray
    & $gitBash -c $cmd
} else {
    Write-Host "Git Bash not found, using scp (slower)..." -ForegroundColor Yellow
    
    # Upload only index.html and assets
    Write-Host "Uploading index.html..." -ForegroundColor Yellow
    scp "$distPath\index.html" "${server}:${remotePath}/"
    
    Write-Host "Uploading assets..." -ForegroundColor Yellow
    scp -r "$distPath\assets\*" "${server}:${remotePath}/assets/"
}

Write-Host "Deploy complete!" -ForegroundColor Green
