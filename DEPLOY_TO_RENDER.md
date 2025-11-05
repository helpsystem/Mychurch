# 🚀 Deploy به Render - راهنمای کامل

## 📋 پیش‌نیازها
- ✅ کد شما کامل و آماده است
- ✅ Production build موفق بود
- ✅ GitHub repository موجود است
- ⏱️ زمان: **10 دقیقه**

---

## مرحله 1️⃣: آماده‌سازی Repository

### 1.1 بررسی Git Status
```bash
git status
```

### 1.2 Commit تغییرات (اگر لازم است)
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

---

## مرحله 2️⃣: ساخت حساب Render

### 2.1 ثبت‌نام در Render
1. به [render.com](https://render.com) بروید
2. روی **"Get Started"** کلیک کنید
3. با **GitHub** لاگین کنید (توصیه می‌شود)
4. به GitHub access بدهید

### 2.2 اتصال به Repository
Render خودکار repository های شما را نمایش می‌دهد.

---

## مرحله 3️⃣: Deploy Backend

### 3.1 New Web Service
1. از Dashboard، روی **"New +"** کلیک کنید
2. **"Web Service"** را انتخاب کنید
3. Repository **"Mychurch"** را پیدا کنید
4. روی **"Connect"** کلیک کنید

### 3.2 تنظیمات Service

#### Basic Settings:
- **Name**: `mychurch-backend`
- **Region**: `Oregon` (نزدیک‌ترین به ایران)
- **Branch**: `main`
- **Root Directory**: (خالی بگذارید)

#### Build Settings:
- **Build Command**: 
  ```bash
  npm install
  ```

- **Start Command**:
  ```bash
  node backend/server.js
  ```

#### Advanced Settings:
- **Node Version**: `20` (نسخه پایدارتر از v22)

### 3.3 Environment Variables

روی **"Advanced"** کلیک کنید و این متغیرها را اضافه کنید:

```env
# Required
NODE_ENV=production
PORT=10000

# Supabase Database (از پروژه Supabase خودتان)
SUPABASE_URL=https://wxzhzsqicgwfxffxayhy.supabase.co
SUPABASE_KEY=<YOUR_SUPABASE_ANON_KEY>

# JWT Secret (یک رشته تصادفی 64 کاراکتری)
JWT_SECRET=<GENERATE_RANDOM_STRING>

# CORS Origins
FRONTEND_ORIGIN=https://mychurch-frontend.onrender.com

# Optional - Gemini AI
GEMINI_API_KEY=<YOUR_GEMINI_KEY>

# Optional - Twilio
TWILIO_ACCOUNT_SID=<YOUR_SID>
TWILIO_AUTH_TOKEN=<YOUR_TOKEN>
TWILIO_PHONE_NUMBER=<YOUR_NUMBER>
```

### 3.4 Deploy!
1. روی **"Create Web Service"** کلیک کنید
2. Render شروع به build می‌کند (~2-3 دقیقه)
3. منتظر پیام **"Your service is live 🎉"** بمانید

### 3.5 URL Backend
بعد از deploy موفق، URL شما چیزی شبیه این خواهد بود:
```
https://mychurch-backend.onrender.com
```

**تست کنید:**
```
https://mychurch-backend.onrender.com/api/health
```

---

## مرحله 4️⃣: Deploy Frontend

### گزینه A: Vercel (توصیه می‌شود - سریع‌تر)

#### 4.1 ثبت‌نام در Vercel
1. به [vercel.com](https://vercel.com) بروید
2. با **GitHub** لاگین کنید

#### 4.2 Import Project
1. روی **"Add New Project"** کلیک کنید
2. Repository **"Mychurch"** را انتخاب کنید
3. روی **"Import"** کلیک کنید

#### 4.3 تنظیمات Build

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### 4.4 Environment Variables

```env
VITE_API_URL=https://mychurch-backend.onrender.com
```

#### 4.5 Deploy
1. روی **"Deploy"** کلیک کنید
2. منتظر بمانید (~2 دقیقه)
3. URL شما: `https://mychurch.vercel.app`

---

### گزینه B: Render Static Site

#### 4.1 New Static Site
1. از Dashboard، **"New +"** → **"Static Site"**
2. Repository را انتخاب کنید

#### 4.2 تنظیمات

```
Build Command: npm run build
Publish Directory: dist
```

#### 4.3 Environment Variables

```env
VITE_API_URL=https://mychurch-backend.onrender.com
```

---

## مرحله 5️⃣: به‌روزرسانی CORS

### 5.1 به Backend برگردید
در Render Dashboard:
1. به service **"mychurch-backend"** بروید
2. **Environment** → Edit
3. `FRONTEND_ORIGIN` را به‌روز کنید:
   ```
   https://mychurch.vercel.app
   ```
   یا
   ```
   https://mychurch.onrender.com
   ```

### 5.2 Redeploy
روی **"Manual Deploy"** → **"Deploy latest commit"** کلیک کنید

---

## مرحله 6️⃣: تست سایت

### 6.1 بررسی Backend
```bash
curl https://mychurch-backend.onrender.com/api/health
```

انتظار دارید:
```json
{
  "status": "ok",
  "timestamp": 1730000000000
}
```

### 6.2 بررسی Frontend
1. به URL Frontend بروید
2. صفحه اصلی باز شود
3. منوها کار کنند
4. API callها موفق باشند

### 6.3 تست ویژگی‌ها
- ✅ صفحه اصلی
- ✅ Bible Reader
- ✅ Worship Songs
- ✅ Login/Register
- ✅ Admin Dashboard

---

## 🎉 تبریک! سایت Deploy شد!

### URLs:
- **Frontend**: `https://mychurch.vercel.app`
- **Backend**: `https://mychurch-backend.onrender.com`
- **API Docs**: `https://mychurch-backend.onrender.com/api/health`

---

## 🔧 نکات مهم

### 1. Cold Start
Render free plan بعد از 15 دقیقه بی‌استفاده، سرور را خاموش می‌کند.
اولین request بعد از خاموشی، 30-60 ثانیه طول می‌کشد.

**راه حل**: یک Uptime Monitor رایگان مثل [UptimeRobot](https://uptimerobot.com) استفاده کنید که هر 5 دقیقه یک ping بزند.

### 2. Database Backups
Supabase خودش backup می‌گیرد، اما شما هم می‌توانید:
```bash
pg_dump DATABASE_URL > backup.sql
```

### 3. Logs
در Render Dashboard:
- **Logs** tab → Real-time logs
- خطاها را مانیتور کنید

### 4. Custom Domain (اختیاری)
در Vercel/Render:
- **Settings** → **Domains**
- دامنه سفارشی اضافه کنید (مثلاً `iranchurch.org`)

---

## ⚡ Auto-Deploy

با هر `git push` به `main` branch:
- Render خودکار Backend را rebuild می‌کند
- Vercel خودکار Frontend را rebuild می‌کند

---

## 🆘 عیب‌یابی

### مشکل: Backend deploy نمی‌شود
```bash
# چک کنید Build Logs در Render
# معمولاً مشکل از missing dependencies است
```

### مشکل: Frontend API call نمی‌زند
```bash
# چک کنید VITE_API_URL صحیح است
# چک کنید CORS در backend تنظیم شده
```

### مشکل: Database connection error
```bash
# چک کنید SUPABASE_URL و SUPABASE_KEY
# در Supabase Dashboard → Settings → API
```

---

## 📚 منابع بیشتر

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)

---

**آماده‌اید؟ بیایید شروع کنیم! 🚀**
