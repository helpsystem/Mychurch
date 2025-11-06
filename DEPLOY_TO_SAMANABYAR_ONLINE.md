# 🚀 استقرار MyChurch روی سامانه‌ی samanabyar.online

## 📋 اطلاعات کلی

وب‌سایت اصلی پروژه MyChurch در حال حاضر روی دامنه `samanabyar.online` مستقر می‌باشد. این راهنما مراحل استقرار و پیکربندی سیستم روی این دامنه را به صورت کامل شرح می‌دهد.

## 🔧 اطلاعات سرور و دامنه

### اطلاعات دامنه
- **دامنه اصلی**: `samanabyar.online`
- **دامنه API**: `api.samanabyar.online`
- **ایمیل پشتیبانی**: `admin@samanabyar.online`
- **سرور**: [اطلاعات سرور]

### اطلاعات اتصال
- **پورت SSH**: 22
- **پورت HTTP**: 80
- **پورت HTTPS**: 443
- **پورت PostgreSQL**: 5432
- **پورت Redis**: 6379

## 🚀 اجرای استقرار

### مرحله ۱: آماده‌سازی محیط

```bash
# کلون کردن پروژه
git clone https://github.com/your-username/mychurch.git
cd mychurch

# نصب وابستگی‌ها
npm install
cd backend && npm install
cd ..

# ایجاد فایل محیطی برای samanabyar.online
cp .env.example .env.samanabyar
```

### مرحله ۲: پیکربندی فایل محیطی

```bash
# ویرایش فایل محیطی
nano .env.samanabyar
```

محتوای فایل:

```env
# Application Configuration
NODE_ENV=production
PORT=3001
VITE_API_URL=https://api.samanabyar.online
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
CORS_ORIGIN=https://samanabyar.online
API_KEY=MyChurchSecureAPIKey2024!

# AI Services Configuration
GOOGLE_API_KEY=your_google_api_key
GEMINI_API_KEY=your_gemini_api_key
HF_API_KEY=your_huggingface_api_key

# FTP Configuration
FTP_HOST=ftp.samanabyar.online
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

### مرحله ۳: اجرای اسکریپت استقرار

```bash
# اجرای اسکریپت استقرار با پارامترهای samanabyar.online
node deploy-to-production.cjs \
  --host samanabyar.online \
  --user deploy \
  --key ~/.ssh/deploy_key \
  --domain samanabyar.online \
  --env .env.samanabyar \
  --backup \
  --test
```

### مرحله ۴: پیکربندی DNS

اطمینان حاصل کنید که رکوردهای DNS به درستی تنظیم شده‌اند:

```dns
# A Record
samanabyar.online    IN    A    [IP Address]
api.samanabyar.online IN    A    [IP Address]

# CNAME Record (اختیاری)
www.samanabyar.online IN    CNAME    samanabyar.online
```

### مرحله ۵: تست دسترسی

```bash
# تست دسترسی به وب‌سایت
curl -I https://samanabyar.online

# تست دسترسی به API
curl -I https://api.samanabyar.online

# تست SSL
openssl s_client -connect samanabyar.online:443 -servername samanabyar.online
```

## 🔐 پیکربندی امنیتی

### SSL/TLS

```bash
# دریافت گواهی SSL برای samanabyar.online
certbot certonly --standalone -d samanabyar.online -d api.samanabyar.online \
  --email admin@samanabyar.online --agree-tos --non-interactive

# کپی گواهی‌ها
cp /etc/letsencrypt/live/samanabyar.online/fullchain.pem /etc/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/samanabyar.online/privkey.pem /etc/nginx/ssl/key.pem

# تنظیم مجوزها
chmod 600 /etc/nginx/ssl/cert.pem
chmod 600 /etc/nginx/ssl/key.pem
```

### فایروال

```bash
# باز کردن پورت‌های ضروری
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 5432/tcp  # PostgreSQL
ufw allow 6379/tcp  # Redis

