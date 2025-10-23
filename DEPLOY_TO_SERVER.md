# 🚀 راهنمای Deploy روی سرور

## مرحله 1️⃣: آماده‌سازی سرور

```bash
# اتصال به سرور
ssh root@samyar

# رفتن به دایرکتوری پروژه
cd ~/Mychurch

# پاک کردن فایل‌های قدیمی (اختیاری - فقط در صورت نیاز)
# rm -rf *
# rm -rf .git

# یا اگر پروژه وجود دارد، فقط pull کنید
git pull origin main
```

---

## مرحله 2️⃣: Clone یا Update پروژه

### اگر اولین بار است (Clone):
```bash
cd ~
git clone https://github.com/helpsystem/Mychurch.git
cd Mychurch
```

### اگر قبلاً clone کرده‌اید (Update):
```bash
cd ~/Mychurch
git fetch origin
git reset --hard origin/main
git pull origin main
```

---

## مرحله 3️⃣: نصب Dependencies

### نصب Node.js (اگر نصب نیست):
```bash
# بررسی نسخه Node.js
node --version
npm --version

# اگر نصب نبود:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# بررسی مجدد
node --version  # باید 20.x باشد
npm --version
```

### نصب Dependencies پروژه:
```bash
cd ~/Mychurch

# نصب dependencies اصلی
npm install

# نصب dependencies برای backend
cd backend
npm install
cd ..
```

---

## مرحله 4️⃣: تنظیم Environment Variables

```bash
cd ~/Mychurch/backend

# ساخت فایل .env
nano .env
```

**محتوای فایل `.env`:**
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/church_db

# یا اگر از Supabase استفاده می‌کنید:
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Server
PORT=3001
NODE_ENV=production

# CORS
FRONTEND_URL=http://your-domain.com

# JWT (برای احراز هویت)
JWT_SECRET=your-secret-key-here-change-this

# Session
SESSION_SECRET=your-session-secret-here-change-this
```

**ذخیره و خروج:**
- `Ctrl + O` (ذخیره)
- `Enter` (تأیید)
- `Ctrl + X` (خروج)

---

## مرحله 5️⃣: ساخت Database (اگر نیاز است)

### اگر از PostgreSQL محلی استفاده می‌کنید:
```bash
# نصب PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# ساخت database و user
sudo -u postgres psql

# در PostgreSQL shell:
CREATE DATABASE church_db;
CREATE USER church_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE church_db TO church_user;
\q

# اجرای schema
cd ~/Mychurch/scripts
psql -U church_user -d church_db -f bible-schema.sql
```

### اگر از Supabase استفاده می‌کنید:
```bash
# فقط فایل schema را در Supabase SQL Editor کپی کنید
cat ~/Mychurch/scripts/bible-schema.sql
```

---

## مرحله 6️⃣: Build پروژه

```bash
cd ~/Mychurch

# Build frontend
npm run build

# بررسی فایل‌های build شده
ls -la dist/
```

---

## مرحله 7️⃣: نصب و راه‌اندازی PM2

```bash
# نصب PM2 globally
sudo npm install -g pm2

# راه‌اندازی backend با PM2
cd ~/Mychurch/backend
pm2 start server.js --name mychurch-backend

# ذخیره تنظیمات PM2
pm2 save

# راه‌اندازی خودکار PM2 با بوت سیستم
pm2 startup
# دستور خروجی را کپی و اجرا کنید

# مشاهده وضعیت
pm2 status
pm2 logs mychurch-backend
```

---

## مرحله 8️⃣: نصب و تنظیم Nginx

```bash
# نصب Nginx
sudo apt-get update
sudo apt-get install nginx

# ساخت فایل config برای سایت
sudo nano /etc/nginx/sites-available/mychurch
```

**محتوای فایل Nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend - Static Files
    root /root/Mychurch/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Frontend routing
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**فعال‌سازی site و راه‌اندازی Nginx:**
```bash
# ساخت symlink
sudo ln -s /etc/nginx/sites-available/mychurch /etc/nginx/sites-enabled/

# حذف default site (اختیاری)
sudo rm /etc/nginx/sites-enabled/default

# تست config
sudo nginx -t

# راه‌اندازی مجدد Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# بررسی وضعیت
sudo systemctl status nginx
```

---

## مرحله 9️⃣: نصب SSL با Let's Encrypt (اختیاری اما توصیه می‌شود)

```bash
# نصب Certbot
sudo apt-get install certbot python3-certbot-nginx

