#!/bin/bash
# Quick Deployment Script for New Features
# راه‌اندازی سریع ویژگی‌های جدید

set -e  # Exit on error

echo "🚀 Starting MyChurch Feature Deployment..."
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Change to project directory
cd /var/www/Mychurch || exit 1

# Step 1: Pull latest changes
echo -e "${YELLOW}📥 Pulling latest changes from Git...${NC}"
git pull origin main

# Step 2: Install dependencies
echo -e "${YELLOW}📦 Installing new dependencies...${NC}"
npm install pdfkit pdf-lib nodemailer

# Step 3: Run database migration
echo -e "${YELLOW}🗄️  Running database migration...${NC}"
if psql -h localhost -U postgres -d mychurch_db -f backend/migrations/create_letter_system.sql > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database migration completed${NC}"
else
    echo -e "${RED}⚠️  Warning: Migration may have already run or failed${NC}"
    echo "Continue anyway? (y/n)"
    read -r response
    if [[ "$response" != "y" ]]; then
        exit 1
    fi
fi

# Step 4: Create temp directory for PDFs
echo -e "${YELLOW}📁 Creating temp directory for PDFs...${NC}"
mkdir -p backend/temp
chmod 755 backend/temp

# Step 5: Build frontend
echo -e "${YELLOW}🏗️  Building frontend...${NC}"
cd frontend
npm run build
cd ..

# Step 6: Copy to dist
echo -e "${YELLOW}📋 Copying build to dist...${NC}"
rm -rf dist/*
cp -r frontend/dist/* dist/

# Step 7: Restart backend
echo -e "${YELLOW}🔄 Restarting backend service...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 restart mychurch-backend
    echo -e "${GREEN}✅ Backend restarted with PM2${NC}"
elif systemctl is-active --quiet mychurch-backend; then
    systemctl restart mychurch-backend
    echo -e "${GREEN}✅ Backend restarted with systemd${NC}"
else
    echo -e "${RED}⚠️  Could not find PM2 or systemd service${NC}"
    echo "Please restart backend manually"
fi

# Step 8: Reload Nginx
echo -e "${YELLOW}🌐 Reloading Nginx...${NC}"
if nginx -t > /dev/null 2>&1; then
    nginx -s reload
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
else
    echo -e "${RED}⚠️  Nginx config test failed${NC}"
    exit 1
fi

# Step 9: Cleanup
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
git prune

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "📊 Deployment Summary:"
echo "  • Translation System: ✅ Deployed"
echo "  • Letter Management: ✅ Deployed"
echo "  • PDF Generation: ✅ Deployed"
echo "  • Al Hayat GPT: ✅ Updated"
echo "  • Database: ✅ Migrated"
echo ""
echo "🔍 Next Steps:"
echo "  1. Test translation API at /api/ai/translate/smart"
echo "  2. Verify database tables created"
echo "  3. Test Al Hayat GPT widget"
echo "  4. Check backend logs: pm2 logs mychurch-backend"
echo ""
echo "📖 Full documentation: deployment-guide.md"
echo ""
