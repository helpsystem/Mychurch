#!/bin/bash

# 🚀 Complete Deployment Script for samanabyar.online
# Run this on your server as: bash deploy-server-manual.sh

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "    🚀 Iranian Church DC - Server Deployment"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$HOME/Mychurch"
PRODUCTION_DIR="/var/www/html/Mychurch"
APP_NAME="mychurch-backend"

echo -e "${CYAN}📋 Configuration:${NC}"
echo "   Project Directory: $PROJECT_DIR"
echo "   Production Directory: $PRODUCTION_DIR"
echo "   App Name: $APP_NAME"
echo ""

# Step 1: Navigate to project
echo -e "${YELLOW}▶ Step 1: Navigate to project directory${NC}"
cd "$PROJECT_DIR" || { echo -e "${RED}❌ Project directory not found!${NC}"; exit 1; }
echo -e "${GREEN}✅ In project directory: $(pwd)${NC}"
echo ""

# Step 2: Backup current state
echo -e "${YELLOW}▶ Step 2: Backup current state${NC}"
git stash
echo -e "${GREEN}✅ Current changes backed up${NC}"
echo ""

# Step 3: Pull latest code
echo -e "${YELLOW}▶ Step 3: Pull latest code from GitHub${NC}"
git pull origin main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code updated successfully${NC}"
else
    echo -e "${RED}❌ Git pull failed!${NC}"
    echo "   Trying to fix..."
    git fetch origin
    git reset --hard origin/main
fi
echo ""

# Step 4: Install dependencies
echo -e "${YELLOW}▶ Step 4: Install dependencies${NC}"
echo "   Installing root dependencies..."
npm install --production
echo "   Installing backend dependencies..."
cd backend && npm install --production && cd ..
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 5: Build frontend
echo -e "${YELLOW}▶ Step 5: Build production frontend${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"
    echo "   Build size: $(du -sh dist/ | cut -f1)"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
echo ""

# Step 6: Deploy to production directory
echo -e "${YELLOW}▶ Step 6: Deploy to production directory${NC}"
if [ -d "$PRODUCTION_DIR" ]; then
    echo "   Backing up old version..."
    sudo mv "$PRODUCTION_DIR" "${PRODUCTION_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
fi
echo "   Creating production directory..."
sudo mkdir -p "$PRODUCTION_DIR"
echo "   Copying build files..."
sudo cp -r dist/* "$PRODUCTION_DIR/"
sudo chown -R www-data:www-data "$PRODUCTION_DIR"
echo -e "${GREEN}✅ Frontend deployed to $PRODUCTION_DIR${NC}"
echo ""

# Step 7: Check if PM2 is installed
echo -e "${YELLOW}▶ Step 7: Check PM2 process manager${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "   PM2 not found. Installing..."
    sudo npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
else
    echo -e "${GREEN}✅ PM2 already installed (version $(pm2 -v))${NC}"
fi
echo ""

# Step 8: Setup environment variables
echo -e "${YELLOW}▶ Step 8: Setup environment variables${NC}"
if [ ! -f "backend/.env" ]; then
    echo "   Creating backend/.env from root .env..."
    cp .env backend/.env
    echo -e "${GREEN}✅ Environment file created${NC}"
else
    echo -e "${GREEN}✅ Environment file exists${NC}"
fi
echo ""

# Step 9: Start/Restart backend
echo -e "${YELLOW}▶ Step 9: Start/Restart backend server${NC}"
cd backend
if pm2 list | grep -q "$APP_NAME"; then
    echo "   Restarting existing backend..."
    pm2 restart "$APP_NAME"
else
    echo "   Starting new backend..."
    pm2 start server.js --name "$APP_NAME" --node-args="--max-old-space-size=512"
fi
pm2 save
echo -e "${GREEN}✅ Backend server running${NC}"
cd ..
echo ""

# Step 10: Setup PM2 startup
echo -e "${YELLOW}▶ Step 10: Setup PM2 to start on boot${NC}"
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
echo -e "${GREEN}✅ PM2 startup configured${NC}"
echo ""

# Step 11: Configure Nginx (if installed)
echo -e "${YELLOW}▶ Step 11: Configure Nginx${NC}"
if command -v nginx &> /dev/null; then
    NGINX_CONF="/etc/nginx/sites-available/mychurch"
    
    echo "   Creating Nginx configuration..."
    sudo tee "$NGINX_CONF" > /dev/null <<'EOF'
server {
    listen 80;
    server_name samanabyar.online www.samanabyar.online;
    
    root /var/www/html/Mychurch;
    index index.html;
    
    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Enable site
    sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
    
    # Test configuration
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        echo "   Reloading Nginx..."
        sudo systemctl reload nginx
        echo -e "${GREEN}✅ Nginx configured and reloaded${NC}"
    else
        echo -e "${RED}⚠️  Nginx configuration has errors${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Nginx not installed (optional)${NC}"
fi
echo ""

# Step 12: Show status
echo -e "${YELLOW}▶ Step 12: Deployment status${NC}"
echo ""
echo -e "${CYAN}📊 Backend Status:${NC}"
pm2 status "$APP_NAME"
echo ""
echo -e "${CYAN}📊 Recent Logs:${NC}"
pm2 logs "$APP_NAME" --lines 10 --nostream
echo ""

# Step 13: Health check
echo -e "${YELLOW}▶ Step 13: Health check${NC}"
sleep 3
HEALTH_CHECK=$(curl -s http://localhost:3001/api/health || echo "failed")
if [[ "$HEALTH_CHECK" == *"ok"* ]] || [[ "$HEALTH_CHECK" == *"healthy"* ]]; then
    echo -e "${GREEN}✅ Backend is healthy!${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check: $HEALTH_CHECK${NC}"
fi
echo ""

# Final summary
echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "    ${GREEN}🎉 DEPLOYMENT COMPLETED!${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "${CYAN}🌐 Your website URLs:${NC}"
echo "   Frontend: http://samanabyar.online"
echo "   Backend API: http://samanabyar.online/api"
echo ""
echo -e "${CYAN}📝 Useful commands:${NC}"
echo "   View logs: pm2 logs $APP_NAME"
echo "   Stop server: pm2 stop $APP_NAME"
echo "   Restart server: pm2 restart $APP_NAME"
echo "   Server status: pm2 status"
echo ""
echo -e "${GREEN}✅ All done! Your church website is now live!${NC}"
echo ""
