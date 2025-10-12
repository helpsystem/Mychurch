#!/bin/bash

# 🚀 Mychurch Deployment Script
# This script deploys the website to production server

set -e  # Exit on error

echo "🔄 Starting deployment..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/root/Mychurch"
WEB_DIR="/var/www/mychurch"
BACKEND_NAME="mychurch-backend"

# Step 1: Navigate to project directory
echo -e "${YELLOW}📁 Navigating to project directory...${NC}"
cd $PROJECT_DIR

# Step 2: Pull latest changes from Git
echo -e "${YELLOW}⬇️  Pulling latest code from GitHub...${NC}"
git pull origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Git pull successful${NC}"
else
    echo -e "${RED}❌ Git pull failed${NC}"
    exit 1
fi

# Step 3: Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
npm install

# Step 4: Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
npm install
cd ..

# Step 5: Build frontend
echo -e "${YELLOW}🔨 Building frontend...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 6: Backup old files (optional)
echo -e "${YELLOW}💾 Creating backup of old files...${NC}"
if [ -d "$WEB_DIR" ] && [ "$(ls -A $WEB_DIR)" ]; then
    BACKUP_DIR="/var/backups/mychurch/backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p $BACKUP_DIR
    cp -r $WEB_DIR/* $BACKUP_DIR/
    echo -e "${GREEN}✅ Backup created at $BACKUP_DIR${NC}"
fi

# Step 7: Clear web directory
echo -e "${YELLOW}🗑️  Clearing web directory...${NC}"
rm -rf $WEB_DIR/*

# Step 8: Copy built files to web directory
echo -e "${YELLOW}📋 Copying new files to web directory...${NC}"
cp -r dist/* $WEB_DIR/

# Step 9: Set proper permissions
echo -e "${YELLOW}🔐 Setting permissions...${NC}"
chown -R www-data:www-data $WEB_DIR
chmod -R 755 $WEB_DIR

# Step 10: Restart backend service
echo -e "${YELLOW}🔄 Restarting backend service...${NC}"
pm2 restart $BACKEND_NAME

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend restarted${NC}"
else
    echo -e "${RED}❌ Backend restart failed${NC}"
    exit 1
fi

# Step 11: Save PM2 configuration
echo -e "${YELLOW}💾 Saving PM2 configuration...${NC}"
pm2 save

# Step 12: Show PM2 status
echo -e "${YELLOW}📊 Current PM2 status:${NC}"
pm2 status

echo ""
echo "================================"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "================================"
echo ""
echo "📍 Website URL: http://your-domain.com"
echo "📍 Backend URL: http://your-domain.com:3001"
echo ""
echo "📝 Next steps:"
echo "  1. Check website: http://your-domain.com"
echo "  2. Check backend health: http://your-domain.com:3001/api/health"
echo "  3. Add leaders to database: cd backend && node scripts/add-leaders.js"
echo ""
