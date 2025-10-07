#!/bin/bash

# Quick Server Setup Commands for Church Management System
# Run these commands on your server (samanabyar.online)

echo "🚀 Church Management System - Server Setup Commands"
echo "=================================================="

echo ""
echo "📋 STEP 1: Connect to your server"
echo "ssh root@samanabyar.online"

echo ""
echo "📋 STEP 2: Navigate to project directory"
echo "cd /root/Mychurch"

echo ""
echo "📋 STEP 3: Pull latest changes"
echo "git pull origin main"

echo ""
echo "📋 STEP 4: Make setup script executable"
echo "chmod +x scripts/setup-server-postgres.sh"

echo ""
echo "📋 STEP 5: Run the complete setup script"
echo "./scripts/setup-server-postgres.sh"

echo ""
echo "📋 STEP 6: Start the production environment"
echo "docker-compose down"
echo "docker-compose up -d"

echo ""
echo "📋 STEP 7: Check logs and verify"
echo "docker-compose logs -f backend"
echo "curl http://localhost:3001/api/bible/books"

echo ""
echo "📋 STEP 8: Test the website"
echo "curl https://samanabyar.online/api/health"

echo ""
echo "🎉 Done! Your Church Management System should be running!"
echo ""
echo "📊 Monitoring:"
echo "- Backend logs: docker-compose logs -f backend"
echo "- Frontend logs: docker-compose logs -f frontend" 
echo "- All services: docker-compose ps"
echo ""
echo "🔗 Access your site: https://samanabyar.online"
