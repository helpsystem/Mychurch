# 🚀 راهنمای اجرای اسکریپت تولید Timing روی سرور Production

این راهنما برای تولید فایل‌های Timing برای **همه 1189 فصل کتاب مقدس** روی سرور production است.

## 📋 پیش‌نیازها

- ✅ دسترسی SSH به سرور: `root@samanabyar.online`
- ✅ Backend روی سرور در حال اجراست (PM2)
- ✅ دیتابیس Supabase با همه آیات کتاب مقدس

## 🔧 مرحله 1: اتصال به سرور

```bash
# اتصال به سرور از طریق SSH
ssh root@samanabyar.online

# رفتن به پوشه پروژه
cd /root/Mychurch
```

## 📦 مرحله 2: بررسی محیط

```bash
# بررسی وضعیت backend
pm2 status

# باید ببینید:
# │ mychurch-backend │ online │

# بررسی Node.js version
node --version
# باید v20 یا بالاتر باشد

# بررسی وجود اسکریپت
ls scripts/generate-all-bible-timing.cjs
```

## 🧪 مرحله 3: تست با 5 کتاب اول

قبل از اجرا برای همه، ابتدا تست کنید:

```bash
# تست با 5 کتاب اول (حدود 250 فصل)
node scripts/generate-all-bible-timing.cjs --test

# اگر موفق بود، باید ببینید:
# ✅ Success: ~250 chapters
# 📁 Files: در /root/Mychurch/public/bible/data/timings/
```

**انتظار:** این فرآیند حدود 2-3 دقیقه طول می‌کشد.

## 🚀 مرحله 4: اجرای کامل (همه 1189 فصل)

### گزینه A: اجرای عادی (توصیه می‌شود)

```bash
# اجرا برای همه کتاب‌ها
node scripts/generate-all-bible-timing.cjs

# این فرآیند:
# - همه 66 کتاب را پردازش می‌کند
# - 1189 فایل timing تولید می‌کند
# - حدود 10-15 دقیقه طول می‌کشد
```

### گزینه B: اجرا در پس‌زمینه با nohup

اگر می‌خواهید SSH را ببندید و فرآیند ادامه یابد:

```bash
# اجرا در پس‌زمینه با ذخیره لاگ
nohup node scripts/generate-all-bible-timing.cjs > bible-timing-generation.log 2>&1 &

# یادداشت PID
echo $!

# دیدن لاگ به صورت زنده
tail -f bible-timing-generation.log

# بعداً، بررسی وضعیت:
ps aux | grep generate-all-bible-timing
```

### گزینه C: اجرا با screen (برای مانیتورینگ بهتر)

```bash
# نصب screen اگر نیست
apt-get install screen

# شروع session جدید
screen -S bible-timing

# اجرای اسکریپت
node scripts/generate-all-bible-timing.cjs

# برای Detach: Ctrl+A, سپس D
# برای Attach دوباره: screen -r bible-timing
```

## 📊 مرحله 5: بررسی نتایج

```bash
# تعداد فایل‌های تولید شده
ls public/bible/data/timings/*.json | wc -l
# باید 1189 باشد

# حجم کل
du -sh public/bible/data/timings/
# تقریباً 60-120 MB

# دیدن چند فایل نمونه
ls -lh public/bible/data/timings/ | head -20

# بررسی یک فایل
cat public/bible/data/timings/GEN_1_timing.json | jq '.metadata'
```

## 🎯 گزینه‌های پیشرفته

### فقط عهد عتیق (39 کتاب، ~929 فصل)

```bash
node scripts/generate-all-bible-timing.cjs --ot
```

### فقط عهد جدید (27 کتاب، ~260 فصل)

```bash
node scripts/generate-all-bible-timing.cjs --nt
```

### بازنویسی فایل‌های موجود

```bash
node scripts/generate-all-bible-timing.cjs --force
```

### ترکیب گزینه‌ها

```bash
# فقط عهد جدید + بازنویسی
node scripts/generate-all-bible-timing.cjs --nt --force
```

## 📈 مانیتورینگ در حین اجرا

اگر اسکریپت در حال اجراست، در ترمینال دیگر:

```bash
# بررسی استفاده از CPU و RAM
top -p $(pgrep -f generate-all-bible-timing)

# تعداد فایل‌های تولید شده تا الان
watch -n 5 'ls public/bible/data/timings/*.json | wc -l'

# بررسی لاگ backend (اگر خطایی باشد)
pm2 logs mychurch-backend --lines 50
```

## ⚠️ عیب‌یابی

### مشکل 1: خطای "Cannot find module"

