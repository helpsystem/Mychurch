#!/bin/bash

# 🚀 Deploy Church Website from Git
# This script pulls latest code from GitHub and deploys to production

set -e  # Exit on any error

echo "======================================"
echo "🚀 Starting Deployment from Git"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/root/Mychurch"
WEB_ROOT="/var/www/html"
BACKUP_DIR="/root/Mychurch/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}📦 Step 1: Backing up current production files...${NC}"
mkdir -p "$BACKUP_DIR"
if [ -f "$WEB_ROOT/index.html" ]; then
    tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C "$WEB_ROOT" . 2>/dev/null || echo "Backup created (with warnings)"
    echo -e "${GREEN}✅ Backup saved to: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz${NC}"
else
    echo "No previous deployment found, skipping backup"
fi

echo -e "${BLUE}📥 Step 2: Pulling latest code from GitHub...${NC}"
cd "$PROJECT_DIR"
git fetch origin main
git reset --hard origin/main
git pull origin main
echo -e "${GREEN}✅ Code updated from GitHub${NC}"

echo -e "${BLUE}📦 Step 3: Installing dependencies...${NC}"
npm install --production=false
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo -e "${BLUE}🔨 Step 4: Building production bundle...${NC}"
npm run build
if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ Build failed! index.html not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Production build completed${NC}"

echo -e "${BLUE}🗑️  Step 5: Cleaning old files from web root...${NC}"
# Remove old JS/CSS files but keep other assets
rm -f "$WEB_ROOT"/assets/index-*.js
rm -f "$WEB_ROOT"/assets/styles/index-*.css
echo -e "${GREEN}✅ Old build files removed${NC}"

echo -e "${BLUE}📤 Step 6: Deploying new files...${NC}"
# Copy index.html
cp -f dist/index.html "$WEB_ROOT/"

# Copy all assets
mkdir -p "$WEB_ROOT/assets"
mkdir -p "$WEB_ROOT/assets/styles"
cp -rf dist/assets/* "$WEB_ROOT/assets/"

# Copy other necessary files
if [ -d "dist/images" ]; then
    cp -rf dist/images "$WEB_ROOT/" 2>/dev/null || echo "Images already present"
fi

if [ -d "dist/worship" ]; then
    cp -rf dist/worship "$WEB_ROOT/" 2>/dev/null || echo "Worship data already present"
fi

echo -e "${GREEN}✅ Files deployed to $WEB_ROOT${NC}"

echo -e "${BLUE}🔐 Step 7: Setting correct permissions...${NC}"
chown -R www-data:www-data "$WEB_ROOT"
chmod -R 755 "$WEB_ROOT"
echo -e "${GREEN}✅ Permissions set${NC}"

echo -e "${BLUE}🔄 Step 8: Restarting backend service...${NC}"
pm2 restart mychurch-backend || echo "Backend restart skipped (not running)"
echo -e "${GREEN}✅ Backend restarted${NC}"

echo ""
echo "======================================"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "📊 Deployment Summary:"
echo "  - Source: GitHub (origin/main)"
echo "  - Build hash: $(grep -o 'index-[^"]*\.js' "$WEB_ROOT/index.html" | head -1)"
echo "  - Backup: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
echo "  - Web root: $WEB_ROOT"
echo ""
echo -e "${BLUE}🌐 Site: https://samanabyar.online${NC}"
echo ""
echo -e "${GREEN}🎉 Done! Clear browser cache (Ctrl+Shift+R) to see changes${NC}"
