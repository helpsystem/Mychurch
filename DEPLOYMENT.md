# Church Management System - Complete DevOps Setup

## 🚀 راه‌اندازی سریع

### محیط توسعه (Development)
```bash
# کپی تنظیمات محیطی
cp .env.docker .env

# اجرای محیط توسعه
npm run docker:dev

# دسترسی به برنامه
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000
# Database: postgresql://postgres:mychurch_dev_password@localhost:5432/mychurch
```

### محیط تولید (Production)
```bash
# تنظیم متغیرهای محیطی تولید در .env
NODE_ENV=production
DOMAIN=samanabyar.online
POSTGRES_PASSWORD=strong_password_here
# ... سایر تنظیمات

# اجرای محیط تولید با مانیتورینگ
npm run docker:prod

# دسترسی به سرویس‌ها
# Website: https://samanabyar.online
# Monitoring: http://localhost:3000 (Grafana)
# Metrics: http://localhost:9090 (Prometheus)
```

## 🔧 سرویس‌های موجود

### پایگاه داده و Cache
- **PostgreSQL 15**: پایگاه داده اصلی
- **Redis 7**: Cache و session management

### برنامه اصلی
- **Backend API**: Node.js + Express (پورت 5000)
- **Frontend**: React + Vite (در تولید توسط Nginx سرو می‌شود)

### وب سرور و امنیت
- **Nginx**: Load balancer, SSL termination, static files
- **Let's Encrypt**: SSL certificate خودکار

### مانیتورینگ و لاگ
- **Prometheus**: جمع‌آوری metrics
- **Grafana**: داشبورد و visualization
- **Loki**: مدیریت لاگ‌ها
- **Health Monitor**: بررسی سلامت سرویس‌ها

### پشتیبان‌گیری
- **Automated Backup**: پشتیبان‌گیری خودکار روزانه از دیتابیس
- **Retention Policy**: نگهداری 30 روز پشتیبان

## 📋 فرمان‌های مفید

### Docker Compose
```bash
# شروع محیط توسعه
npm run docker:dev

# شروع محیط تولید با مانیتورینگ
npm run docker:prod

# توقف همه سرویس‌ها
npm run docker:stop

# مشاهده لاگ‌ها
npm run logs:backend
npm run logs:health
docker-compose logs -f [service_name]
```

### پشتیبان‌گیری و بازیابی
```bash
# ایجاد پشتیبان
npm run backup:create

# بازیابی از پشتیبان
cat backups/backup_20241006_120000.sql | npm run backup:restore

# یا دستی:
docker-compose exec postgres pg_dump -U postgres mychurch > my_backup.sql
docker-compose exec -T postgres psql -U postgres -d mychurch < my_backup.sql
```

### بررسی سلامت
```bash
# بررسی API
npm run health

# بررسی اتصال دیتابیس
npm run db:check

# مانیتورینگ real-time
docker-compose exec healthcheck tail -f /logs/health.log
```

## 🛠 تنظیمات GitHub Actions

برای فعال‌سازی CI/CD خودکار، این secret ها را در GitHub repository تنظیم کنید:

### Required Secrets
```
SSH_PRIVATE_KEY=<کلید SSH خصوصی برای سرور>
SERVER_HOST=samanabyar.online
SERVER_USER=root
POSTGRES_PASSWORD=<پسورد قوی PostgreSQL>
DATABASE_URL=<آدرس کامل Supabase یا PostgreSQL>
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=<کلید Supabase>
FTP_HOST=ftp.yourhost.com
FTP_USER=<نام کاربری FTP>
FTP_PASS=<پسورد FTP>
DOMAIN=samanabyar.online
SSL_EMAIL=admin@samanabyar.online
```

### استقرار خودکار
هر push به branch `main` به طور خودکار:
1. تست‌ها را اجرا می‌کند
2. پروژه را build می‌کند
3. روی سرور deploy می‌کند
4. SSL certificate را تنظیم می‌کند
5. سلامت سایت را بررسی می‌کند

## 🏗 ساختار پروژه

```
├── docker-compose.yml          # تعریف همه سرویس‌ها
├── .env.docker                 # نمونه متغیرهای محیطی
├── backend/
│   ├── Dockerfile             # Image برای backend
│   └── server.js              # سرور اصلی
├── docker/
│   ├── nginx/                 # تنظیمات Nginx
│   ├── monitoring/            # Prometheus, Grafana, Loki
│   └── health/                # Health monitoring service
├── scripts/
│   ├── backup/                # اسکریپت‌های پشتیبان‌گیری
│   └── db/                    # مدیریت دیتابیس
└── .github/workflows/         # GitHub Actions CI/CD
```

## 🔐 امنیت

### SSL/TLS
- Let's Encrypt certificate خودکار
- HTTP به HTTPS redirect
- Security headers (HSTS, CSP, X-Frame-Options)

### Rate Limiting
- API calls: 10 requests/second
- Authentication: 5 requests/minute
- محافظت در برابر brute force

### Network Security
- Internal Docker network
- Port isolation
- Database access محدود

## 📊 مانیتورینگ

### Grafana Dashboards
دسترسی: http://localhost:3000 (admin/admin123)
- System metrics (CPU, Memory, Disk)
- Application performance
- Database connections
- Response times

### Health Checks
- Automatic service monitoring
- Alert notifications (Slack/Email)
- Status logs در `/logs/health.log`

### Log Management
- Centralized logging با Loki
- Log retention policy
- Real-time log streaming

## 🚨 عیب‌یابی

### مشکلات رایج
```bash
# سرویس شروع نمی‌شود
docker-compose ps
docker-compose logs [service_name]

# مشکل اتصال دیتابیس
docker-compose exec postgres pg_isready
npm run db:check

# مشکل SSL
docker-compose logs certbot
docker-compose logs nginx

# بررسی فضای دیسک
docker system df
docker system prune -f
```

### پورت‌های مورد استفاده
- 80, 443: Nginx (HTTP/HTTPS)
- 5000: Backend API
- 5173: Frontend Dev Server
- 5432: PostgreSQL
- 6379: Redis
- 3000: Grafana
- 9090: Prometheus
- 3100: Loki

## 📚 مستندات اضافی

- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [Let's Encrypt SSL](https://letsencrypt.org/docs/)

## 🎯 نکات عملکرد

### بهینه‌سازی تولید
- Image caching و multi-stage builds
- Gzip compression
- Static asset caching
- Database connection pooling
- Redis session storage

### Scaling
برای افزایش ظرفیت:
```yaml
# در docker-compose.yml
backend:
  deploy:
    replicas: 3
  
nginx:
  depends_on:
    - backend
  # Load balancing automatic
```