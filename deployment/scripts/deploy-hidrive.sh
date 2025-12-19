#!/bin/bash
# Deploy HiDrive Storage Integration to Production Server

set -e  # Exit on error

SERVER="root@samanabyar.online"
BACKEND_DIR="/root/Mychurch/backend"

echo "============================================"
echo "   HiDrive Storage - Production Deployment"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Upload HiDrive service${NC}"
scp backend/services/hidriveStorage.js $SERVER:$BACKEND_DIR/services/
echo -e "${GREEN}✓ hidriveStorage.js uploaded${NC}"
echo ""

echo -e "${YELLOW}Step 2: Upload HiDrive routes${NC}"
scp backend/routes/hidriveRoutes.js $SERVER:$BACKEND_DIR/routes/
echo -e "${GREEN}✓ hidriveRoutes.js uploaded${NC}"
echo ""

echo -e "${YELLOW}Step 3: Upload updated server.js${NC}"
scp backend/server.js $SERVER:$BACKEND_DIR/
echo -e "${GREEN}✓ server.js uploaded${NC}"
echo ""

echo -e "${YELLOW}Step 4: Install npm dependencies${NC}"
ssh $SERVER "cd $BACKEND_DIR && npm install ssh2-sftp-client"
echo -e "${GREEN}✓ ssh2-sftp-client installed${NC}"
echo ""

echo -e "${YELLOW}Step 5: Check .env configuration${NC}"
echo "Please manually add HiDrive credentials to $BACKEND_DIR/.env:"
echo "  HIDRIVE_HOST=sftp.hidrive.ionos.com"
echo "  HIDRIVE_PORT=22"
echo "  HIDRIVE_USER=adminchurch"
echo "  HIDRIVE_PASSWORD=your_password"
echo "  HIDRIVE_BASE_PATH=/users/adminchurch/mychurch"
echo "  HIDRIVE_PUBLIC_URL=https://webdav.hidrive.ionos.com/users/adminchurch/mychurch"
echo ""
echo "Press Enter to continue after updating .env..."
read

echo -e "${YELLOW}Step 6: Restart backend service${NC}"
ssh $SERVER "pm2 restart mychurch-backend"
echo -e "${GREEN}✓ Backend restarted${NC}"
echo ""

echo -e "${YELLOW}Step 7: Check logs${NC}"
ssh $SERVER "pm2 logs mychurch-backend --lines 20 --nostream"
echo ""

echo -e "${YELLOW}Step 8: Test HiDrive connection${NC}"
echo "Testing /api/hidrive/stats endpoint..."
sleep 3
curl -s https://samanabyar.online/api/hidrive/stats -H "Authorization: Bearer YOUR_TOKEN" || echo "Note: Authentication required"
echo ""

echo "============================================"
echo -e "${GREEN}✓ Deployment completed!${NC}"
echo "============================================"
echo ""
echo "Next Steps:"
echo "1. Upload files to HiDrive (see HIDRIVE_QUICK_START.md)"
echo "2. Update database URLs (SQL scripts in guide)"
echo "3. Test file access on website"
echo ""
echo "API Endpoints Available:"
echo "  POST /api/hidrive/upload"
echo "  POST /api/hidrive/migrate"
echo "  POST /api/hidrive/batch-migrate"
echo "  GET  /api/hidrive/stats"
echo "  GET  /api/hidrive/proxy/:category/:filename"
echo ""
