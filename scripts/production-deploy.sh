#!/bin/bash
# production-deploy.sh - Complete production deployment script

echo "🚀 Starting Iran Church DC Production Deployment..."
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create production environment file
echo "📝 Creating production environment..."
cat > .env.production << EOF
# Production Environment
NODE_ENV=production
DOMAIN=samanabyar.online
SSL_EMAIL=admin@samanabyar.online

# Database Configuration
POSTGRES_PASSWORD=\${PRODUCTION_DB_PASSWORD:-strong_production_password}
DATABASE_URL=postgresql://postgres:\${POSTGRES_PASSWORD}@db:5432/church_db

# Security
JWT_SECRET=\${JWT_SECRET:-$(openssl rand -base64 32)}

# External Services (Update with real values)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# FTP Configuration
FTP_HOST=your-ftp-host.com
FTP_USER=your-ftp-username
FTP_PASS=your-ftp-password
FTP_PORT=21
FTP_SECURE=false
FTP_BASE_DIR=public_html
UPLOADS_DIR=uploads
EOF

# Build and deploy
echo "🏗️ Building production images..."
docker-compose -f docker-compose.yml --profile production build --no-cache

echo "🚀 Starting production services..."
docker-compose -f docker-compose.yml --profile production up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Run health checks
echo "🔍 Running health checks..."
docker-compose -f docker-compose.yml --profile production exec backend curl -f http://localhost:3001/api/health || {
    echo "❌ Backend health check failed"
    docker-compose -f docker-compose.yml --profile production logs backend
    exit 1
}

echo "✅ Production deployment completed successfully!"
echo "🌐 Your website is now available at: https://samanabyar.online"
echo "📊 Monitoring dashboard: https://samanabyar.online:3000 (admin/admin)"
echo "📈 Metrics: https://samanabyar.online:9090"

echo ""
echo "📋 Next Steps:"
echo "1. Configure your domain DNS to point to this server"
echo "2. Update .env.production with real credentials"
echo "3. Set up SSL certificate renewal cron job"
echo "4. Configure monitoring alerts"
echo "5. Set up database backups"

echo ""
echo "🔧 Useful Commands:"
echo "- View logs: docker-compose --profile production logs -f"
echo "- Stop services: docker-compose --profile production down"
echo "- Update code: git pull && docker-compose --profile production up -d --build"
echo "- Database backup: docker-compose --profile production exec db pg_dump -U postgres church_db > backup.sql"