# فعال‌سازی فایروال
ufw enable
```

## 🗄️ پیکربازی پایگاه داده

### راه‌اندازی PostgreSQL

```bash
# نصب PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# ایجاد پایگاه داده و کاربر
sudo -u postgres psql << EOF
CREATE USER mychurch_admin WITH PASSWORD 'MyChurchSecureDB2024!';
CREATE DATABASE mychurch_prod OWNER mychurch_admin;
GRANT ALL PRIVILEGES ON DATABASE mychurch_prod TO mychurch_admin;
\q
EOF

# مقداردهی اولیه پایگاه داده
psql -U mychurch_admin -d mychurch_prod -f docker/postgres/init-db-prod.sql
```

### پیکربازی Redis

```bash
# نصب Redis
sudo apt-get install redis-server

# پیکربازی Redis
sudo nano /etc/redis/redis.conf

# تغییرات ضروری:
# requirepass MyChurchSecureRedis2024!
# maxmemory 256mb
# maxmemory-policy allkeys-lru

# ریستارت Redis
sudo systemctl restart redis-server
```

## 🐳 پیکربازی Docker

### ساخت فایل‌های Docker

```bash
# ساخت دایرکتوری‌های مورد نیاز
sudo mkdir -p /opt/mychurch/docker
sudo mkdir -p /opt/mychurch/config
sudo mkdir -p /opt/mychurch/logs
sudo mkdir -p /opt/mychurch/backups
sudo mkdir -p /etc/nginx/ssl

# کپی فایل‌های پروژه
sudo cp docker-compose.prod.yml /opt/mychurch/docker-compose.yml
sudo cp Dockerfile.frontend.prod /opt/mychurch/docker/
sudo cp docker/nginx/nginx.conf /opt/mychurch/docker/
sudo cp docker/postgres/init-db-prod.sql /opt/mychurch/docker/
sudo cp backup-system.cjs /opt/mychurch/

# تنظیم مجوزها
sudo chown -R deploy:deploy /opt/mychurch
sudo chmod -R 755 /opt/mychurch
```

### استقرار کانتینرها

```bash
# ساخت و استقرار کانتینرها
cd /opt/mychurch
docker-compose build --no-cache
docker-compose up -d

# بررسی وضعیت کانتینرها
docker-compose ps
docker-compose logs -f
```

## 🌐 پیکربازی Nginx

### فایل پیکربازی Nginx

```nginx
# /etc/nginx/sites-available/samanabyar.online
server {
    listen 80;
    server_name samanabyar.online www.samanabyar.online;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name samanabyar.online www.samanabyar.online;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozSSL:10m;
    ssl_session_tickets off;
    
    # Modern SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Frontend Application
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://localhost:3001;
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
            log_not_found off;
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS Headers
        add_header Access-Control-Allow-Origin https://samanabyar.online;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin https://samanabyar.online;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # File uploads
    location /uploads/ {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache uploaded files
        expires 1M;
        add_header Cache-Control "public";
        access_log off;
        log_not_found off;
    }
}
```

### فعال‌سازی سایت Nginx

```bash
# ایجاد symlink برای فعال‌سازی سایت
sudo ln -s /etc/nginx/sites-available/samanabyar.online /etc/nginx/sites-enabled/

# تست پیکربازی Nginx
sudo nginx -t

# ریستارت Nginx
sudo systemctl restart nginx
```

## 📊 نظارت و نگهداری

### نظارت سیستم

```bash
# مانیتورینگ منابع
htop
df -h
free -h

# مانیتورینگ Docker
docker stats
docker ps

# مانیتورینگ PostgreSQL
sudo systemctl status postgresql
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# مانیتورینگ Redis
sudo systemctl status redis-server
sudo redis-cli ping
```

### لاگ‌ها

```bash
# لاگ‌های Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# لاگ‌های برنامه
tail -f /opt/mychurch/logs/backend.log
tail -f /opt/mychurch/logs/frontend.log

# لاگ‌های Docker
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### بک‌آپ‌ها

