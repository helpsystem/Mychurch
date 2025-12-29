#!/bin/bash
# Deployment Script for MyChurch Website
# Run this script to deploy frontend and backend to production

echo "🚀 Starting deployment to samanabyar.online..."

# Configuration
SERVER="samanabyar.online"
USER="your_ssh_user"  # Update this
PROJECT_PATH="/var/www/mychurch"  # Update this path
FRONTEND_DIST="./frontend/dist"
BACKEND_SRC="./backend"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Step 1: Building Frontend...${NC}"
cd frontend
npm run build
cd ..

echo -e "${BLUE}📤 Step 2: Uploading Frontend to Server...${NC}"
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  $FRONTEND_DIST/ $USER@$SERVER:$PROJECT_PATH/frontend/dist/

echo -e "${BLUE}📤 Step 3: Uploading Backend Changes...${NC}"
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude '.git' \
  $BACKEND_SRC/ $USER@$SERVER:$PROJECT_PATH/backend/

echo -e "${BLUE}🔧 Step 4: Running Migration on Server...${NC}"
ssh $USER@$SERVER << 'ENDSSH'
  cd $PROJECT_PATH/backend
  
  # Run migration
  PGPASSWORD='MyChurch2024Secure!' psql -h localhost -p 5433 -U mychurch_user -d mychurch -c "
    ALTER TABLE leaders 
    ADD COLUMN IF NOT EXISTS bio JSONB DEFAULT '{\"fa\": \"\", \"en\": \"\"}'::jsonb,
    ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
  "
  
  echo "✅ Migration completed"
ENDSSH

echo -e "${BLUE}🔄 Step 5: Restarting Backend Service...${NC}"
ssh $USER@$SERVER << 'ENDSSH'
  # Restart PM2 process or systemd service
  pm2 restart mychurch-backend || systemctl restart mychurch-backend
  
  echo "✅ Backend restarted"
ENDSSH

echo -e "${BLUE}🌐 Step 6: Clearing Nginx Cache (if applicable)...${NC}"
ssh $USER@$SERVER << 'ENDSSH'
  # Clear nginx cache
  sudo rm -rf /var/cache/nginx/*
  sudo systemctl reload nginx
  
  echo "✅ Nginx cache cleared"
ENDSSH

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${YELLOW}🔍 Please verify:${NC}"
echo "  - Visit https://samanabyar.online"
echo "  - Test /api/leaders endpoint"
echo "  - Test PWA update on mobile"
echo "  - Clear browser cache if needed (Ctrl+Shift+R)"
