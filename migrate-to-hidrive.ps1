<#
  Simplified HiDrive migration script (ASCII only)
  Modes:
    dry-run   -> Scan folders and build migration-plan.json
    upload    -> Produce rsync/SFTP commands (no automatic transfer on Windows)
    update-db -> Generate SQL file hidrive-url-migration.sql to update URLs
#>

param(
  [string]$Mode = 'dry-run',
  [string]$HiDriveUser = 'adminchurch',
  [string]$HiDriveHost = 'sftp.hidrive.ionos.com',
  [string]$HiDriveBasePath = '/users/adminchurch/mychurch',
  [string]$HiDrivePublicUrl = 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch'
)

$ErrorActionPreference = 'Stop'

Write-Host '=== HiDrive Migration Script ==='
Write-Host "Mode: $Mode"

# Categories definition (minimal)
$FilesToMigrate = @{
  'worship-audio' = @{ LocalPath='public/worship/audio/kalameh'; RemotePath="$HiDriveBasePath/worship/audio"; TableUpdate=@{Table='worship_songs';Column='audiourl';PathPrefix='/worship/audio/';NewPrefix="$HiDrivePublicUrl/worship/audio/"} }
  'event-images'  = @{ LocalPath='public/images'; RemotePath="$HiDriveBasePath/events/images"; TableUpdate=@{Table='events';Column='imageurl';PathPrefix='/images/';NewPrefix="$HiDrivePublicUrl/events/images/"} }
  'sermon-audio'  = @{ LocalPath='public/audio'; RemotePath="$HiDriveBasePath/sermons/audio"; TableUpdate=@{Table='sermons';Column='audiourl';PathPrefix='/audio/';NewPrefix="$HiDrivePublicUrl/sermons/audio/"} }
}

function Get-SizeMB($path) {
  if (!(Test-Path $path)) { return 0 }
  $bytes = (Get-ChildItem $path -File -Recurse | Measure-Object Length -Sum).Sum
  [Math]::Round(($bytes/1MB),2)
}

if ($Mode -eq 'dry-run') {
  $plan = @()
  $totalFiles = 0; $totalSize = 0
  foreach ($k in $FilesToMigrate.Keys) {
    $cfg = $FilesToMigrate[$k]
    if (Test-Path $cfg.LocalPath) {
      $files = Get-ChildItem $cfg.LocalPath -File -Recurse
      $fc = $files.Count
      $sz = Get-SizeMB $cfg.LocalPath
      $plan += [pscustomobject]@{ Name=$k; LocalPath=$cfg.LocalPath; RemotePath=$cfg.RemotePath; FileCount=$fc; SizeMB=$sz; RsyncCommand="rsync -avz --progress $($cfg.LocalPath)/ $HiDriveUser@rsync.hidrive.ionos.com:$($cfg.RemotePath)/" }
      $totalFiles += $fc; $totalSize += $sz
      Write-Host "Scan: $k -> $fc files, $sz MB"
    } else { Write-Host "Missing: $($cfg.LocalPath)" }
  }
  $plan | ConvertTo-Json -Depth 4 | Out-File migration-plan.json -Encoding UTF8
  Write-Host "Plan saved to migration-plan.json"
  Write-Host "Total: $totalFiles files, $totalSize MB"
  Write-Host "Next: run .\migrate-to-hidrive.ps1 -Mode upload"
}
elseif ($Mode -eq 'upload') {
  if (!(Test-Path migration-plan.json)) { Write-Host 'Run dry-run first.'; exit 1 }
  $plan = Get-Content migration-plan.json | ConvertFrom-Json
  Write-Host 'Upload commands (manual execution required on Windows):'
  foreach ($p in $plan) { Write-Host $p.RsyncCommand }
  Write-Host 'Use WinSCP/SFTP if rsync unavailable.'
  Write-Host 'After upload run: .\migrate-to-hidrive.ps1 -Mode update-db'
}
elseif ($Mode -eq 'update-db') {
  $sql = @()
  $sql += '-- HiDrive URL migration script'
  $sql += "-- Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
  foreach ($k in $FilesToMigrate.Keys) {
    $cfg = $FilesToMigrate[$k]
    if ($cfg.TableUpdate) {
      $t=$cfg.TableUpdate.Table; $c=$cfg.TableUpdate.Column; $o=$cfg.TableUpdate.PathPrefix; $n=$cfg.TableUpdate.NewPrefix
      $sql += "-- Update $t.$c"
      $sql += "UPDATE $t SET $c = REPLACE($c, '$o', '$n') WHERE $c LIKE '$o%';"
      $sql += "SELECT id,$c FROM $t WHERE $c LIKE '$n%' LIMIT 5;"
      $sql += ''
    }
  }
  $sql -join "`n" | Out-File hidrive-url-migration.sql -Encoding UTF8
  Write-Host 'SQL file created: hidrive-url-migration.sql'
  Write-Host 'Execute on server: psql -U myuser -d mychurch -f hidrive-url-migration.sql'
}
else {
  Write-Host 'Invalid mode. Use dry-run, upload, update-db.'
  exit 1
}

Write-Host 'Done.'
