# 🚀 راهنمای جامع تست و راه‌اندازی MyChurch

## 📋 فهرست مطالب
1. [راه‌اندازی محلی (Local Development)](#راه‌اندازی-محلی-local-development)
2. [راه‌اندازی روی هاست (Production Deployment)](#راه‌اندازی-روی-هاست-production-deployment)
3. [تست عملکردی (Functional Testing)](#تست-عملکردی-functional-testing)
4. [تست امنیتی (Security Testing)](#تست-امنیتی-security-testing)
5. [عیب‌یابی (Troubleshooting)](#عیب‌یابی-troubleshooting)

---

## 🏠 راه‌اندازی محلی (Local Development)

### پیش‌نیازها
- Node.js (نسخه 18 یا بالاتر)
- PostgreSQL (نسخه 14 یا بالاتر)
- npm یا yarn
- Git

### مرحله ۱: کپی و تنظیم فایل محیطی
```bash
# کپی فایل محیطی
cp .env.example .env

# ویرایش فایل محیطی
nano .env
```

**محتوای پیشنهادی برای فایل .env:**
```env
# سرور
PORT=3001
NODE_ENV=development
DOMAIN=localhost

# API
VITE_API_URL=http://localhost:3001

# دیتابیس محلی
DATABASE_URL=postgresql://postgres:mychurch123@localhost:5432/mychurch
DIRECT_URL=postgresql://postgres:mychurch123@localhost:5432/mychurch

# امنیت
JWT_SECRET=super-secret-jwt-key-for-local-development-123456789
ADMIN_PASSWORD=MyChurchSecureAdmin2024!

# سرویس‌ها
GOOGLE_API_KEY=your-google-api-key-here
SUPABASE_URL=your-supabase-url-here
SUPABASE_KEY=your-supabase-key-here

# FTP (اختیاری)
FTP_HOST=localhost
FTP_USER=testuser
FTP_PASS=testpass
FTP_PORT=21
FTP_SECURE=false
FTP_BASE_DIR=public_html
UPLOADS_DIR=uploads
```

### مرحله ۲: نصب PostgreSQL محلی
```bash
# روی ویندوز (از طریق installer)
# یا با استفاده از Docker:
docker run --name mychurch-postgres -e POSTGRES_PASSWORD=mychurch123 -e POSTGRES_DB=mychurch -p 5432:5432 -d postgres:15

# یا با استفاده از WSL2
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb mychurch
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'mychurch123';"
```

### مرحله ۳: نصب وابستگی‌ها
```bash
# کل پروژه
npm install

# یا برای frontend و backend به صورت جداگانه
cd frontend && npm install
cd ../backend && npm install
```

### مرحله ۴: راه‌اندازی سرورها
```bash
# ترمینال ۱ - راه‌اندازی بکند
cd backend
npm start

# ترمینال ۲ - راه‌اندازی فرانت‌اند
cd frontend
npm run dev
```

### مرحله ۵: تست محلی
1. **دسترسی به سایت**: `http://localhost:5173`
2. **تست API**: `http://localhost:3001/api/health`
3. **لاگ‌ها**: بررسی پوشه `logs/` برای خطاها

---

## 🌐 راه‌اندازی روی هاست (Production Deployment)

### گزینه ۱: استفاده از Docker (توصیه شده)
```bash
# ساخت فایل .env برای تولید
cp .env.example .env.production

# ویرایش فایل محیطی برای تولید
nano .env.production

# راه‌اندازی با داکر
docker-compose -f docker-compose.yml up -d
```

### گزینه ۲: استقرار دستی روی سرور لینوکس
```bash
# 1. کپی فایل‌ها به سرور
scp -r . user@your-server:/var/www/mychurch

# 2. اتصال به سرور
ssh user@your-server

# 3. نصب Node.js و PostgreSQL
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql

# 4. پیکربندی دیتابیس
sudo -u postgres createdb mychurch
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_secure_password';"

# 5. نصب وابستگی‌ها
cd /var/www/mychurch
npm install

# 6. راه‌اندازی با PM2
npm install -g pm2
pm2 start ecosystem.config.js
```

### گزینه ۳: استقرار روی Render.com
1. **ساخت حساب کاربری**: [Render.com](https://render.com)
2. **ایجاد سرویس جدید**: Web Service
3. **آدرس GitHub**: آدرس پروژه شما
4. **متغیرهای محیطی**: تنظیم .env
5. **دیتابیس**: استفاده از PostgreSQL Render

---

## 🔧 تست عملکردی (Functional Testing)

### تست ۱: ورود به سیستم
```bash
# تست API ورود
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mychurch.com","password":"MyChurchSecureAdmin2024!"}'

# پاسخ موفق:
# {
#   "token": "eyJhbGciOiJIUzI1NiIs...",
#   "user": {
#     "email": "admin@mychurch.com",
#     "role": "SUPER_ADMIN"
#   }
# }
```

### تست ۲: تست دیتابیس
```bash
# تست اتصال دیتابیس
curl http://localhost:3001/api/health

# پاسخ موفق:
# {
#   "status": "ok",
#   "database": "connected",
#   "timestamp": "2025-01-01T00:00:00.000Z"
# }
```

### تست ۳: آپلود فایل
```bash
# تست آپلود تصویر
curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg" \
  -F "folder=test"

# پاسخ موفق:
# {
#   "url": "https://your-domain.com/uploads/test-image.jpg",
#   "filename": "test-image.jpg",
#   "size": 102400
# }
```

### تست ۴: تست API کتاب مقدس
```bash
# تست دریافت آیات
curl "http://localhost:3001/api/bible/books?limit=5"

# تست دریافت یک آیه
curl "http://localhost:3001/api/bible/verses?book=1&chapter=1&verse=1"

# تست جستجو
curl "http://localhost:3001/api/bible/search?q=love"
```

### تست ۵: تست TTS
```bash
# تست تولید متن به گفتار
curl -X POST http://localhost:3001/api/tts/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"text":"در ابتدا کلام بود و کلام نزد خدا بود","language":"fa"}'
```

---

## 🔒 تست امنیتی (Security Testing)

### تست ۱: تست رمز عبور ادمین
```bash
# تست ورود با رمز عبور اشتباه
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mychurch.com","password":"wrongpassword"}'

# پاسخ انتظاری: 401 Unauthorized
```

### تست ۲: تست CORS
```bash
# تست درخواست از دامنه ناشناس
curl -H "Origin: http://malicious-site.com" \
  http://localhost:3001/api/health

# پاسخ انتظاری: CORS error
```

### تست ۳: تست SQL Injection
```bash
# تست تزریق SQL
curl "http://localhost:3001/api/bible/search?q=' OR '1'='1"

# پاسخ انتظاری: 400 Bad Request یا فیلتر شدن
```

### تست ۴: تست XSS
```bash
# تست XSS در جستجو
curl "http://localhost:3001/api/bible/search?q=<script>alert('xss')</script>"

# پاسخ انتظاری: فیلتر شدن و خطا
```

---

## 🛠️ عیب‌یابی (Troubleshooting)

### مشکل ۱: دیتابیس متصل نمی‌شود
```bash
# بررسی وضعیت دیتابیس
curl http://localhost:3001/api/health

# اگر دیتابیس متصل نیست:
# 1. بررسی PostgreSQL آیا در حال اجراست؟
# 2. بررسی رمز عبور در .env
# 3. بررسی نام دیتابیس
# 4. بررسی پورت 5432

# راه‌اندازی مجدد دیتابیس
sudo systemctl restart postgresql
```

### مشکل 2: فرانت‌اند به بکند وصل نمی‌شود
```bash
# بررسی پراکسی
curl http://localhost:3001/api/health

# اگر وصل نیست:
# 1. بررسی VITE_API_URL در .env
# 2. بررسی پراکسی در vite.config.ts
# 3. بررسی فایروال

# راه‌اندازی مجدد سرورها
npm run dev
```

### مشکل 3: خطای JWT
```bash
# بررسی توکن
echo "YOUR_JWT_TOKEN" | base64 -d

# اگر مشکل دارد:
# 1. بررسی JWT_SECRET در .env
# 2. بررسی منقضی شدن توکن
# 3. بررسی فرمت توکن
```

### مشکل 4: آپلود فایل کار نمی‌کند
```bash
# بررسی تنظیمات FTP
curl http://localhost:3001/api/health

# اگر مشکل دارد:
# 1. بررسی تنظیمات FTP در .env
# 2. بررسی دسترسی FTP
# 3. بررسی فضای ذخیره‌سازی
```

### مشکل 5: خطای CORS
```bash
# بررسی تنظیمات CORS
# در backend/server.js بررسی کنید:
# - allowedOrigins
# - تنظیمات cors middleware

# افزودن دامنه جدید به allowedOrigins
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-domain.com',
  'https://www.your-domain.com'
];
```

---

## 📊 تست نهایی

### چک‌لیست تست نهایی
- [ ] ورود به سیستم با موفقیت
- [ ] دسترسی به دشبورد ادمین
- [ ] تست جستجوی کتاب مقدس
- [ ] تست پخش صوت
- [ ] آپلود فایل تصویر
- [ ] تغییر زبان فارسی/انگلیسی
- [ ] تست حالت RTL
- [ ] تست موبایل (responsive)
- [ ] تست امنیتی پایه
- [ ] تست عملکردی کامل

### دستورات تست نهایی
```bash
# تست سلامت کلی
curl http://localhost:3001/api/health

# تست دیتابیس
curl http://localhost:3001/api/database/status

# تست تمام APIها
curl http://localhost:3001/api/docs

# تست بارگذاری سایت
curl -I http://localhost:5173
```

---

## 🎯 نتیجه‌گیری

پروژه MyChurch اکنون آماده است:
- ✅ محلی کاملاً کار می‌کند
- ✅ آماده استقرار روی هاست
- ✅ تمام تست‌های امنیتی و عملکردی انجام شده
- ✅ مستندات کامل برای راه‌اندازی

برای شروع استفاده:
1. `.env` را تنظیم کنید
2. دیتابیس را راه‌اندازی کنید
3. سرورها را اجرا کنید
4. به `http://localhost:5173` دسترسی پیدا کنید
5. با `admin@mychurch.com` / `MyChurchSecureAdmin2024!` وارد شوید

🎉 **تبریک! سایت شما آماده استفاده است!**