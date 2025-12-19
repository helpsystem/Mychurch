#!/bin/bash

# 🚀 Mychurch Deployment Script
# This script deploys the latest code to production server

echo "🚀 Starting Mychurch Deployment..."
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Step 1: Navigate to project directory
echo -e "\n${CYAN}📁 Step 1: Navigating to project directory...${NC}"
cd /root/Mychurch || { echo -e "${RED}❌ Failed to navigate to project directory${NC}"; exit 1; }
echo -e "${GREEN}✅ In project directory${NC}"

# Step 2: Pull latest code from GitHub
echo -e "\n${CYAN}📥 Step 2: Pulling latest code from GitHub...${NC}"
git pull origin main || { echo -e "${RED}❌ Failed to pull code${NC}"; exit 1; }
echo -e "${GREEN}✅ Code pulled successfully${NC}"

# Step 3: Install frontend dependencies
echo -e "\n${CYAN}📦 Step 3: Installing frontend dependencies...${NC}"
npm install || { echo -e "${RED}❌ Failed to install frontend dependencies${NC}"; exit 1; }
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

# Step 4: Install backend dependencies
echo -e "\n${CYAN}📦 Step 4: Installing backend dependencies...${NC}"
cd backend || { echo -e "${RED}❌ Failed to navigate to backend directory${NC}"; exit 1; }
npm install || { echo -e "${RED}❌ Failed to install backend dependencies${NC}"; exit 1; }
cd ..
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

# Step 5: Build frontend
echo -e "\n${CYAN}🔨 Step 5: Building frontend...${NC}"
npm run build || { echo -e "${RED}❌ Failed to build frontend${NC}"; exit 1; }
echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Step 6: Copy build to nginx directory
echo -e "\n${CYAN}📋 Step 6: Copying build to nginx...${NC}"
rm -rf /var/www/mychurch/*
cp -r dist/* /var/www/mychurch/ || { echo -e "${RED}❌ Failed to copy files${NC}"; exit 1; }
echo -e "${GREEN}✅ Files copied to nginx directory${NC}"

# Step 7: Check if backend is running
echo -e "\n${CYAN}🔍 Step 7: Checking backend status...${NC}"
if pm2 list | grep -q "mychurch-backend"; then
    echo -e "${YELLOW}⚠️  Backend is running, restarting...${NC}"
    pm2 restart mychurch-backend
    echo -e "${GREEN}✅ Backend restarted${NC}"
else
    echo -e "${YELLOW}⚠️  Backend not running, starting...${NC}"
    pm2 start backend/server.js --name mychurch-backend
    echo -e "${GREEN}✅ Backend started${NC}"
fi

# Step 8: Save PM2 configuration
echo -e "\n${CYAN}💾 Step 8: Saving PM2 configuration...${NC}"
pm2 save
echo -e "${GREEN}✅ PM2 configuration saved${NC}"

# Step 9: Show backend logs
echo -e "\n${CYAN}📊 Step 9: Backend Status:${NC}"
pm2 status

echo -e "\n${GREEN}=================================="
echo -e "🎉 Deployment completed successfully!"
echo -e "===================================${NC}"
echo -e "\n${CYAN}📝 Next Steps:${NC}"
echo -e "1. Visit: ${YELLOW}http://samanabyar.online${NC}"
echo -e "2. Test Bible page: ${YELLOW}http://samanabyar.online/bible${NC}"
echo -e "3. Check logs: ${YELLOW}pm2 logs mychurch-backend${NC}"
echo -e "\n${CYAN}🔒 To enable HTTPS:${NC}"
echo -e "${YELLOW}certbot --nginx -d samanabyar.online -d www.samanabyar.online${NC}"
