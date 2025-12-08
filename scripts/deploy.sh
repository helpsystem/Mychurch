#!/bin/bash

# Deploy Script for Mychurch Project
# Usage: ./deploy.sh

echo "🚀 Starting deployment process..."

# 1. Navigate to project directory
cd /root/Mychurch || { echo "❌ Project directory not found"; exit 1; }

# 2. Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main || { echo "❌ Git pull failed"; exit 1; }

# 3. Install dependencies
echo "📦 Installing root dependencies..."
npm install || { echo "❌ Root npm install failed"; exit 1; }

echo "📦 Installing backend dependencies..."
cd backend || { echo "❌ Backend directory not found"; exit 1; }
npm install || { echo "❌ Backend npm install failed"; exit 1; }
cd ..

# 4. Build frontend
echo "🏗️ Building frontend..."
npm run build || { echo "❌ Frontend build failed"; exit 1; }

# 5. Update Nginx files
echo "🔄 Updating Nginx files..."
# Ensure target directory exists
mkdir -p /var/www/html
# Clear old files (optional, be careful)
# rm -rf /var/www/html/*
# Copy new build
cp -r dist/* /var/www/html/ || { echo "❌ Failed to copy build files"; exit 1; }

# 6. Restart Backend
echo "🔄 Restarting backend service..."
cd backend
pm2 restart church-api || pm2 start server.js --name church-api
cd ..

# 7. Health Check
echo "🏥 Performing health check..."
sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)

if [ "$HTTP_STATUS" == "200" ]; then
  echo "✅ Deployment successful! API is healthy."
else
  echo "⚠️ Deployment finished but API health check returned $HTTP_STATUS. Check logs."
fi

echo "🎉 Done!"
