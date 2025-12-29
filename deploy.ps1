# PowerShell Deployment Script for Windows
# Deploy MyChurch to Production Server

param(
    [string]$Server = "samanabyar.online",
    [string]$User = "your_ssh_user",  # Update this
    [string]$ProjectPath = "/var/www/mychurch"  # Update this
)

Write-Host "🚀 Starting deployment to $Server..." -ForegroundColor Cyan

# Step 1: Frontend is already built (dist folder exists)
Write-Host "`n📦 Frontend build ready in dist folder" -ForegroundColor Blue

# Step 2: Create deployment package
Write-Host "`n📦 Creating deployment package..." -ForegroundColor Blue
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$packageName = "mychurch_deploy_$timestamp.zip"

# Compress frontend dist
Compress-Archive -Path ".\frontend\dist\*" -DestinationPath ".\deploy_frontend.zip" -Force

# Compress backend (exclude node_modules and .env)
Get-ChildItem ".\backend" -Exclude "node_modules", ".env", ".git" -Recurse | 
Compress-Archive -DestinationPath ".\deploy_backend.zip" -Force

Write-Host "✅ Deployment packages created" -ForegroundColor Green

# Step 3: Upload using SCP (requires scp.exe or WinSCP)
Write-Host "`n📤 Upload packages to server..." -ForegroundColor Blue
Write-Host "Use one of these methods:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Method 1: Using WinSCP or FileZilla" -ForegroundColor White
Write-Host "  - Upload deploy_frontend.zip to $ProjectPath/frontend/" -ForegroundColor Gray
Write-Host "  - Upload deploy_backend.zip to $ProjectPath/backend/" -ForegroundColor Gray
Write-Host ""
Write-Host "Method 2: Using SCP command" -ForegroundColor White
Write-Host "  scp deploy_frontend.zip ${User}@${Server}:${ProjectPath}/frontend/" -ForegroundColor Gray
Write-Host "  scp deploy_backend.zip ${User}@${Server}:${ProjectPath}/backend/" -ForegroundColor Gray
Write-Host ""

# Step 4: Server commands
Write-Host "`n🔧 Run these commands on the server:" -ForegroundColor Blue
Write-Host @"
# SSH to server
ssh $User@$Server

# Navigate to project
cd $ProjectPath

# Extract frontend
cd frontend
unzip -o deploy_frontend.zip -d dist/
rm deploy_frontend.zip

# Extract backend
cd ../backend
unzip -o deploy_backend.zip
rm deploy_backend.zip

# Run migration
PGPASSWORD='MyChurch2024Secure!' psql -h localhost -p 5433 -U mychurch_user -d mychurch -c "
ALTER TABLE leaders 
ADD COLUMN IF NOT EXISTS bio JSONB DEFAULT '{\"fa\": \"\", \"en\": \"\"}'::jsonb,
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
"

# Restart backend
pm2 restart mychurch-backend

# Clear nginx cache
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx

echo "✅ Deployment complete!"
"@ -ForegroundColor Gray

Write-Host "`n✅ Deployment packages ready!" -ForegroundColor Green
Write-Host "📦 Files created:" -ForegroundColor Cyan
Write-Host "  - deploy_frontend.zip" -ForegroundColor White
Write-Host "  - deploy_backend.zip" -ForegroundColor White
