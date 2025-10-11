# 🚀 آماده‌سازی نهایی برای Deploy Production

## ✅ وضعیت Git

```
Repository: github.com/helpsystem/Mychurch
Branch: main
Commit: 08446a6
Status: ✅ Pushed to GitHub
Files: 45 files changed (+20,425 lines)
```

---

## 📦 آنچه آماده شد

### 1. **کد منبع**
- ✅ همه فایل‌های جدید commit شدند
- ✅ Push به GitHub موفق بود
- ✅ `.gitignore` برای production تنظیم شد
- ✅ `.env.example` با تنظیمات کامل

### 2. **سیستم‌های پیاده‌سازی شده**
- ✅ Bible AI Chat (9 features)
- ✅ Auto Image Generation (Unsplash)
- ✅ Complete Bible Database (11,745 verses)
- ✅ Dev Server برای توسعه
- ✅ Production Server برای deploy

### 3. **مستندات کامل**
- ✅ `DEPLOYMENT_PRODUCTION.md` - راهنمای deploy
- ✅ `IMAGE_GENERATION_GUIDE.md` - راهنمای تولید عکس
- ✅ `BIBLE_AI_CHAT.md` - API documentation
- ✅ `SUCCESS_IMAGES_GENERATED.md` - خلاصه موفقیت

---

## 🎯 مراحل Deploy به Production

### مرحله 1: آماده‌سازی سرور

```bash
# SSH به سرور
ssh root@samanabyar.online

# ایجاد دایرکتوری پروژه
mkdir -p /var/www/mychurch
cd /var/www/mychurch

# Clone از GitHub
git clone https://github.com/helpsystem/Mychurch.git .
```

### مرحله 2: تنظیمات Environment

```bash
# کپی .env.example به .env
cp .env.example .env

# ویرایش .env با اطلاعات واقعی
nano .env
```

**مقادیر مهم در `.env`:**
```env
# Production
NODE_ENV=production
DOMAIN=samanabyar.online
VITE_API_URL=https://samanabyar.online

# Supabase (از قبل داری)
SUPABASE_URL=wxzhzsqicgwfxffxayhy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_KEY=eyJhbGciOi...

# Unsplash (فعال شده)
UNSPLASH_ACCESS_KEY=jtSyjYHgdbrDcEABb7fVNZb4RneCjHVjRL2TEepcYtQ
UNSPLASH_APPLICATION_ID=815178

# FTP (از قبل داری)
FTP_HOST=ftp.samanabyar.online
FTP_USER=root
FTP_PASS=jIVeuzsrkoWPkhUY
```

### مرحله 3: نصب Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install --production
cd ..
```

### مرحله 4: Build Frontend

```bash
npm run build
# Output: dist/ folder
```

### مرحله 5: تنظیم PM2 برای Backend

```bash
# نصب PM2 (اگر نداری)
npm install -g pm2

# شروع backend
cd backend
pm2 start dev-server.js --name mychurch-api

# Auto-start on reboot
pm2 startup
pm2 save

# چک کردن status
pm2 status
pm2 logs mychurch-api
```

### مرحله 6: تنظیم Nginx

ایجاد `/etc/nginx/sites-available/mychurch`:

```nginx
# Frontend
server {
    listen 80;
    server_name samanabyar.online www.samanabyar.online;
    
    root /var/www/mychurch/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Generated images
    location /generated-images/ {
        alias /var/www/mychurch/public/generated-images/;
        expires 7d;
    }

    gzip on;
    gzip_types text/css application/javascript application/json;
}

# Backend API (optional subdomain)
server {
    listen 80;
    server_name api.samanabyar.online;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /generated-images/ {
        alias /var/www/mychurch/backend/public/generated-images/;
        expires 7d;
    }
}
```

فعال‌سازی:
```bash
sudo ln -s /etc/nginx/sites-available/mychurch /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### مرحله 7: SSL با Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d samanabyar.online -d www.samanabyar.online
```

---

## 🧪 تست Production

### 1. Health Check

```bash
# Frontend
curl -I https://samanabyar.online

