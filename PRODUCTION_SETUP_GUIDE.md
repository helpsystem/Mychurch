# 🚀 MyChurch Production Setup Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Docker Production Setup](#docker-production-setup)
4. [PostgreSQL Database Configuration](#postgresql-database-configuration)
5. [SSL/HTTPS Security Setup](#sslhttps-security-setup)
6. [Backup System Implementation](#backup-system-implementation)
7. [Environment Configuration](#environment-configuration)
8. [Deployment Steps](#deployment-steps)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Troubleshooting](#troubleshooting)

## Overview

This guide provides comprehensive instructions for setting up MyChurch in a production environment with Docker, PostgreSQL, SSL/HTTPS security, and automated backup systems.

### Key Features
- **Docker Containerization**: Production-optimized Docker setup
- **PostgreSQL Database**: Scalable and secure database configuration
- **SSL/HTTPS**: Security certificates and HTTPS configuration
- **Automated Backups**: Database, files, and configuration backup system
- **Load Balancing**: Nginx reverse proxy with SSL termination
- **Security**: Hardened security configurations and best practices

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Docker**: Version 20.10+
- **Docker Compose**: Version 1.29+
- **Node.js**: Version 18+ (for local development)
- **PostgreSQL**: Version 15+ (optional, if using external database)
- **Nginx**: Version 1.18+ (optional, if using external load balancer)

### System Resources
- **CPU**: 2+ cores recommended
- **RAM**: 4GB+ recommended
- **Storage**: 50GB+ recommended
- **Network**: Stable internet connection

### Domain and SSL
- Registered domain name (e.g., mychurch.com)
- DNS A record pointing to your server IP
- SSL certificate (Let's Encrypt recommended)

## Docker Production Setup

### 1. Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/your-username/mychurch.git
cd mychurch

# Switch to production branch
git checkout main

# Install dependencies
npm install
cd backend && npm install
cd ..
```

### 2. Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

Add the following configuration:

```env
# Application Configuration
NODE_ENV=production
PORT=3001
VITE_API_URL=https://api.mychurch.com
VITE_APP_NAME=MyChurch
VITE_APP_VERSION=1.0.0

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=mychurch_prod
POSTGRES_USER=mychurch_admin
POSTGRES_PASSWORD=MyChurchSecureDB2024!

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=MyChurchSecureRedis2024!

# Security Configuration
JWT_SECRET=MyChurchSuperSecretJWTKey2024!LongRandomString
CORS_ORIGIN=https://mychurch.com
API_KEY=MyChurchSecureAPIKey2024!

# AI Services Configuration
GOOGLE_API_KEY=your_google_api_key
GEMINI_API_KEY=your_gemini_api_key
HF_API_KEY=your_huggingface_api_key

# FTP Configuration
FTP_HOST=ftp.mychurch.com
FTP_USER=mychurch_ftp
FTP_PASS=MyChurchSecureFTP2024!
FTP_PORT=21

# SSL Configuration
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem

# Backup Configuration
BACKUP_DIR=/var/backups/mychurch
COMPRESS_BACKUPS=true
ENCRYPT_BACKUPS=true
ENCRYPTION_PASSWORD=MyChurchSecureBackup2024!

# Logging Configuration
LOG_LEVEL=info
LOG_DIR=/var/log/mychurch
```

### 3. Build and Run Docker Containers

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Verify Services

```bash
# Check backend health
curl -s https://api.mychurch.com/api/health

# Check frontend accessibility
curl -s https://mychurch.com

# Check database connectivity
docker-compose -f docker-compose.prod.yml exec postgres psql -U mychurch_admin -d mychurch_prod -c "SELECT version();"
```

## PostgreSQL Database Configuration

### 1. Database Initialization

The database is automatically initialized when the PostgreSQL container starts. The initialization script [`docker/postgres/init-db-prod.sql`](docker/postgres/init-db-prod.sql) creates:

- Database tables with optimized schemas
- Admin users with secure credentials
- Database indexes for performance
- Views for common queries
- Functions for maintenance tasks

### 2. Database Users and Permissions

```sql
-- Connect to PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U mychurch_admin -d mychurch_prod

-- Check database users
\du

-- Check tables
\dt

-- Check indexes
\di

-- Check database size
SELECT pg_size_pretty(pg_database_size('mychurch_prod'));
```

### 3. Database Optimization

```sql
-- Analyze tables for better query performance
ANALYZE;

-- Update statistics
VACUUM ANALYZE;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 4. Database Backup and Restore

```bash
# Create manual backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U mychurch_admin -d mychurch_prod > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U mychurch_admin -d mychurch_prod < backup-file.sql

# Use backup system
node backup-system.cjs --type database --compress --encrypt
```

## SSL/HTTPS Security Setup

### 1. Generate SSL Certificates

#### Option 1: Let's Encrypt (Recommended for Production)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot certonly --standalone -d mychurch.com -d api.mychurch.com

# Copy certificates to Docker volume
sudo cp /etc/letsencrypt/live/mychurch.com/fullchain.pem /var/lib/docker/volumes/mychurch_nginx_ssl/_data/cert.pem
sudo cp /etc/letsencrypt/live/mychurch.com/privkey.pem /var/lib/docker/volumes/mychurch_nginx_ssl/_data/key.pem

# Set proper permissions
sudo chmod 600 /var/lib/docker/volumes/mychurch_nginx_ssl/_data/cert.pem
sudo chmod 600 /var/lib/docker/volumes/mychurch_nginx_ssl/_data/key.pem
```

#### Option 2: Self-Signed Certificates (For Development/Testing)

```bash
# Generate self-signed certificates
docker-compose -f docker-compose.prod.yml exec nginx bash -c "cd /etc/nginx/ssl && ./generate-ssl.sh"

# Or run the script directly
chmod +x docker/nginx/ssl/generate-ssl.sh
./docker/nginx/ssl/generate-ssl.sh
```

### 2. Configure SSL in Nginx

The SSL configuration is already set up in [`docker/nginx/nginx.conf`](docker/nginx/nginx.conf). Key features include:

- HTTP to HTTPS redirection
- SSL/TLS configuration with modern protocols
- HSTS headers
- OCSP stapling
- Perfect Forward Secrecy

### 3. SSL Certificate Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up automatic renewal
sudo crontab -e

# Add the following line to renew certificates monthly
0 2 1 * * /usr/bin/certbot renew --quiet --post-hook "docker-compose -f docker-compose.prod.yml restart nginx"
```

### 4. SSL Security Verification

```bash
# Check SSL configuration
openssl s_client -connect mychurch.com:443 -servername mychurch.com

# Test SSL rating
https://www.ssllabs.com/ssltest/analyze.html?d=mychurch.com

# Check certificate expiration
echo | openssl s_client -connect mychurch.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Backup System Implementation

### 1. Backup System Overview

The backup system ([`backup-system.cjs`](backup-system.cjs)) provides comprehensive backup capabilities:

- **Database Backups**: PostgreSQL database dumps
- **File Backups**: Application files and uploads
- **Configuration Backups**: Docker configurations and environment files
- **Full Backups**: Complete system backups
- **Automated Scheduling**: Cron-based scheduled backups
- **Compression**: ZIP/TAR compression
- **Encryption**: AES-256 encryption
- **Verification**: Backup integrity verification
- **Cleanup**: Automatic cleanup of old backups

### 2. Backup Configuration

```bash
# Configure backup settings
nano .env

# Key backup settings:
BACKUP_DIR=/var/backups/mychurch
COMPRESS_BACKUPS=true
ENCRYPT_BACKUPS=true
ENCRYPTION_PASSWORD=MyChurchSecureBackup2024!
```

### 3. Manual Backups

```bash
# Full backup with compression and encryption
node backup-system.cjs --type full --compress --encrypt

# Database backup only
node backup-system.cjs --type database --compress --encrypt

# Files backup only
node backup-system.cjs --type files --compress --encrypt

# Configuration backup only
node backup-system.cjs --type config --compress --encrypt

# Backup with verification
node backup-system.cjs --type full --compress --encrypt --verify

# Backup with cleanup
node backup-system.cjs --type full --compress --encrypt --cleanup
```

### 4. Scheduled Backups

```bash
# Schedule daily backup at 2 AM
node backup-system.cjs --schedule "0 2 * * *" --cleanup

# Schedule weekly backup on Sunday at 3 AM
node backup-system.cjs --schedule "0 3 * * 0" --cleanup

# Schedule monthly backup on 1st at 4 AM
node backup-system.cjs --schedule "0 4 1 * *" --cleanup
```

### 5. Backup Restoration

```bash
# Restore database backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U mychurch_admin -d mychurch_prod < backup-file.sql

# Restore files backup
unzip files-backup.zip -d /tmp/restore
cp -r /tmp/restore/* /path/to/application/

# Restore configuration backup
unzip config-backup.zip -d /tmp/restore
cp /tmp/restore/.env /path/to/application/
cp /tmp/restore/docker-compose.prod.yml /path/to/application/
```

### 6. Backup Monitoring

```bash
# Check backup directory
ls -la /var/backups/mychurch/

# Check backup sizes
du -sh /var/backups/mychurch/*

# Check backup logs
tail -f logs/backup.log

# Verify backup integrity
node backup-system.cjs --verify
```

## Environment Configuration

### 1. Production Environment Variables

```bash
# Create production environment file
cp .env.example .env.production

# Edit production environment
nano .env.production
```

Key production settings:

```env
# Application
NODE_ENV=production
PORT=3001
HOSTNAME=0.0.0.0

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=mychurch_prod
POSTGRES_USER=mychurch_admin
POSTGRES_PASSWORD=MyChurchSecureDB2024!

# Security
JWT_SECRET=MyChurchSuperSecretJWTKey2024!LongRandomString
CORS_ORIGIN=https://mychurch.com
API_KEY=MyChurchSecureAPIKey2024!

# AI Services
GOOGLE_API_KEY=your_production_google_api_key
GEMINI_API_KEY=your_production_gemini_api_key
HF_API_KEY=your_production_huggingface_api_key

# FTP
FTP_HOST=ftp.mychurch.com
FTP_USER=mychurch_ftp
FTP_PASS=MyChurchSecureFTP2024!
FTP_PORT=21

# SSL
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem

# Backup
BACKUP_DIR=/var/backups/mychurch
COMPRESS_BACKUPS=true
ENCRYPT_BACKUPS=true
ENCRYPTION_PASSWORD=MyChurchSecureBackup2024!

# Logging
LOG_LEVEL=info
LOG_DIR=/var/log/mychurch
```

### 2. Docker Environment

```bash
# Create Docker environment file
echo "NODE_ENV=production" > .docker.env

# Add additional Docker-specific settings
echo "POSTGRES_HOST=postgres" >> .docker.env
echo "REDIS_HOST=redis" >> .docker.env
echo "BACKUP_DIR=/var/backups/mychurch" >> .docker.env
```

### 3. System Environment

```bash
# Set system-wide environment variables
sudo nano /etc/environment

# Add:
NODE_ENV=production
MYCHURCH_HOME=/opt/mychurch
MYCHURCH_LOGS=/var/log/mychurch
MYCHURCH_BACKUPS=/var/backups/mychurch
```

## Deployment Steps

### 1. Pre-Deployment Checklist

- [ ] Domain is configured and pointing to server
- [ ] SSL certificates are obtained and configured
- [ ] Database is initialized and tested
- [ ] Environment variables are configured
- [ ] Backup system is tested
- [ ] Security settings are verified
- [ ] Monitoring is configured

### 2. Deployment Process

```bash
# 1. Stop existing services
docker-compose -f docker-compose.prod.yml down

# 2. Pull latest changes
git pull origin main

# 3. Update dependencies
npm install
cd backend && npm install
cd ..

# 4. Build new images
docker-compose -f docker-compose.prod.yml build --no-cache

# 5. Start services
docker-compose -f docker-compose.prod.yml up -d

# 6. Verify deployment
curl -s https://mychurch.com/api/health
curl -s https://api.mychurch.com/api/health

# 7. Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Post-Deployment Verification

```bash
# Application health check
curl -s https://mychurch.com | head -20
curl -s https://api.mychurch.com/api/health

# Database connectivity
docker-compose -f docker-compose.prod.yml exec postgres psql -U mychurch_admin -d mychurch_prod -c "SELECT 1;"

# SSL verification
openssl s_client -connect mychurch.com:443 -servername mychurch.com

# Performance check
curl -o /dev/null -s -w "%{time_total}\n" https://mychurch.com

# Log monitoring
tail -f /var/log/nginx/access.log
tail -f /var/log/mychurch/backend.log
```

## Monitoring and Maintenance

### 1. System Monitoring

```bash
# Check system resources
htop
df -h
free -h

# Check Docker containers
docker ps
docker stats

# Check disk usage
du -sh /var/lib/docker/
du -sh /var/backups/mychurch/
du -sh /var/log/mychurch/

# Check database performance
docker-compose -f docker-compose.prod.yml exec postgres psql -U mychurch_admin -d mychurch_prod -c "SELECT * FROM pg_stat_activity;"
```

### 2. Log Monitoring

```bash
# Application logs
tail -f /var/log/mychurch/backend.log
tail -f /var/log/mychurch/frontend.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Database logs
tail -f /var/log/postgresql/postgresql-15-main.log

# Docker logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### 3. Performance Monitoring

```bash
# Database performance
docker-compose -f docker-compose.prod.yml exec postgres psql -U mychurch_admin -d mychurch_prod -c "
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;
"

# Application performance
curl -o /dev/null -s -w "Time: %{time_total}s\nSize: %{size_download} bytes\n" https://mychurch.com

# Memory usage
docker stats --no-stream
```

### 4. Security Monitoring

```bash
# Failed login attempts
grep "Failed password" /var/log/auth.log

# Nginx security logs
grep "POST /api/auth/login" /var/log/nginx/access.log | grep -v "200"

# Database security logs
docker-compose -f docker-compose.prod.yml exec postgres psql -U mychurch_admin -d mychurch_prod -c "SELECT * FROM system_logs WHERE level = 'error';"

# SSL certificate monitoring
echo | openssl s_client -connect mychurch.com:443 2>/dev/null | openssl x509 -noout -dates
```

### 5. Regular Maintenance

```bash
# Weekly maintenance
docker-compose -f docker-compose.prod.yml exec postgres psql -U mychurch_admin -d mychurch_prod -c "VACUUM ANALYZE;"

# Monthly maintenance
docker system prune -f
docker volume prune -f

# Quarterly maintenance
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### 1. Common Issues

#### Docker Issues

```bash
# Docker service not running
sudo systemctl start docker
sudo systemctl enable docker

# Docker compose not found
sudo apt-get install docker-compose-plugin

# Permission denied
sudo usermod -aG docker $USER
newgrp docker
```

#### Database Issues

```bash
# Database connection refused
docker-compose -f docker-compose.prod.yml restart postgres

# Database not initialized
docker-compose -f docker-compose.prod.yml exec postgres psql -U mychurch_admin -d mychurch_prod -c "SELECT version();"

# Slow database performance
docker-compose -f docker-compose.prod.yml exec postgres psql -U mychurch_admin -d mychurch_prod -c "VACUUM ANALYZE;"
```

#### SSL Issues

```bash
# SSL certificate not trusted
sudo certbot renew --force-renewal

# SSL configuration error
docker-compose -f docker-compose.prod.yml restart nginx

# Mixed content warnings
grep "http://" /var/log/nginx/access.log
```

#### Application Issues

```bash
# Application not responding
curl -s https://mychurch.com/api/health

# High memory usage
docker stats --no-stream

# Application errors
tail -f /var/log/mychurch/backend.log
```

### 2. Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
docker-compose -f docker-compose.prod.yml up -d

# Debug database
docker-compose -f docker-compose.prod.yml exec postgres psql -U mychurch_admin -d mychurch_prod -E

# Debug application
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 3. Emergency Recovery

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Restore from backup
node backup-system.cjs --type full --compress --encrypt

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Verify recovery
curl -s https://mychurch.com/api/health
```

### 4. Support and Resources

- **Documentation**: [MyChurch Documentation](https://docs.mychurch.com)
- **Issue Tracker**: [GitHub Issues](https://github.com/your-username/mychurch/issues)
- **Community Forum**: [MyChurch Community](https://community.mychurch.com)
- **Support Email**: support@mychurch.com

## Conclusion

This production setup guide provides everything needed to deploy and maintain MyChurch in a production environment. The Docker-based setup ensures consistency, scalability, and maintainability while the comprehensive backup and security measures protect your data and users.

For additional support or questions, please refer to the resources listed above or contact the MyChurch development team.

---

*Last Updated: November 2024*
*Version: 1.0.0*