# 🚀 راهنمای استقرار سرور (Remote Server Deployment)

## ✅ پیش‌نیازها

- [ ] سرور A2 Hosting با دسترسی SSH
- [ ] Node.js نصب شده (نسخه 18 یا بالاتر)
- [ ] PM2 برای مدیریت process
- [ ] دسترسی FTP برای آپلود فایل‌ها
- [ ] دامنه و SSL Certificate (Let's Encrypt)

## 📋 مراحل استقرار

### 1️⃣ آماده‌سازی محلی

```bash
# Build frontend
npm run build

# Test backend locally
cd backend
npm install
node server.js
```

### 2️⃣ اتصال SSH به سرور

```bash
ssh username@samanabyar.online
# یا
ssh username@mi3-cl8-its2.a2hosting.com
```

### 3️⃣ نصب Node.js و PM2 روی سرور

```bash
# چک کردن نسخه Node
node --version
npm --version

# نصب PM2 به صورت global
npm install -g pm2

# تست PM2
pm2 list
```

### 4️⃣ آپلود فایل‌های backend

**روش 1: استفاده از FTP**
```
Host: mi3-cl8-its2.a2hosting.com
User: samanabyar
Pass: [password from .env]
Port: 21
```

آپلود کنید:
- `backend/` folder (تمام فایل‌ها به جز node_modules)
- `.env` file (با تنظیمات production)

**روش 2: استفاده از Git**
```bash
cd /home/samanabyar/public_html
git clone https://github.com/helpsystem/Mychurch.git
cd Mychurch/backend
npm install --production
```

### 5️⃣ تنظیم .env در سرور

```bash
cd ~/public_html/Mychurch/backend
nano .env
```

مطمئن شوید این تنظیمات صحیح است:
```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3001
DATABASE_URL=postgresql://...
DOMAIN=https://samanabyar.online
```

### 6️⃣ راه‌اندازی با PM2

```bash
cd ~/public_html/Mychurch/backend

# شروع سرور با PM2
pm2 start server.js --name church-backend

# ذخیره لیست process
pm2 save

# تنظیم startup script (اجرا خودکار در ریبوت)
pm2 startup

# مشاهده لاگ‌ها
pm2 logs church-backend

# مشاهده وضعیت
pm2 status
```

### 7️⃣ تنظیم Nginx/Apache Proxy

**Apache (.htaccess):**
```apache
RewriteEngine On

# Redirect API requests to Node backend
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L]

# Serve static frontend files
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L]
```

**Nginx:**
```nginx
location /api/ {
    proxy_pass http://localhost:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### 8️⃣ تنظیم Firewall

```bash
# باز کردن پورت 3001 (اگر نیاز است)
sudo ufw allow 3001

# چک کردن وضعیت
sudo ufw status
```

### 9️⃣ تست اتصال

```bash
# از داخل سرور
curl http://localhost:3001/api/health

# از خارج سرور
curl https://samanabyar.online/api/health
```

## 🔄 بروزرسانی (Update)

```bash
# اتصال به سرور
ssh samanabyar@mi3-cl8-its2.a2hosting.com

cd ~/public_html/Mychurch

# Pull changes from GitHub
git pull origin main

# نصب dependencies جدید (در صورت نیاز)
cd backend
npm install --production

# ریستارت PM2
pm2 restart church-backend

# مشاهده لاگ‌ها
pm2 logs church-backend --lines 50
```

## 🐛 عیب‌یابی (Troubleshooting)

### مشکل: سرور start نمی‌شود

```bash
# چک کردن لاگ‌های PM2
pm2 logs church-backend --err

# چک کردن پورت
netstat -tulpn | grep 3001

# ریستارت دستی
pm2 restart church-backend
```

### مشکل: CORS Error

در `.env` چک کنید:
```env
ALLOWED_ORIGINS=https://samanabyar.online,https://www.samanabyar.online
```

### مشکل: Database Connection

```bash
# تست اتصال Supabase از سرور
cd ~/public_html/Mychurch/backend
node -e "require('dotenv').config(); const {Pool}=require('pg'); const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}); pool.query('SELECT NOW()',console.log);"
```

### مشکل: Permission Denied

```bash
# تنظیم مجوزها
chmod -R 755 ~/public_html/Mychurch
chown -R samanabyar:samanabyar ~/public_html/Mychurch
```

## 📊 مدیریت PM2

```bash
# لیست process‌ها
pm2 list

# مشاهده جزئیات
pm2 show church-backend

# مانیتورینگ real-time
pm2 monit

# متوقف کردن
pm2 stop church-backend

# حذف از لیست
pm2 delete church-backend

# ریستارت در صورت تغییر فایل
pm2 reload church-backend

# مشاهده لاگ‌ها
pm2 logs church-backend
pm2 flush  # پاک کردن لاگ‌های قدیمی
```

## 🔒 امنیت

- [ ] تغییر تمام secrets در `.env`
- [ ] فعال کردن SSL Certificate
- [ ] محدود کردن دسترسی SSH (تنها IP‌های مجاز)
- [ ] نصب fail2ban برای محافظت از brute force
- [ ] بروزرسانی منظم dependencies: `npm audit fix`

## 📈 مانیتورینگ

```bash
# استفاده از PM2 monitoring
pm2 install pm2-logrotate  # چرخش خودکار لاگ‌ها

# تنظیم آلارم برای restart
pm2 startup
pm2 save
```

## ✅ Checklist نهایی

- [ ] Node backend روی پورت 3001 در حال اجرا است
- [ ] PM2 به درستی پیکربندی شده
- [ ] Apache/Nginx proxy به درستی کار می‌کند
- [ ] CORS origins صحیح تنظیم شده
- [ ] Database connection برقرار است
- [ ] SSL Certificate فعال است
- [ ] Frontend build شده و سرو می‌شود
- [ ] API health check کار می‌کند: `/api/health`
- [ ] تست login و authentication
- [ ] تست Bible API: `/api/bible/books`

## 🆘 پشتیبانی

در صورت بروز مشکل:
1. لاگ‌های PM2 را چک کنید: `pm2 logs --lines 100`
2. لاگ‌های Apache/Nginx را بررسی کنید
3. دسترسی database را تست کنید
4. CORS و firewall را چک کنید

---

**📝 نکته:** همیشه قبل از deploy، یک backup از database و فایل‌های سرور تهیه کنید!

**🔗 لینک‌های مفید:**
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [A2 Hosting Node.js Guide](https://www.a2hosting.com/kb/developer-corner/nodejs)
- [Supabase Connection Guide](https://supabase.com/docs/guides/database/connecting-to-postgres)
