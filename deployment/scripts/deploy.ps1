# 🚀 PowerShell Deployment Script
# This script commits changes, pushes to GitHub, and triggers deployment on server

param(
    [string]$CommitMessage = "Update: Deploy latest changes"
)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🚀 Church Website Deployment Pipeline" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check git status
Write-Host "📊 Step 1: Checking git status..." -ForegroundColor Blue
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "✅ Changes detected:" -ForegroundColor Green
    git status --short
} else {
    Write-Host "⚠️  No changes to commit" -ForegroundColor Yellow
    Write-Host "Proceeding with deployment anyway..." -ForegroundColor Yellow
}

# Step 2: Stage changes (ignore submodule)
Write-Host ""
Write-Host "📦 Step 2: Staging changes..." -ForegroundColor Blue
git add pages/ components/ lib/ backend/ public/ -A
git add package.json package-lock.json vite.config.ts tsconfig.json
git add deploy-from-git.sh deploy.ps1
Write-Host "✅ Changes staged" -ForegroundColor Green

# Step 3: Commit
Write-Host ""
Write-Host "💾 Step 3: Committing changes..." -ForegroundColor Blue
try {
    git commit -m $CommitMessage
    Write-Host "✅ Changes committed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Nothing to commit (already committed)" -ForegroundColor Yellow
}

# Step 4: Push to GitHub
Write-Host ""
Write-Host "📤 Step 4: Pushing to GitHub..." -ForegroundColor Blue
try {
    git push origin main
    Write-Host "✅ Code pushed to GitHub" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Deploy on server
Write-Host ""
Write-Host "🚀 Step 5: Deploying on server..." -ForegroundColor Blue
Write-Host "Uploading deployment script..." -ForegroundColor Gray

scp deploy-from-git.sh root@samanabyar.online:/root/Mychurch/

Write-Host "Executing deployment on server..." -ForegroundColor Gray
ssh root@samanabyar.online "cd /root/Mychurch && chmod +x deploy-from-git.sh && ./deploy-from-git.sh"

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Site: https://samanabyar.online" -ForegroundColor Cyan
Write-Host "🔄 Remember to clear browser cache (Ctrl+Shift+R)" -ForegroundColor Yellow
Write-Host ""
