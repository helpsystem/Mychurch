# 🚀 راهنمای Deploy Production - کلیسای مسیحی ایرانیان واشنگتن دی‌سی

## 📋 فهرست

1. [پیش‌نیازها](#پیش-نیازها)
2. [تنظیمات Environment](#تنظیمات-environment)
3. [Build و Deploy](#build-و-deploy)
4. [تنظیمات Production](#تنظیمات-production)
5. [عیب‌یابی](#عیب-یابی)

---

## 🔧 پیش‌نیازها

### 1. سرور Production
- ✅ Node.js 18+ نصب شده
- ✅ PostgreSQL (یا Supabase)
- ✅ دسترسی SSH
- ✅ دامنه و SSL certificate

### 2. API Keys
- ✅ Supabase credentials
- ✅ Unsplash API key (برای تولید عکس)
- ✅ (اختیاری) OpenAI API key

### 3. FTP/SSH Access
- ✅ FTP credentials
- ✅ SSH access به سرور

---

## ⚙️ تنظیمات Environment

### 1. کپی کردن `.env.example` به `.env`

```bash
cp .env.example .env
```

### 2. پر کردن مقادیر واقعی در `.env`

```env
# ============ Server Configuration ============
PORT=3001
NODE_ENV=production
DOMAIN=samanabyar.online

# ============ API Configuration ============
VITE_API_URL=https://samanabyar.online

# ============ Supabase Database ============
SUPABASE_URL=wxzhzsqicgwfxffxayhy.supabase.co
SUPABASE_ANON_KEY=your-real-anon-key
SUPABASE_SERVICE_KEY=your-real-service-key
Publishable_key=your-real-publishable-key

# ============ Image Generation ============
UNSPLASH_ACCESS_KEY=jtSyjYHgdbrDcEABb7fVNZb4RneCjHVjRL2TEepcYtQ
UNSPLASH_APPLICATION_ID=815178
AUTO_GENERATE_IMAGES=true
IMAGE_UPDATE_INTERVAL=604800000  # 7 days

# ============ FTP Configuration ============
FTP_HOST=ftp.samanabyar.online
FTP_USER=root
FTP_PASS=your-ftp-password
FTP_PORT=21
FTP_SECURE=false
FTP_BASE_DIR=public_html/images
UPLOADS_DIR=uploads

# ============ SSH Configuration ============
SSH_HOST=ssh.samanabyar.online
SSH_USER=root
SSH_PORT=22
SSH_pass=your-ssh-password
```

---

## 📦 Build و Deploy

### مرحله 1: Build Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Output: dist/ folder
```

### مرحله 2: آماده‌سازی Backend

```bash
cd backend

# Install production dependencies
npm install --production

# Test backend
npm run dev
```

### مرحله 3: Upload به سرور

#### روش 1: FTP
```bash
# Upload dist/ folder to public_html/
# Upload backend/ folder to server
```

#### روش 2: SSH/SCP
```bash
# Upload frontend
scp -r dist/* root@samanabyar.online:/var/www/html/

# Upload backend
scp -r backend/* root@samanabyar.online:/var/www/api/
```

#### روش 3: Git Deploy
```bash
# در سرور
cd /var/www/mychurch
git pull origin main
npm install
npm run build
pm2 restart mychurch
```

---

## 🔐 تنظیمات Production Server

### 1. نصب PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd /var/www/api/backend
pm2 start server.js --name mychurch-api

# Auto-start on server reboot
pm2 startup
pm2 save
```

### 2. تنظیمات Nginx

```nginx
# /etc/nginx/sites-available/mychurch

# Frontend
server {
    listen 80;
    server_name samanabyar.online www.samanabyar.online;
    
    root /var/www/html;
    index index.html;

    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static files
    location /generated-images/ {
        alias /var/www/html/public/generated-images/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_comp_level 6;
}

# Backend API
server {
    listen 80;
    server_name api.samanabyar.online;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/mychurch /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL با Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d samanabyar.online -d www.samanabyar.online -d api.samanabyar.online

# Auto-renewal (runs automatically)
sudo certbot renew --dry-run
```

---

## 📊 Monitoring و Logging

### 1. PM2 Monitoring

```bash
# View logs
pm2 logs mychurch-api

# Monitor processes
pm2 monit

# Process info
pm2 info mychurch-api

# Restart
pm2 restart mychurch-api

# Stop
pm2 stop mychurch-api
```

### 2. Error Logs

```bash
# Nginx error log
tail -f /var/log/nginx/error.log

# Nginx access log
tail -f /var/log/nginx/access.log

# PM2 error log
pm2 logs mychurch-api --err

# PM2 output log
pm2 logs mychurch-api --out
```

---

## 🎨 Image Generation در Production

### 1. تنظیم Cron Job برای Auto-Update

```bash
# Edit crontab
crontab -e

# اضافه کردن: هر یکشنبه ساعت 3 صبح
0 3 * * 0 curl -X POST https://api.samanabyar.online/api/images/generate

# یا با PM2 cron
pm2 start backend/services/imageCronJob.js --cron "0 3 * * 0" --name image-updater
```

### 2. Unsplash Production

قبل از deploy، حتماً در Unsplash:
1. برو به https://unsplash.com/oauth/applications/815178
2. کلیک "Apply for production"
3. چک‌لیست رو کامل کن:
   - ✅ Hotlink photos
   - ✅ Trigger downloads
   - ✅ Attribution (عکاس + Unsplash)
   - ✅ اسم متفاوت از "Unsplash"

---

## 🔄 Deployment Script

### `deploy.sh`

```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Variables
SERVER="root@samanabyar.online"
REMOTE_DIR="/var/www/mychurch"

# Build frontend
echo "📦 Building frontend..."
npm run build

# Upload files
echo "⬆️  Uploading files..."
scp -r dist/* $SERVER:$REMOTE_DIR/html/
scp -r backend/* $SERVER:$REMOTE_DIR/api/

# Restart services
echo "🔄 Restarting services..."
ssh $SERVER << 'ENDSSH'
cd /var/www/mychurch/api
npm install --production
pm2 restart mychurch-api
sudo systemctl reload nginx
ENDSSH

echo "✅ Deployment complete!"
echo "🌐 Frontend: https://samanabyar.online"
echo "🔌 Backend: https://api.samanabyar.online"
```

### استفاده:

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🗄️ Database Production

### 1. Migration به Supabase

```bash
# Export local data (if needed)
pg_dump -h localhost -U postgres mychurch > backup.sql

# Import to Supabase
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres < backup.sql
```

### 2. Check Database

```bash
# Test connection
curl https://api.samanabyar.online/api/health

# Check Bible data
curl https://api.samanabyar.online/api/bible/books

# Check AI Chat
curl "https://api.samanabyar.online/api/ai-chat/daily-verse?language=fa"
```

---

## ✅ Checklist Deploy

### قبل از Deploy:
- [ ] `.env` با مقادیر production پر شده
- [ ] `npm run build` موفق بود
- [ ] Backend test شده (local)
- [ ] Database migrations اجرا شدند
- [ ] SSL certificate فعال است
- [ ] Unsplash production approved شده

### بعد از Deploy:
- [ ] Frontend accessible است
- [ ] Backend API کار می‌کند
- [ ] Database connected است
- [ ] Images تولید می‌شوند
- [ ] AI Chat کار می‌کند
- [ ] SSL working است
- [ ] PM2 processes running هستند

---

## 🔍 عیب‌یابی

### مشکل 1: Backend متصل نمی‌شود

```bash
# Check PM2
pm2 status
pm2 logs mychurch-api

# Check port
netstat -tulpn | grep 3001

# Restart
pm2 restart mychurch-api
```

### مشکل 2: Database connection error

```bash
# Test Supabase connection
curl -I https://wxzhzsqicgwfxffxayhy.supabase.co

# Check .env
cat backend/.env | grep SUPABASE

# Test from server
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"
```

### مشکل 3: Images not generating

```bash
# Check API key
curl https://api.samanabyar.online/api/images/status

# Manual trigger
curl -X POST https://api.samanabyar.online/api/images/generate

# Check logs
pm2 logs mychurch-api | grep "Image"
```

### مشکل 4: CORS errors

```nginx
# در Nginx config اضافه کن:
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
add_header Access-Control-Allow-Headers 'Content-Type, Authorization';
```

---

## 📈 Performance Optimization

### 1. Caching

```nginx
# Static files
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 7d;
    add_header Cache-Control "public, immutable";
}

# API responses
location /api/ {
    proxy_cache my_cache;
    proxy_cache_valid 200 10m;
}
```

### 2. Compression

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_comp_level 6;
```

### 3. Database Optimization

```sql
-- Index for better performance
CREATE INDEX idx_verses_book_chapter ON verses(book_code, chapter_num);
CREATE INDEX idx_verses_language ON verses(language);
```

---

## 🎯 مراحل نهایی

### 1. تست کامل سیستم

```bash
# Frontend
curl -I https://samanabyar.online

# Backend Health
curl https://api.samanabyar.online/api/health

# Bible API
curl https://api.samanabyar.online/api/bible/books

# AI Chat
curl "https://api.samanabyar.online/api/ai-chat/daily-verse?language=fa"

# Images
curl https://api.samanabyar.online/api/images/all
```

### 2. Google Analytics (اختیاری)

```html
<!-- در index.html اضافه کن -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 3. SEO Optimization

```html
<!-- در index.html -->
<title>کلیسای مسیحی ایرانیان واشنگتن دی‌سی</title>
<meta name="description" content="کلیسای مسیحی ایرانیان واشنگتن دی‌سی - پرستش، دعا، و دستیار هوشمند کتاب مقدس">
<meta property="og:image" content="/generated-images/church-latest.jpg">
```

---

## 🎉 تمام!

سایت شما آماده production است:
- ✅ Frontend: https://samanabyar.online
- ✅ Backend: https://api.samanabyar.online
- ✅ SSL: فعال
- ✅ Database: Supabase
- ✅ Images: Auto-generated
- ✅ AI Chat: فعال

**آماده سرویس‌دهی! 🚀**

---

## 📞 لینک‌های مهم

- **Frontend**: https://samanabyar.online
- **Backend API**: https://api.samanabyar.online
- **Supabase Dashboard**: https://app.supabase.com
- **Unsplash Dashboard**: https://unsplash.com/oauth/applications/815178
- **SSL Status**: https://www.ssllabs.com/ssltest/

---

**ساخته شده با ❤️ برای کلیسای مسیحی ایرانیان واشنگتن دی‌سی**
