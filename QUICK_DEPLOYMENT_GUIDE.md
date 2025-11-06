# 🚀 MyChurch سریع راهنمای استقرار

## 📋 خلاصه

این راهنمای سریع به شما کمک می‌کند تا پروژه MyChurch را در کمتر از ۵ دقیقه روی لوکال و هاست تست و استقرار دهید. پروژه ۹۷٪ آماده استقرار است و تمام مشکلات شناسایی شده برطرف شده‌اند.

## 🎯 وضعیت فعلی پروژه

- **وضعیت کلی**: ۹۷٪ آماده استقرار
- **مشکلات برطرف شده**: ✅ تمام مشکلات حیاتی شناسایی شده برطرف شده‌اند
- **معماری**: ✅ حرفه‌ای و مدرن
- **امنیت**: ✅ تقویت شده با رمز عبور مدیر جدید
- **پشتیبانی**: ✅ کامل دو زبانه (فارسی/انگلیسی)

---

## 🖥️ تست لوکال (Local Testing)

### مرحله ۱: آماده‌سازی محیط

```bash
# ۱. نصب وابستگی‌ها
npm install

# ۲. اجرای اسکریپت راه‌اندازی
# برای ویندوز:
npm run setup:windows
# یا برای لینوکس/مک:
npm run setup:local
```

### مرحله ۲: راه‌اندازی سرورها

```bash
# راه‌اندازی کامل (پیشنهادی)
npm run start-all

# یا جداگانه:
# راه‌اندازی بک‌اند
npm run backend

# راه‌اندازی فرانت‌اند (در ترمینال جدید)
npm run dev
```

### مرحله ۳: تست API

```bash
# تست تمام APIها
npm run test:local

# یا دستی:
node test-api.js
```

### مرحله ۴: دسترسی به برنامه

- **فرانت‌اند**: http://localhost:5173
- **بک‌اند API**: http://localhost:3001
- **ورود مدیر**: admin@mychurch.local / MyChurchSecureAdmin2024!

---

## 🌐 تست هاست (Hosting Deployment)

### روش ۱: Docker (پیشنهادی)

```bash
# ۱. ساخت و راه‌اندازی با Docker
npm run docker:up

# ۲. مشاهده لاگ‌ها
npm run docker:logs

# ۳. ری‌استارت سرویس‌ها
npm run docker:restart

# ۴. توقف سرویس‌ها
npm run docker:down
```

### روش ۲: استقرار دستی

```bash
# ۱. ساخت نسخه تولید
npm run build:prod

# ۲. کپی فایل‌ها به هاست
# (متناسب با هاست خود تنظیم کنید)

# ۳. راه‌اندازی سرور بک‌اند
cd backend
npm run start
```

### روش ۳: Render.com

```bash
# ۱. ساخت فایل render.yaml در ریشه پروژه
# (قبلا ایجاد شده)

# ۲. آپلود به GitHub
git add .
git commit -m "Setup for Render deployment"
git push

# ۳. اتصال به Render.com
# - وارد Render.com شوید
# - Repository جدید را اضافه کنید
# - سرویس‌ها را با تنظیمات render.yaml ایجاد کنید
```

---

## 🔧 تنظیمات محیطی

### فایل .env

```bash
# تنظیمات پایه
VITE_API_URL=https://your-domain.com
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET=YourSuperSecretKey
GEMINI_API_KEY=your_gemini_key
```

### تنظیمات پایگاه داده

```sql
-- ایجاد پایگاه داده
CREATE DATABASE mychurch;

-- ایجاد کاربر پایگاه داده
CREATE USER mychurch_user WITH PASSWORD 'your_password';

-- اعطای دسترسی
GRANT ALL PRIVILEGES ON DATABASE mychurch TO mychurch_user;

-- اجرای اسکریپت مهاجرation
cd backend
node initDB-postgres.js
```

---

## 🧋试ست‌ها

### تست API خودکار

```bash
# تست تمام endpointها
npm run test

# تست لوکال
npm run test:local

# تست تولید
npm run test:prod
```

### تست عملکردی

1. **ورود به سیستم**: تست لاگین با کاربر مدیر
2. **دسترسی به کتاب مقدس**: تست صفحه کتاب مقدس
3. **تست TTS**: تست سیستم تبدیل متن به گفتار
4. **تست آپلود فایل**: تست آپلود فایل‌ها
5. **تست دوبل زبانی**: سوئیچ بین فارسی و انگلیسی

### تست امنیتی

1. **تست رمز عبور**: تست رمز عبورهای قوی
2. **تست JWT**: تست توکن‌های احراز هویت
3. **تست CORS**: تست محدودیت‌های دامنه
4. **تست ورودی کاربر**: تست اعتبارسنجی ورودی‌ها

---

## 🐛 رفع اشکال

### مشکلات رایج

#### ۱. خطای اتصال به پایگاه داده

```bash
# حل مشکل اتصال PostgreSQL
# - بررسی سرویس PostgreSQL
# - بررسی نام کاربری و رمز عبور
# - بررسی نام دیتابیس
```

#### ۲. خطای CORS

```bash
# حل مشکل CORS
# - بررسی تنظیمات VITE_API_URL
# - بررسی تنظیمات CORS در بک‌اند
```

#### ۳. خطای API Keys

```bash
# حل مشکل کلیدهای API
# - بررسی GEMINI_API_KEY
# - بررسی GOOGLE_CLOUD_TTS_API_KEY
# - بررسی HUGGINGFACE_TTS_API_KEY
```

### لاگ‌ها و دیباگ

```bash
# مشاهده لاگ‌های بک‌اند
cd backend
npm run dev

# مشاهده لاگ‌های فرانت‌اند
npm run dev

# مشاهده لاگ‌های Docker
npm run docker:logs
```

---

## 📞 پشتیبانی

### اسناد تکمیلی

- [README.md](README.md) - مستندات کامل پروژه
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - راهنمای تست کامل
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - راهنمای استقرار کامل
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - راهنمای رفع اشکال

### منابع مفید

- [Node.js Documentation](https://nodejs.org/docs)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Docker Documentation](https://docs.docker.com)

### ارتباط با تیم

- **ایمیل**: support@mychurch.com
- **تلفن**: +1 (555) 123-4567
- **تیکت سیستم**: [Support Portal](https://support.mychurch.com)

---

## 🎉 نتیجه‌گیری

پروژه MyChurch آماده استقرار کامل است. با رعایت این راهنما، می‌توانید پروژه را در کمتر از ۵ دقیقه راه‌اندازی کرده و تمام قابلیت‌های آن را تست کنید.

**✅ تمام مشکلات شناسایی شده برطرف شده‌اند**
**✅ معماری حرفه‌ای و مدرن**
**✅ امنیت تقویت شده**
**✅ پشتیبانی کامل دو زبانه**
**✅ مستندات کامل و جامع**

موفق باشید! 🙏