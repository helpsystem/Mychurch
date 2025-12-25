# Run Admin Features Migration Script
# Purpose: Creates missing database tables for admin panel features

Write-Host "Running Admin Features Migration..." -ForegroundColor Cyan
Write-Host ""

# Check if PSQL is available
$psql = $null

# Try common PostgreSQL paths
$psqlPaths = @(
    "psql",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe"
)

foreach ($path in $psqlPaths) {
    try {
        $null = & $path --version 2>$null
        $psql = $path
        break
    } catch {
        continue
    }
}

if (-not $psql) {
    Write-Host "PSQL not found in PATH. Using Node.js to run migration..." -ForegroundColor Yellow
    
    # Load env file and set environment variables for Node.js
    $envPath = ".env"
    if (Test-Path $envPath) {
        Get-Content $envPath | ForEach-Object {
            if ($_ -match '^([^=#]+)=(.*)$') {
                $key = $Matches[1].Trim()
                $value = $Matches[2].Trim()
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
        Write-Host "Loaded environment from .env" -ForegroundColor Cyan
    }
    
    Write-Host "Running migration via Node.js..." -ForegroundColor Cyan
    node run-admin-migration.cjs
    exit $LASTEXITCODE
}

# If PSQL is available, try to read connection info from .env
Write-Host "Reading database connection from environment..." -ForegroundColor Cyan

$envPath = ".env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^=]+)=(.+)$') {
            [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], "Process")
        }
    }
}

$DB_HOST = $env:SUPABASE_HOST
$DB_PORT = if ($env:SUPABASE_PORT) { $env:SUPABASE_PORT } else { "5432" }
$DB_USER = $env:SUPABASE_USER
$DB_PASS = $env:SUPABASE_PASSWORD
$DB_NAME = $env:SUPABASE_DATABASE

if (-not $DB_HOST -or -not $DB_USER -or -not $DB_NAME) {
    Write-Host "Database credentials not found in .env file" -ForegroundColor Yellow
    Write-Host "Please enter database connection details:" -ForegroundColor Cyan
    
    $DB_HOST = Read-Host "Database Host"
    $DB_PORT = Read-Host "Database Port (default: 5432)"
    if (-not $DB_PORT) { $DB_PORT = "5432" }
    $DB_USER = Read-Host "Database User"
    $DB_NAME = Read-Host "Database Name"
    $DB_PASS = Read-Host "Database Password" -AsSecureString
    $DB_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASS))
}

Write-Host ""
Write-Host "Connecting to database: ${DB_HOST}:${DB_PORT}/${DB_NAME}" -ForegroundColor Cyan

$env:PGPASSWORD = $DB_PASS
$migrationFile = "backend\migrations\admin-features-fix.sql"

& $psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $migrationFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Created/Updated tables:" -ForegroundColor Cyan
    Write-Host "  - communications" -ForegroundColor White
    Write-Host "  - settings" -ForegroundColor White
    Write-Host "  - message_logs" -ForegroundColor White
    Write-Host "  - church_announcements" -ForegroundColor White
    Write-Host "  - testimonials (status columns)" -ForegroundColor White
    Write-Host "  - users (last_login column)" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Migration failed. Check the error above." -ForegroundColor Red
}

$env:PGPASSWORD = $null
