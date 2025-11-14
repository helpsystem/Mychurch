# 🎵 راهنمای تست سیستم سینک سرودهای پرستشی

## ✅ مشکلاتی که برطرف شد:

### 1. **مشکل اصلی: endpoint مفقود**
   - مشکل: `GET /api/worship-songs/:id` موجود نبود
   - حل شده: endpoint به `worshipRoutes.js` اضافه و به سرور آپلود شد
   - تست شد: `curl http://localhost:3001/api/worship-songs/364` درست کار می‌کند

### 2. **مشکل URL نسبی**
   - مشکل: `audioUrl` نسبی بود (مثل `/worship/audio/file.mp3`)
   - حل شده: کد frontend حالا URL نسبی را به URL کامل تبدیل می‌کند

### 3. **مشکل بررسی lyrics**
   - مشکل: اگر lyrics خالی بود، خطا نمی‌داد
   - حل شده: چک اضافه شد که قبل از ارسال، وجود lyrics را بررسی کند

### 4. **پیام‌های بهتر**
   - اضافه شد: پیام "در حال دانلود فایل صوتی..." برای feedback بهتر

---

## 📋 مراحل تست (برای شما):

### مرحله 1: ورود به سیستم
1. به سایت برو: https://samanabyar.online
2. وارد شو با حساب Admin: `help.system@ymail.com` / `Samyar@1989`

### مرحله 2: رفتن به صفحه سینک
1. در منوی بالا، روی آیکون پروفایل کلیک کن
2. از منوی dropdown، گزینه **"Sync Management"** را انتخاب کن
3. صفحه مدیریت همگام‌سازی باید باز شود

### مرحله 3: تست سینک یک سرود
1. لیست سرودها باید نمایش داده شود
2. یکی از سرودهایی که `audioUrl` دارد را انتخاب کن (مثلاً "آزادی در نام توست" - ID: 364)
3. روی دکمه **Refresh** (آیکون چرخش) در ستون Actions کلیک کن
4. مراحل زیر باید نمایش داده شود:
   ```
   ✅ در حال دریافت اطلاعات...
   ✅ در حال دانلود فایل صوتی...
   ✅ آپلود: 0% -> 100%
   ✅ همگام‌سازی موفق
   ```

### مرحله 4: بررسی نتایج
1. اگر سبز شد و پیام "✅ همگام‌سازی موفق" نمایش داد → **موفق!**
2. اگر خطا داد:
   - **Console** مرورگر را باز کن (F12)
   - خطاها را کپی کن و بهم بده
   - Screenshot از خطا بگیر

### مرحله 5: بررسی داده در دیتابیس (اختیاری)
برای اطمینان از ذخیره‌شدن timing، می‌تونی این دستور را اجرا کنی:
```bash
ssh root@samanabyar.online
psql -U myuser -d mychurch -c "SELECT id, title->>'fa' as title, timing_data IS NOT NULL as has_timing FROM worship_songs WHERE id = 364;"
```

---

## 🐛 خطاهای احتمالی و راه حل:

### خطا: "Lyrics not found"
**علت**: سرود انتخابی متن (lyrics) ندارد
**راه حل**: یک سرود دیگه انتخاب کن که متن داره

### خطا: "Audio file not found"
**علت**: سرود فایل صوتی نداره
**راه حل**: یک سرود دیگه انتخاب کن که `audioUrl` داره

### خطا: "Failed to fetch audio: 404"
**علت**: فایل صوتی روی سرور موجود نیست
**راه حل**: مسیر فایل را در دیتابیس درست کن یا فایل را آپلود کن

### خطا: "GEMINI_API_KEY not configured"
**علت**: کلید API Gemini تنظیم نشده
**راه حل**: من چک کردم، کلید موجود است (در `.env` سرور)

### خطا: "401 Unauthorized"
**علت**: لاگین نکردی یا توکن منقضی شده
**راه حل**: دوباره لاگین کن

---

## 🎯 سرودهای پیشنهادی برای تست:

این سرودها `audioUrl` و `lyrics` دارند:

| ID  | عنوان فارسی          | audioUrl                           |
|-----|---------------------|-------------------------------------|
| 364 | آزادی در نام توست    | `/worship/audio/kalameh/نام تو .mp3` |

برای دیدن لیست کامل سرودهای دارای فایل صوتی:
```bash
ssh root@samanabyar.online
psql -U myuser -d mychurch -c "SELECT id, title->>'fa' as title, audiourl FROM worship_songs WHERE audiourl IS NOT NULL LIMIT 10;"
```

---

## 🚀 دستورات مفید (برای آینده):

### مشاهده لاگ‌های backend:
```bash
ssh root@samanabyar.online "pm2 logs mychurch-backend --lines 50"
```

### Restart backend:
```bash
ssh root@samanabyar.online "pm2 restart mychurch-backend"
```

### چک وضعیت PM2:
```bash
ssh root@samanabyar.online "pm2 status"
```

---

## 📝 یادداشت‌های مهم:

1. **اولین بار ممکنه کند باشه**: پردازش AI اولین سرود ممکنه 30-60 ثانیه طول بکشه
2. **Cache مرورگر**: اگر صفحه قدیمی رو می‌بینی، `Ctrl+Shift+R` بزن
3. **Timeout**: اگر بیش از 2 دقیقه طول کشید، احتمالاً مشکل از API Gemini است
4. **Batch Processing**: می‌تونی چندتا سرود رو با هم انتخاب کنی و همه رو یکجا پردازش کنی

---

## ✨ تغییرات اعمال شده در این آپدیت:

### Backend:
- ✅ `worshipRoutes.js`: اضافه شدن `GET /api/worship-songs/:id`
- ✅ `audioSyncRoutes.js`: موجود بود، نیاز به تغییر نداشت
- ✅ PM2 restart شد

### Frontend:
- ✅ `AdminSyncManagementPage.tsx`: 
  - اضافه شدن تبدیل URL نسبی به کامل
  - اضافه شدن چک برای وجود lyrics
  - بهبود پیام‌های progress
- ✅ Build جدید: `index-BenzhXx5.js`
- ✅ Deploy به production

---

## 🆘 اگر مشکلی بود:

1. **Console** مرورگر را چک کن (F12)
2. Screenshot از خطا بگیر
3. لاگ backend را چک کن:
   ```bash
   ssh root@samanabyar.online "pm2 logs mychurch-backend --lines 100"
   ```
4. بهم اطلاع بده تا بررسی کنم

---

**آخرین آپدیت**: 2025-11-10 17:30
**وضعیت**: ✅ آماده برای تست