```bash
# نصب وابستگی‌ها
npm install

# یا فقط node-fetch
npm install node-fetch
```

### مشکل 2: API نمی‌دهد پاسخ

```bash
# بررسی وضعیت backend
pm2 status mychurch-backend

# رستارت backend
pm2 restart mychurch-backend

# بررسی لاگ
pm2 logs mychurch-backend --lines 100
```

### مشکل 3: خطای دسترسی به دیتابیس

```bash
# بررسی .env
cat backend/.env | grep DATABASE_URL

# بررسی اتصال دیتابیس
node backend/testDB.js
```

### مشکل 4: فضای دیسک کم

```bash
# بررسی فضای خالی
df -h

# اگر کم است، پاک کردن فایل‌های موقت
rm -rf backend/tmp/*
rm -rf backend/cache/*
```

## ✅ مرحله 6: تأیید موفقیت

بعد از اتمام، باید ببینید:

```
╔══════════════════════════════════════════════════════════════╗
║                    🎉 GENERATION COMPLETE                    ║
╚══════════════════════════════════════════════════════════════╝

📊 Statistics:
   ✅ Success:   1189 chapters
   ⏭️  Skipped:   0 chapters
   ❌ Failed:    0 chapters
   📖 Total:     1189 chapters

📈 Content:
   📝 Verses:    31,102
   🔤 Words:     ~800,000
   ⏱️  Duration:  ~400 hours

⏱️  Performance:
   Time:        ~15 minutes
   Speed:       ~80 chapters/sec
```

## 🔄 مرحله 7: Deploy تغییرات

فایل‌های timing تولید شده هستند، حالا باید آنها را در سایت قابل دسترس کنید:

```bash
# اگر از Git استفاده می‌کنید:
cd /root/Mychurch

# اضافه کردن فایل‌های جدید
git add public/bible/data/timings/

# Commit
git commit -m "✨ Add timing files for all 1189 Bible chapters (Simple Timing)"

# Push (اختیاری - اگر می‌خواهید backup داشته باشید)
# git push origin main
```

**توجه:** اگر نمی‌خواهید فایل‌های timing را در Git بگذارید (حجم زیاد)، فقط آنها را روی سرور نگه دارید.

## 📤 مرحله 8: دانلود فایل‌ها (اختیاری)

اگر می‌خواهید فایل‌ها را روی کامپیوتر خود هم داشته باشید:

```bash
# از کامپیوتر محلی:
scp -r root@samanabyar.online:/root/Mychurch/public/bible/data/timings ./bible-timings/

# یا با tar فشرده کنید و بعد دانلود:
ssh root@samanabyar.online
cd /root/Mychurch/public/bible/data
tar -czf timings.tar.gz timings/
exit

# حالا دانلود:
scp root@samanabyar.online:/root/Mychurch/public/bible/data/timings.tar.gz ./
```

## 🧹 پاکسازی (اگر لازم باشد)

```bash
# حذف همه فایل‌های timing
rm -rf /root/Mychurch/public/bible/data/timings/*.json

# حذف پوشه timing
rm -rf /root/Mychurch/public/bible/data/timings/

# ایجاد دوباره
mkdir -p /root/Mychurch/public/bible/data/timings/
```

## 📝 یادداشت‌های مهم

### ✅ مزایای اجرا روی سرور:
- دسترسی کامل به دیتابیس
- سرعت بالا (CPU قوی‌تر)
- اتصال اینترنت پایدار
- می‌توانید فایل‌ها را مستقیماً در production قرار دهید

### ⚠️ نکات امنیتی:
- بعد از اتمام، فایل‌های لاگ را بررسی کنید
- اگر خطایی بود، آن را fix کنید
- فایل‌های موقت را پاک کنید

### 💾 Backup:
- قبل از اجرای `--force`, بهتر است backup بگیرید:
  ```bash
  cp -r public/bible/data/timings public/bible/data/timings.backup
  ```

## 🎉 تمام!

بعد از اجرای موفق، تمام 1189 فصل کتاب مقدس دارای فایل timing هستند و می‌توانید از آنها در:
- `BibleAudioPlayerWithSync` component
- `BibleAudioSyncTestPage` صفحه تست
- هر صفحه دیگری که بخواهید

استفاده کنید! 🚀

---

## 📞 پشتیبانی

اگر مشکلی داشتید:
1. لاگ‌های backend را بررسی کنید: `pm2 logs mychurch-backend`
2. لاگ اسکریپت را بررسی کنید: `cat bible-timing-generation.log`
3. دیتابیس را تست کنید: `node backend/testDB.js`
4. اسکریپت را دوباره با `--test` اجرا کنید

**موفق باشید! 📖✨**