# Backend
curl https://samanabyar.online/api/health
# یا اگر subdomain داری:
# curl https://api.samanabyar.online/api/health
```

### 2. Bible API

```bash
curl https://samanabyar.online/api/bible/books
```

### 3. AI Chat

```bash
curl "https://samanabyar.online/api/ai-chat/daily-verse?language=fa"
```

### 4. Images

```bash
curl https://samanabyar.online/api/images/status
curl https://samanabyar.online/api/images/all
```

---

## 🔄 Cron Job برای Auto-Update عکس‌ها

```bash
# ویرایش crontab
crontab -e

# اضافه کردن: هر یکشنبه ساعت 3 صبح
0 3 * * 0 curl -X POST https://samanabyar.online/api/images/generate
```

---

## 📊 Monitoring

### PM2 Dashboard

```bash
# مشاهده لاگ‌ها
pm2 logs mychurch-api

# مانیتور real-time
pm2 monit

# اطلاعات process
pm2 info mychurch-api

# ریستارت در صورت نیاز
pm2 restart mychurch-api
```

### Nginx Logs

```bash
# Error log
tail -f /var/log/nginx/error.log

# Access log
tail -f /var/log/nginx/access.log
```

---

## 🔐 امنیت

### 1. Firewall

```bash
# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

### 2. محافظت از .env

```bash
# اطمینان از عدم دسترسی public
chmod 600 .env
chmod 600 backend/.env
```

### 3. API Rate Limiting

در Nginx اضافه کن:
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20;
}
```

---

## 📋 Checklist نهایی Deploy

### قبل از Deploy:
- [x] کد به GitHub push شد
- [x] `.env.example` آماده است
- [x] Documentation کامل است
- [ ] Supabase database ready است
- [ ] Unsplash production approved شده
- [ ] Domain و SSL آماده است

### حین Deploy:
- [ ] سرور آماده‌سازی شد
- [ ] Dependencies نصب شدند
- [ ] Frontend build شد
- [ ] PM2 backend را اجرا کرد
- [ ] Nginx تنظیم شد
- [ ] SSL certificate دریافت شد

### بعد از Deploy:
- [ ] Frontend accessible است
- [ ] Backend API کار می‌کند
- [ ] Database connected است
- [ ] Images generate می‌شوند
- [ ] AI Chat functional است
- [ ] SSL working است
- [ ] Monitoring setup شده

---

## 🎯 URLs بعد از Deploy

```
Frontend:        https://samanabyar.online
Backend API:     https://samanabyar.online/api
                 (یا https://api.samanabyar.online)
Images:          https://samanabyar.online/generated-images
Health Check:    https://samanabyar.online/api/health
Bible API:       https://samanabyar.online/api/bible/books
AI Chat:         https://samanabyar.online/api/ai-chat/daily-verse
Image Gallery:   https://samanabyar.online/api/images/all
```

---

## 🚨 عیب‌یابی سریع

### Backend متصل نمیشه:
```bash
pm2 logs mychurch-api
pm2 restart mychurch-api
```

### Database error:
```bash
# چک کردن .env
cat backend/.env | grep SUPABASE

# تست connection
curl https://wxzhzsqicgwfxffxayhy.supabase.co
```

### Images generate نمیشن:
```bash
# چک status
curl https://samanabyar.online/api/images/status

# Manual trigger
curl -X POST https://samanabyar.online/api/images/generate

# لاگ‌ها
pm2 logs mychurch-api | grep Image
```

---

## 📞 لینک‌های مهم

- **GitHub**: https://github.com/helpsystem/Mychurch
- **Supabase**: https://app.supabase.com
- **Unsplash**: https://unsplash.com/oauth/applications/815178
- **Documentation**: `/docs` در repository

---

## 🎉 آماده Deploy!

همه چیز commit شده و به GitHub push شده است. 

**مراحل بعدی:**
1. SSH به سرور production
2. Clone از GitHub
3. تنظیم `.env`
4. Build و Deploy
5. تست و بررسی

**موفق باشی! 🚀**

---

**تاریخ آماده‌سازی**: October 11, 2025  
**Commit**: 08446a6  
**Status**: ✅ Ready for Production
