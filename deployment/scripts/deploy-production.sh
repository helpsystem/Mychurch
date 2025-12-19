#!/bin/bash

# ════════════════════════════════════════════════════════════════
# Quick Deploy Script for MyChurch Production
# ════════════════════════════════════════════════════════════════

echo "🚀 Starting MyChurch Deployment..."
echo ""

# Variables
REPO_URL="https://github.com/helpsystem/Mychurch.git"
DEPLOY_DIR="/var/www/mychurch"
DOMAIN="samanabyar.online"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ════════════════════════════════════════════════════════════════
# Step 1: Clone Repository
# ════════════════════════════════════════════════════════════════

echo -e "${CYAN}📦 Step 1: Cloning repository...${NC}"

if [ -d "$DEPLOY_DIR" ]; then
    echo "Directory exists. Pulling latest changes..."
    cd $DEPLOY_DIR
    git pull origin main
else
    echo "Cloning repository..."
    git clone $REPO_URL $DEPLOY_DIR
    cd $DEPLOY_DIR
fi

echo -e "${GREEN}✅ Repository cloned/updated${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 2: Setup Environment
# ════════════════════════════════════════════════════════════════

echo -e "${CYAN}⚙️  Step 2: Setting up environment...${NC}"

if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env with your production values!${NC}"
    echo "Run: nano .env"
    read -p "Press Enter after editing .env..."
else
    echo ".env file already exists"
fi

echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 3: Install Dependencies
# ════════════════════════════════════════════════════════════════

echo -e "${CYAN}📦 Step 3: Installing dependencies...${NC}"

# Frontend
echo "Installing frontend dependencies..."
npm install

# Backend
echo "Installing backend dependencies..."
cd backend
npm install --production
cd ..

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 4: Build Frontend
# ════════════════════════════════════════════════════════════════

echo -e "${CYAN}🔨 Step 4: Building frontend...${NC}"

npm run build

echo -e "${GREEN}✅ Frontend built successfully${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 5: Setup PM2
# ════════════════════════════════════════════════════════════════

echo -e "${CYAN}🔄 Step 5: Setting up PM2...${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Stop existing process if running
pm2 stop mychurch-api 2>/dev/null || true
pm2 delete mychurch-api 2>/dev/null || true

# Start backend with PM2
cd backend
pm2 start dev-server.js --name mychurch-api
pm2 save

# Setup PM2 startup
pm2 startup

echo -e "${GREEN}✅ PM2 configured${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
# Step 6: Configure Nginx
# ════════════════════════════════════════════════════════════════

echo -e "${CYAN}🌐 Step 6: Configuring Nginx...${NC}"

NGINX_CONFIG="/etc/nginx/sites-available/mychurch"

# Create Nginx config if it doesn't exist
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "Creating Nginx configuration..."
    
    sudo tee $NGINX_CONFIG > /dev/null <<EOF
# MyChurch Frontend
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root $DEPLOY_DIR/dist;
    index index.html;

    # Frontend routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Generated images
    location /generated-images/ {
        alias $DEPLOY_DIR/backend/public/generated-images/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_comp_level 6;
}
EOF

    # Enable site
    sudo ln -s $NGINX_CONFIG /etc/nginx/sites-enabled/
    
    # Test and reload Nginx
    sudo nginx -t
    sudo systemctl reload nginx
    
    echo -e "${GREEN}✅ Nginx configured${NC}"
else
    echo "Nginx config already exists"
    sudo nginx -t
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
# Step 7: Setup SSL
# ════════════════════════════════════════════════════════════════

echo -e "${CYAN}🔐 Step 7: Setting up SSL...${NC}"

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Check if certificate already exists
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "Obtaining SSL certificate..."
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    echo -e "${GREEN}✅ SSL certificate obtained${NC}"
else
    echo "SSL certificate already exists"
    echo -e "${GREEN}✅ SSL already configured${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
# Step 8: Setup Cron for Image Generation
# ════════════════════════════════════════════════════════════════

echo -e "${CYAN}⏰ Step 8: Setting up cron job for images...${NC}"

# Add cron job for weekly image updates (every Sunday at 3 AM)
CRON_JOB="0 3 * * 0 curl -X POST https://$DOMAIN/api/images/generate"

# Check if cron job already exists
if ! crontab -l 2>/dev/null | grep -q "images/generate"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✅ Cron job added for weekly image updates${NC}"
else
    echo "Cron job already exists"
    echo -e "${GREEN}✅ Cron job configured${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
# Final Tests
# ════════════════════════════════════════════════════════════════

echo -e "${CYAN}🧪 Running tests...${NC}"

# Test backend
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend test failed. Check PM2 logs: pm2 logs mychurch-api${NC}"
fi

# Test frontend
if curl -s https://$DOMAIN > /dev/null; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend test failed. Check Nginx logs${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
# Deployment Summary
# ════════════════════════════════════════════════════════════════

echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""
echo -e "${CYAN}🌐 Your website is live at:${NC}"
echo -e "   Frontend: https://$DOMAIN"
echo -e "   Backend:  https://$DOMAIN/api"
echo -e "   Images:   https://$DOMAIN/generated-images"
echo ""
echo -e "${CYAN}📊 Useful Commands:${NC}"
echo "   PM2 Status:   pm2 status"
echo "   PM2 Logs:     pm2 logs mychurch-api"
echo "   PM2 Restart:  pm2 restart mychurch-api"
echo "   Nginx Test:   sudo nginx -t"
echo "   Nginx Reload: sudo systemctl reload nginx"
echo ""
echo -e "${CYAN}🔍 Quick Tests:${NC}"
echo "   curl https://$DOMAIN/api/health"
echo "   curl https://$DOMAIN/api/bible/books"
echo "   curl 'https://$DOMAIN/api/ai-chat/daily-verse?language=fa'"
echo "   curl https://$DOMAIN/api/images/status"
echo ""
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ All done! Your church website is ready! 🙏${NC}"
echo "════════════════════════════════════════════════════════════"