```bash
 # ایجاد بک‌اپ دستی
node /opt/mychurch/backup-system.cjs --type full --compress --encrypt

# برنامه‌ریزی بک‌اپ خودکار
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/bin/node /opt/mychurch/backup-system.cjs --type full --compress --encrypt") | crontab -

# لیست بک‌اپ‌ها
ls -la /opt/mychurch/backups/
```

## 🧪 تست عملکرد

### تست سلامت سیستم

```bash
# تست سلامت وب‌سایت
curl -s https://samanabyar.online/api/health

# تست سلامت API
curl -s https://api.samanabyar.online/api/health

# تست پایگاه داده
docker-compose exec postgres psql -U mychurch_admin -d mychurch_prod -c "SELECT 1;"

# تست Redis
docker-compose exec redis redis-cli ping
```

### تست عملکرد

```bash
# تست سرعت بارگذاری
curl -o /dev/null -s -w "%{time_total}\n" https://samanabyar.online

# تست SSL
openssl s_client -connect samanabyar.online:443 -servername samanabyar.online

# تست امنیت
nmap -sV --script ssl-enum-ciphers samanabyar.online
```

## 🔄 به‌روزرسانی سیستم

### به‌روزرسانی برنامه

```bash
# ورود به دایرکتوری پروژه
cd /opt/mychurch

# دریافت آخرین تغییرات
git pull origin main

# به‌روزرسانی وابستگی‌ها
npm install
cd backend && npm install
cd ..

# ساخت مجدد کانتینرها
docker-compose build --no-cache

# ریستارت سرویس‌ها
docker-compose up -d
```

### به‌روزرسانی امنیتی

```bash
# به‌روزرسانی سیستم
sudo apt-get update && sudo apt-get upgrade

# به‌روزرسانی Docker
sudo apt-get install docker-ce docker-ce-cli containerd.io

# به‌روزرسانی گواهی SSL
sudo certbot renew --force-renewal

# ریستارت سرویس‌ها
sudo systemctl restart nginx
docker-compose restart
```

## 🚨 رفع اشکال

### مشکلات رایج

#### اتصال SSH

```bash
# تست اتصال SSH
ssh -i ~/.ssh/deploy_key deploy@samanabyar.online

# بررسی وضعیت SSH
sudo systemctl status ssh
sudo tail -f /var/log/auth.log
```

#### مشکلات Docker

```bash
# بررسی وضعیت Docker
sudo systemctl status docker
sudo docker info

# بررسی لاگ‌های Docker
sudo journalctl -u docker
docker-compose logs
```

#### مشکلات پایگاه داده

```bash
# بررسی وضعیت PostgreSQL
sudo systemctl status postgresql
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# تست اتصال پایگاه داده
docker-compose exec postgres psql -U mychurch_admin -d mychurch_prod -c "SELECT version();"
```

#### مشکلات Nginx

```bash
 # تست پیکربازی Nginx
sudo nginx -t

# بررسی لاگ‌های Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### ریکاوری

#### ریکاوری از بک‌اپ

```bash
 # توقف سرویس‌ها
docker-compose down

# بازیابی پایگاه داده
docker-compose exec -T postgres psql -U mychurch_admin -d mychurch_prod < /opt/mychurch/backups/database-backup.sql

# بازیابی فایل‌ها
tar -xzf /opt/mychurch/backups/files-backup.tar.gz -C /opt/mychurch/

# راه‌اندازی مجدد سرویس‌ها
docker-compose up -d
```

#### ریکاوری سیستم

```bash
# بازیابی کل سیستم از بک‌اپ
tar -xzf /opt/mychurch/backups/full-backup.tar.gz -C /

# راه‌اندازی مجدد سرویس‌ها
docker-compose up -d
sudo systemctl restart nginx
```

## 📞 پشتیبانی

در صورت بروز هرگونه مشکل یا نیاز به راهنمایی بیشتر، لطفاً با ما تماس بگیرید:

- **ایمیل پشتیبانی**: admin@samanabyar.online
- **تیکت سیستم**: [سیستم تیکت]
- **دокументات**: [مستندات سامانه]

---

*آخرین به‌روزرسانی: نوامبر 2024*
*نسخه: 1.0.0*