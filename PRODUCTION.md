# Iran Church DC - Production Deployment Guide

## 🚀 Complete Production Setup for samanabyar.online

### Prerequisites

1. **Server Requirements:**
   - Ubuntu 20.04+ or CentOS 8+
   - 4GB RAM minimum (8GB recommended)
   - 50GB disk space
   - Docker & Docker Compose installed

2. **Domain Setup:**
   - Domain: `samanabyar.online`
   - DNS A record pointing to server IP
   - Subdomain `www.samanabyar.online` (optional)

### Quick Deployment

```bash
# 1. Clone the repository
git clone https://github.com/helpsystem/Mychurch.git
cd Mychurch

# 2. Make deployment script executable
chmod +x scripts/production-deploy.sh

# 3. Run production deployment
./scripts/production-deploy.sh
```

### Manual Setup

#### 1. Environment Configuration

Create `.env.production`:

```bash
# Copy example and customize
cp .env.example .env.production
nano .env.production
```

#### 2. SSL Certificate Setup

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d samanabyar.online -d www.samanabyar.online
```

#### 3. Docker Deployment

```bash
# Build and start production services
docker-compose --profile production up -d --build

# View logs
docker-compose --profile production logs -f

# Check service status
docker-compose --profile production ps
```

### Services Overview

| Service | URL | Description |
|---------|-----|-------------|
| **Main Website** | https://samanabyar.online | Church website |
| **Admin Panel** | https://samanabyar.online/admin | Admin dashboard |
| **API** | https://samanabyar.online/api | REST API |
| **Grafana** | https://samanabyar.online:3000 | Monitoring dashboard |
| **Prometheus** | https://samanabyar.online:9090 | Metrics collection |

### Database Management

#### Backup

```bash
# Create backup
docker-compose --profile production exec db pg_dump -U postgres church_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backups
echo "0 2 * * * cd /path/to/Mychurch && docker-compose --profile production exec db pg_dump -U postgres church_db > backups/backup_\$(date +\\%Y\\%m\\%d_\\%H\\%M\\%S).sql" | crontab -
```

#### Restore

```bash
# Restore from backup
docker-compose --profile production exec -T db psql -U postgres church_db < backup_file.sql
```

### Monitoring & Alerts

#### Grafana Setup
1. Access: https://samanabyar.online:3000
2. Login: admin/admin (change on first login)
3. Import dashboard from `docker/grafana/dashboards/`

#### Health Monitoring
- **Health endpoint:** https://samanabyar.online/api/health
- **Uptime monitoring:** Built-in health checks
- **Log aggregation:** Loki + Grafana

### Security Features

#### Implemented Security
- ✅ SSL/TLS encryption (Let's Encrypt)
- ✅ Rate limiting (100 requests/15 minutes)
- ✅ CORS protection
- ✅ Security headers (HSTS, CSP, etc.)
- ✅ Input validation & sanitization
- ✅ SQL injection protection
- ✅ XSS protection

#### Firewall Rules
```bash
# Basic firewall setup
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Grafana (optional, for monitoring)
```

### Performance Optimization

#### Nginx Configuration
- ✅ Gzip compression
- ✅ Static file caching
- ✅ Browser caching headers
- ✅ Connection keep-alive
- ✅ Load balancing ready

#### Database Optimization
- ✅ Connection pooling
- ✅ Query optimization
- ✅ Index optimization
- ✅ Backup scheduling

### Maintenance Commands

```bash
# Update application
git pull origin main
docker-compose --profile production up -d --build

# View real-time logs
docker-compose --profile production logs -f

# Restart specific service
docker-compose --profile production restart backend

# Clean up old images
docker image prune -f

# Database console access
docker-compose --profile production exec db psql -U postgres church_db

# Import Bible data
npm run bible:import

# Create admin user
npm run admin:create
```

### Troubleshooting

#### Common Issues

1. **SSL Certificate Issues:**
   ```bash
   sudo certbot renew --dry-run
   sudo nginx -t && sudo systemctl reload nginx
   ```

2. **Database Connection Issues:**
   ```bash
   docker-compose --profile production logs db
   docker-compose --profile production exec db psql -U postgres -l
   ```

3. **Memory Issues:**
   ```bash
   docker stats
   free -h
   ```

4. **Disk Space Issues:**
   ```bash
   df -h
   docker system prune -a
   ```

### Scaling & Load Balancing

#### Multi-Server Setup
- Load balancer: Nginx/HAProxy
- Database: PostgreSQL cluster
- File storage: Shared NFS/S3
- Session storage: Redis cluster

#### Performance Monitoring
- Response times: <200ms average
- Uptime target: 99.9%
- Database queries: <50ms average
- Memory usage: <80%

### Backup Strategy

#### Automated Backups
1. **Database:** Daily PostgreSQL dumps
2. **Files:** Daily file system backups
3. **Config:** Version controlled in Git
4. **Retention:** 30 days local, 1 year offsite

### Support & Documentation

#### Additional Resources
- **API Documentation:** `/api/docs`
- **Component Library:** `/components`
- **Database Schema:** `/docs/database.md`
- **Development Guide:** `/docs/development.md`

#### Contact Information
- **Developer:** Saman Abyar
- **Email:** admin@samanabyar.online
- **Repository:** https://github.com/helpsystem/Mychurch

---

## 🎉 Congratulations!

Your Iran Church DC website is now live and running with:
- ✅ Full production infrastructure
- ✅ Automated deployments
- ✅ Health monitoring
- ✅ SSL security
- ✅ Database management
- ✅ Backup systems
- ✅ Performance optimization

**Website URL:** https://samanabyar.online