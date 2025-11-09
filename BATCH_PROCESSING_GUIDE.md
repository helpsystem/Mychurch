# 🎯 راهنمای سریع پردازش دسته‌ای محتوا

## مشکل فعلی
به دلیل مشکلات اتصال دیتابیس در محیط local، نمی‌توانیم اسکریپت خودکار را اجرا کنیم.

## ✅ راه حل: استفاده از UI ادمین

### مرحله 1: ورود به پنل ادمین

1. مرورگر را باز کنید
2. به آدرس زیر بروید:
   ```
   http://localhost:5000/#/admin/sync-management
   ```

3. با یکی از این حساب‌ها وارد شوید:
   ```
   Email: help.system@ymail.com
   Password: Samyar@1989
   ```
   یا
   ```
   Email: admin@mychurch.com
   Password: MyChurchSecureAdmin2024!
   ```

### مرحله 2: پردازش سرودها

#### روش 1: پردازش تک به تک (برای تست)
1. لیست سرودها را مشاهده کنید
2. برای هر سرود بدون timing، روی دکمه 🔄 کلیک کنید
3. Progress Bar را مشاهده کنید
4. منتظر بمانید تا ✅ یا ❌ نمایش داده شود

#### روش 2: پردازش دسته‌ای (توصیه می‌شود)
1. تمام سرودها را با checkbox انتخاب کنید (یا فقط آنهایی که ❌ دارند)
2. روی دکمه **"پردازش دسته‌ای (N)"** کلیک کنید
3. منتظر بمانید تا همه پردازش شوند

### مرحله 3: مشاهده نتیجه

- سرودهای موفق: ✅ + تاریخ آخرین همگام‌سازی
- سرودهای ناموفق: ❌ + پیغام خطا
- سرودهای در حال پردازش: ⏳ + درصد Progress

---

## 🚀 اگر می‌خواهید در Production این کار را انجام دهید:

### مرحله 1: Deploy کد جدید
```bash
npm run build
scp -r dist/* root@samanabyar.online:/root/Mychurch/dist/
ssh root@samanabyar.online "cd /root/Mychurch/backend && pm2 restart all"
```

### مرحله 2: اجرای Migration
```bash
ssh root@samanabyar.online
cd /root/Mychurch/backend
node runMigration.js
```

### مرحله 3: پردازش از طریق UI
1. به `https://samanabyar.online/#/admin/sync-management` بروید
2. وارد شوید
3. پردازش دسته‌ای را انجام دهید

---

## 📊 آنچه پردازش می‌شود:

### سرودهای پرستشی:
- فایل صوتی MP3
- متن Finglish (لاتین)
- متن فارسی
- ↓
- Word-level timestamps (با Gemini AI)
- ↓
- ذخیره در `worship_songs.timing_data`

### فصل‌های کتاب مقدس:
- فایل صوتی فصل
- متن آیات از دیتابیس
- ↓
- Verse-level + Word-level timestamps
- ↓
- ذخیره در `bible_audio_timing`

---

## ⚠️ نکات مهم:

1. **Rate Limiting**: بین هر درخواست 2-3 ثانیه صبر کنید
2. **حجم فایل**: حداکثر 20 MB (محدودیت Gemini)
3. **Gemini API Key**: باید در `.env` تنظیم باشد
4. **Fallback**: اگر AI خطا داد، timing تقریبی ایجاد می‌شود
5. **دیتابیس**: تمام timing ها در PostgreSQL ذخیره می‌شوند

---

## 🔧 عیب‌یابی:

### Backend در حال اجرا نیست:
```bash
cd backend
node server.js
```

### Frontend در حال اجرا نیست:
```bash
npm run dev
# یا
serve -s dist -l 5000
```

### خطای Authentication:
- مطمئن شوید وارد شده‌اید
- Token را بررسی کنید (F12 → Application → Cookies)
- مجدداً لاگین کنید

### خطای Gemini API:
- `.env` را بررسی کنید
- `GEMINI_API_KEY` را تأیید کنید
- Quota را چک کنید

---

## ✅ وضعیت فعلی:

- ✅ Backend API: `/api/audio-sync/*` آماده
- ✅ Frontend UI: `AdminSyncManagementPage` آماده
- ✅ Database: Migration اجرا شده
- ✅ Gemini Integration: فعال
- ⚠️ اسکریپت CLI: مشکل اتصال دیتابیس (قابل حل)

**توصیه**: از UI استفاده کنید - راحت‌تر و بصری‌تر است! 🎨
