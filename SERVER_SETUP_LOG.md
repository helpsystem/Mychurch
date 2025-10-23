# 🚀 Server Setup Log - Production (Samyar Server)

**تاریخ**: اکتبر 23, 2025  
**سرور**: root@samyar  
**IP**: 172.56.2.220

---

## ✅ کارهای انجام شده روی سرور

### 1️⃣ نصب Google Cloud TTS Dependencies

```bash
npm install @google-cloud/text-to-speech
# ✅ Successfully installed (81 packages audited, 0 vulnerabilities)
```

### 2️⃣ Pull کردن آخرین کدها از GitHub

```bash
cd /var/www/samanabyar.online/Mychurch
git stash
git pull origin main  # ✅ 65 files changed, 18115 insertions
git stash pop
git add backend/package-lock.json
git commit -m "Update package-lock.json"
```

### 3️⃣ نصب Dependencies

```bash
# Frontend Dependencies
npm install  # ✅ 446 packages installed

# Backend Dependencies
cd backend
npm install  # ✅ 326 packages installed
npm install @google-cloud/text-to-speech  # ✅ 384 packages installed
```

### 4️⃣ Build Frontend

```bash
npm run build
# ✅ Built successfully in 6.61s
# ✅ Output: dist/ directory created
```

### 5️⃣ Restart Backend with PM2

```bash
pm2 restart mychurch-backend
# ✅ Process restarted successfully
# ✅ Status: online
# ✅ Memory: 72.0mb
# ✅ Uptime: 3h
```

### 6️⃣ تست API Endpoints

```bash
# Health Check
curl http://localhost:3001/api/health
# ✅ Response: {"ok":true,"uptime":14.418408031}

# Bible API
curl http://localhost:3001/api/bible-unified/books
# ✅ Response: {"success":true,"books":[...5 books],"totalBooks":5}
```

### 7️⃣ وضعیت نهایی

**✅ Backend**: Running on port 3001  
**✅ Frontend**: Built and deployed to dist/  
**✅ Database**: Connected to Supabase  
**✅ PM2**: Process running (restart count: 10)  
**✅ Domain**: https://samanabyar.online  

---

## 📋 مراحل بعدی برای Setup سرور

### مرحله 1: پیدا کردن پوشه Backend

```bash
# بررسی محل فعلی
pwd

# لیست پوشه‌ها
ls -la

# پیدا کردن پروژه Mychurch
find /root -name "Mychurch" -type d 2>/dev/null
find /var/www -name "Mychurch" -type d 2>/dev/null
find /home -name "backend" -type d 2>/dev/null
```

### مرحله 2: Clone یا Update کردن پروژه

اگر پروژه روی سرور نیست:
```bash
# رفتن به پوشه مناسب
cd /var/www  # یا /root یا /home

# Clone کردن از GitHub
git clone https://github.com/helpsystem/Mychurch.git
cd Mychurch
```

اگر پروژه هست:
```bash
# پیدا کردن پروژه
cd /path/to/Mychurch

# Pull کردن آخرین تغییرات
git pull origin main
```

### مرحله 3: نصب Dependencies

```bash
# Frontend Dependencies
npm install

# Backend Dependencies
cd backend
npm install
npm install @google-cloud/text-to-speech
cd ..
```

### مرحله 4: تنظیم Environment Variables

```bash
# ساخت فایل .env در پوشه backend
cd backend
nano .env
```

محتوای فایل:
```env
# Database - Supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Google Cloud TTS
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/root/service-account-key.json

# Server
PORT=3001
NODE_ENV=production
JWT_SECRET=your-random-secret-here

# CORS
FRONTEND_URL=https://yourdomain.com
```

### مرحله 5: Upload کردن Google Cloud Service Account Key

```bash
# از Local به Server
# (روی Local Windows این دستور را اجرا کنید):
scp service-account-key.json root@samyar:/root/

# یا استفاده از nano روی سرور:
nano /root/service-account-key.json
# محتوای JSON key را paste کنید
```

### مرحله 6: Build و اجرای پروژه

```bash
cd /path/to/Mychurch

# Build Frontend
npm run build

# اجرای Backend (در Terminal جدید یا با PM2)
cd backend
node server.js

# یا با PM2 (توصیه می‌شود):
pm2 start server.js --name mychurch-backend
pm2 save
pm2 startup
```

### مرحله 7: تنظیم Nginx (اگر دارید)

```bash
nano /etc/nginx/sites-available/mychurch
```

محتوا:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (Static files)
    location / {
        root /path/to/Mychurch/dist;
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
    }
}
```

```bash
# فعال کردن سایت
ln -s /etc/nginx/sites-available/mychurch /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### مرحله 8: SSL با Certbot (اختیاری اما توصیه می‌شود)

```bash
apt update
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔍 دستورات مفید برای تشخیص وضعیت

### چک کردن پروسس‌های در حال اجرا
```bash
# Node processes
ps aux | grep node

# PM2 processes
pm2 list

# پورت 3001
netstat -tulpn | grep 3001
lsof -i :3001
```

### چک کردن لاگ‌ها
```bash
# PM2 logs
pm2 logs mychurch-backend

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# System logs
journalctl -u nginx -f
```

### بررسی فضای دیسک
```bash
df -h
du -sh /path/to/Mychurch
```

---

## 📝 To-Do List برای Server Setup

- [x] ✅ پیدا کردن یا Clone کردن پروژه
- [x] ✅ نصب Dependencies (Frontend + Backend)
- [x] ✅ تنظیم .env با credentials واقعی
- [ ] ⏳ Upload کردن Google Cloud Service Account Key
- [x] ✅ Build کردن Frontend
- [x] ✅ اجرای Backend با PM2
- [x] ✅ تنظیم Nginx Reverse Proxy (قبلاً انجام شده)
- [x] ✅ نصب SSL Certificate (قبلاً انجام شده)
- [x] ✅ تست API endpoints
- [x] ✅ تست Frontend
- [x] ✅ Setup Monitoring (PM2 + Logs)

---

## 🐛 رفع مشکلات احتمالی

### خطا: "Cannot find module"
```bash
cd /path/to/Mychurch
npm install
cd backend
npm install
```

### خطا: "EADDRINUSE ::: 3001"
```bash
# پیدا کردن پروسس
lsof -i :3001
# کشتن پروسس
kill -9 <PID>
```

### خطا: Permission Denied
```bash
# اضافه کردن دسترسی
chmod -R 755 /path/to/Mychurch
chown -R www-data:www-data /path/to/Mychurch/dist
```

---

**آخرین بروزرسانی**: اکتبر 23, 2025
