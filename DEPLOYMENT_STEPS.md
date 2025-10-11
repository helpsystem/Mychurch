# مراحل کامل Deployment روی سرور

## قدم 1: اتصال به سرور
```bash
ssh root@samanabyar.online
# پسورد: jIVeuzsrkoWPkhUY
```

## قدم 2: بررسی و ایجاد پوشه پروژه
```bash
cd /var/www
ls -la
# اگر پوشه mychurch وجود ندارد:
mkdir -p mychurch
cd mychurch
```

## قدم 3: Clone کردن Repository از GitHub
```bash
# اگر پروژه وجود ندارد:
git clone https://github.com/helpsystem/Mychurch.git .

# اگر پروژه قبلاً clone شده، فقط pull کنید:
git pull origin main
```

## قدم 4: نصب Node.js (اگر نصب نشده)
```bash
# بررسی نصب Node.js
node --version
npm --version

# اگر نصب نشده، نصب کنید:
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

## قدم 5: نصب Dependencies و Build فرانت‌اند
```bash
# نصب dependencies
npm install

# Build فرانت‌اند
npm run build
```

## قدم 6: تنظیم Backend
```bash
cd backend

# نصب dependencies بک‌اند
npm install --production

# کپی فایل .env (از لوکال به سرور منتقل شود)
# شما باید فایل backend/.env را با اطلاعات Supabase و سایر تنظیمات ایجاد کنید
nano .env
```

### محتوای فایل backend/.env:
```env
PORT=3001
DATABASE_URL="postgresql://postgres.wxzhzsqicgwfxffxayhy:SamyarBB1989@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.wxzhzsqicgwfxffxayhy:SamyarBB1989@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
SUPABASE_URL=https://wxzhzsqicgwfxffxayhy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4emh6c3FpY2d3ZnhmZnhheWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjA3MjksImV4cCI6MjA3NTMzNjcyOX0.fUKJahkSpjqaBaSCP3jukAXkbPcLSUkkcDEtYzF0ShI
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4emh6c3FpY2d3ZnhmZnhheWh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2MDcyOSwiZXhwIjoyMDc1MzM2NzI5fQ.el6gYYLZJTclBDfWePjSNUalX8Z8jSAAF6h1rnoqAuM
JWT_SECRET=eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTc1MzUzNjIyMiwiaWF0IjoxNzUzNTM2MjIyfQ.h0wllgDpFYF4A_Ic8HmfbB0o7GZMq4Cc6Sn-RQCgsZE
DOMAIN=samanabyar.online
FRONTEND_ORIGIN=https://samanabyar.online
FRONTEND_ORIGIN_2=http://localhost:3001
NODE_ENV=production
```

## قدم 7: نصب و راه‌اندازی PM2 (Process Manager)
```bash
# نصب PM2 به صورت global
npm install -g pm2

# راه‌اندازی backend با PM2
cd /var/www/mychurch/backend
pm2 start server.js --name mychurch-backend

# ذخیره تنظیمات PM2 برای راه‌اندازی خودکار
pm2 save
pm2 startup

# بررسی وضعیت
pm2 status
pm2 logs mychurch-backend
```

## قدم 8: نصب و تنظیم Nginx
```bash
# نصب Nginx
apt-get update
apt-get install -y nginx

# ایجاد فایل تنظیمات Nginx
nano /etc/nginx/sites-available/mychurch
```

### محتوای فایل Nginx:
```nginx
server {
    listen 80;
    server_name samanabyar.online www.samanabyar.online;

    # فرانت‌اند (فایل‌های استاتیک)
    root /var/www/mychurch/dist;
    index index.html;

    # Single Page Application fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy برای Backend API
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # فایل‌های استاتیک با کش طولانی
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# فعال‌سازی سایت
ln -s /etc/nginx/sites-available/mychurch /etc/nginx/sites-enabled/

# حذف سایت پیش‌فرض
rm /etc/nginx/sites-enabled/default

# تست تنظیمات Nginx
nginx -t

# راه‌اندازی مجدد Nginx
systemctl restart nginx
systemctl enable nginx
```

## قدم 9: نصب SSL Certificate با Certbot
```bash
# نصب Certbot
apt-get install -y certbot python3-certbot-nginx

# دریافت و نصب خودکار SSL
certbot --nginx -d samanabyar.online -d www.samanabyar.online

# تست تمدید خودکار
certbot renew --dry-run
```

## قدم 10: بررسی نهایی
```bash
# بررسی وضعیت Backend
pm2 status
pm2 logs mychurch-backend --lines 50

# بررسی وضعیت Nginx
systemctl status nginx

# بررسی پورت‌های باز
netstat -tulpn | grep LISTEN

# تست اتصال به Backend
curl http://localhost:3001/api/health

# تست از خارج
curl https://samanabyar.online/api/health
```

## دستورات مفید برای مدیریت

### مدیریت PM2:
```bash
pm2 restart mychurch-backend    # راه‌اندازی مجدد
pm2 stop mychurch-backend       # توقف
pm2 delete mychurch-backend     # حذف
pm2 logs mychurch-backend       # مشاهده لاگ‌ها
```

### به‌روزرسانی پروژه:
```bash
cd /var/www/mychurch
git pull origin main
npm install
npm run build
cd backend
npm install --production
pm2 restart mychurch-backend
```

### مشاهده لاگ‌های Nginx:
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## نکات امنیتی:
1. فایل `.env` را هرگز به Git commit نکنید
2. پسوردها را قوی و منحصر به فرد نگه دارید
3. فایروال را تنظیم کنید (فقط پورت‌های 22, 80, 443 باز باشند)
4. به‌طور منظم backup بگیرید

---

## خلاصه دستورات سریع برای Deployment:

```bash
# اتصال به سرور
ssh root@samanabyar.online

# رفتن به پوشه پروژه
cd /var/www/mychurch

# به‌روزرسانی کد
git pull origin main

# Build فرانت‌اند
npm install
npm run build

# به‌روزرسانی Backend
cd backend
npm install --production
pm2 restart mychurch-backend

# بررسی وضعیت
pm2 status
curl http://localhost:3001/api/health
```