# دریافت SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# تست auto-renewal
sudo certbot renew --dry-run
```

---

## مرحله 🔟: تنظیمات Firewall

```bash
# اگر ufw استفاده می‌کنید:
sudo ufw allow 'Nginx Full'
sudo ufw allow 22/tcp
sudo ufw enable
sudo ufw status

# یا اگر از firewalld استفاده می‌کنید:
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## ✅ بررسی نهایی

```bash
# بررسی وضعیت PM2
pm2 status
pm2 logs mychurch-backend --lines 50

# بررسی Nginx
sudo nginx -t
sudo systemctl status nginx

# تست API
curl http://localhost:3001/api/health

# تست از خارج
curl http://your-domain.com/api/health
```

---

## 🔄 دستورات Update (برای آپدیت‌های بعدی)

```bash
# اتصال به سرور
ssh root@samyar
cd ~/Mychurch

# دریافت آخرین تغییرات
git pull origin main

# نصب dependencies جدید (در صورت نیاز)
npm install
cd backend && npm install && cd ..

# Build مجدد
npm run build

# راه‌اندازی مجدد backend
pm2 restart mychurch-backend

# راه‌اندازی مجدد Nginx
sudo systemctl restart nginx

# بررسی لاگ‌ها
pm2 logs mychurch-backend
```

---

## 🐛 عیب‌یابی

### اگر Backend کار نمی‌کند:
```bash
# بررسی لاگ‌های PM2
pm2 logs mychurch-backend

# بررسی لاگ‌های Nginx
sudo tail -f /var/log/nginx/error.log

# راه‌اندازی مجدد همه چیز
pm2 restart all
sudo systemctl restart nginx
```

### اگر Database متصل نمی‌شود:
```bash
# تست اتصال PostgreSQL
psql -U church_user -d church_db -c "SELECT version();"

# بررسی .env
cat ~/Mychurch/backend/.env
```

### اگر Frontend نمایش داده نمی‌شود:
```bash
# بررسی فایل‌های dist
ls -la ~/Mychurch/dist/

# بررسی permissions
sudo chmod -R 755 ~/Mychurch/dist/
sudo chown -R www-data:www-data ~/Mychurch/dist/
```

---

## 📊 نظارت و Monitoring

```bash
# نصب htop برای نظارت بر منابع
sudo apt-get install htop
htop

# مشاهده استفاده از دیسک
df -h

# مشاهده استفاده از RAM
free -h

# مشاهده لاگ‌های real-time
pm2 logs mychurch-backend --lines 100

# مانیتورینگ PM2
pm2 monit
```

---

## 🔐 امنیت (Security Hardening)

```bash
# تغییر پورت SSH (توصیه می‌شود)
sudo nano /etc/ssh/sshd_config
# Port 22 را به 2222 تغییر دهید

# غیرفعال کردن ورود root با password
# PermitRootLogin without-password

# راه‌اندازی مجدد SSH
sudo systemctl restart ssh

# نصب Fail2ban
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# آپدیت منظم سیستم
sudo apt-get update
sudo apt-get upgrade
```

---

## ✨ بهینه‌سازی Performance

```bash
# فشرده‌سازی فایل‌های static
cd ~/Mychurch/dist
find . -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' \) -exec gzip -k {} \;

# تنظیم cache برای Nginx
sudo nano /etc/nginx/nginx.conf
# اضافه کردن:
# proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;

# راه‌اندازی مجدد
sudo systemctl restart nginx
```

---

## 📝 Backup خودکار

```bash
# ساخت اسکریپت backup
nano ~/backup.sh
```

**محتوای `backup.sh`:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U church_user church_db > $BACKUP_DIR/db_$DATE.sql

# Backup code
tar -czf $BACKUP_DIR/mychurch_$DATE.tar.gz ~/Mychurch

# حذف backup‌های قدیمی‌تر از 7 روز
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# اجازه اجرا
chmod +x ~/backup.sh

# تست backup
~/backup.sh

# اضافه کردن به cron برای اجرای روزانه
crontab -e
# اضافه کردن:
# 0 2 * * * /root/backup.sh >> /root/backup.log 2>&1
```

---

## 🎉 تمام!

سایت شما الان باید در دسترس باشد در:
- **HTTP**: http://your-domain.com
- **HTTPS**: https://your-domain.com (اگر SSL نصب کردید)
- **API**: http://your-domain.com/api/health

---

## 📞 کمک و پشتیبانی

اگر مشکلی پیش آمد:
1. لاگ‌ها را بررسی کنید: `pm2 logs mychurch-backend`
2. وضعیت سرویس‌ها را چک کنید: `pm2 status` و `sudo systemctl status nginx`
3. تنظیمات Nginx را تست کنید: `sudo nginx -t`

**موفق باشید! 🚀**
