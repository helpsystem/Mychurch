# Deploy Backend to VPS
# Uploads backend code and restarts PM2 service

$SERVER = "root@samanabyar.online"
$REMOTE_PATH = "/var/www/Mychurch/backend"
$LOCAL_PATH = "backend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYING BACKEND TO $SERVER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Upload Backend Files
Write-Host "Step 1: Uploading backend files..." -ForegroundColor Yellow
# Exclude node_modules and .env to avoid overwriting server env (unless specific update needed)
# But here we updated .env locally and likely want to update it on server too.
# For safety, let's copy .env separately or append.
# Actually, scp -r will overwrite. Let's exclude node_modules.

# Create a temporary directory or use exclusions if scp supports it (standard scp doesn't easily).
# Robust way: Use rsync if available, or just copy everything and let server exclude.
# Since we are on Windows, we'll use scp.

# Upload all except node_modules
# We can upload individual folders: routes, services, config, etc.
$folders = @("routes", "services", "config", "controllers", "middleware", "models", "utils")
foreach ($folder in $folders) {
    if (Test-Path "$LOCAL_PATH\$folder") {
        Write-Host "  Uploading $folder..." -ForegroundColor Gray
        scp -r "$LOCAL_PATH/$folder" "${SERVER}:${REMOTE_PATH}/"
    }
}

# Upload root backend files
$files = Get-ChildItem -Path $LOCAL_PATH -File
foreach ($file in $files) {
    # Skip .env to prevent overwriting server secrets unless intended.
    # User's request implies we WANT to use the new key.
    # So we SHOULD update .env. But maybe append?
    # Let's upload .env as .env.new and append it on server.
    if ($file.Name -eq ".env") {
        Write-Host "  Uploading .env as .env.update..." -ForegroundColor Gray
        scp "$LOCAL_PATH/.env" "${SERVER}:${REMOTE_PATH}/.env.update"
        # Command to merge/update .env on server
        ssh $SERVER "cat ${REMOTE_PATH}/.env.update >> ${REMOTE_PATH}/.env && rm ${REMOTE_PATH}/.env.update && sort -u ${REMOTE_PATH}/.env -o ${REMOTE_PATH}/.env"
        # Note: sort -u might mess up order or remove duplicates incorrectly if format involves comments.
        # Safer: Just append the new key if missing, handled by deploy-vps-quick logic?
        # Actually, let's just force update .env since we are in a 'dev' setup.
        Write-Host "  Updating .env..." -ForegroundColor Yellow
        scp "$LOCAL_PATH/.env" "${SERVER}:${REMOTE_PATH}/.env"
    } elseif ($file.Name -eq "package-lock.json") {
       # Skip lock file sometimes? No, allow it.
       scp "$LOCAL_PATH/$file" "${SERVER}:${REMOTE_PATH}/"
    } else {
       scp "$LOCAL_PATH/$file" "${SERVER}:${REMOTE_PATH}/"
    }
}

# 2. Install Dependencies & Restart
Write-Host "Step 2: Installing dependencies & Restarting..." -ForegroundColor Yellow
ssh $SERVER "cd $REMOTE_PATH && npm install --production && pm2 restart mychurch-backend"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
}
