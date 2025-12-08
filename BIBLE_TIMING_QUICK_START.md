# ⚡ دستورات سریع - تولید Timing کتاب مقدس

## 🚀 اجرای سریع روی سرور

```bash
# 1. اتصال به سرور
ssh root@samanabyar.online

# 2. رفتن به پوشه پروژه
cd /root/Mychurch

# 3. تست (5 کتاب اول)
node scripts/generate-all-bible-timing.cjs --test

# 4. اجرای کامل (همه 1189 فصل)
node scripts/generate-all-bible-timing.cjs

# 5. بررسی نتیجه
ls public/bible/data/timings/*.json | wc -l
```

## 📊 گزینه‌ها

```bash
# حالت تست (5 کتاب)
node scripts/generate-all-bible-timing.cjs --test

# فقط عهد عتیق
node scripts/generate-all-bible-timing.cjs --ot

# فقط عهد جدید
node scripts/generate-all-bible-timing.cjs --nt

# بازنویسی فایل‌های موجود
node scripts/generate-all-bible-timing.cjs --force

# ترکیب
node scripts/generate-all-bible-timing.cjs --nt --force
```

## ⏱️ زمان تخمینی

- **تست (5 کتاب)**: ~2-3 دقیقه
- **همه (66 کتاب)**: ~10-15 دقیقه

## 📁 خروجی

```
/root/Mychurch/public/bible/data/timings/
├── GEN_1_timing.json
├── GEN_2_timing.json
├── ...
└── REV_22_timing.json

Total: 1189 files (~60-120 MB)
```

## ✅ بررسی موفقیت

```bash
# تعداد فایل‌ها
ls public/bible/data/timings/*.json | wc -l
# Expected: 1189

# حجم
du -sh public/bible/data/timings/
# Expected: ~60-120M

# نمونه فایل
cat public/bible/data/timings/GEN_1_timing.json | jq '.metadata'
```

## 🐛 عیب‌یابی سریع

```bash
# بررسی backend
pm2 status
pm2 logs mychurch-backend

# رستارت backend
pm2 restart mychurch-backend

# نصب وابستگی‌ها
npm install node-fetch
```

## 📖 مستندات کامل

برای جزئیات بیشتر: [BIBLE_TIMING_SERVER_GUIDE.md](./BIBLE_TIMING_SERVER_GUIDE.md)

---

**ساخته شده با ❤️ برای Iranian Christian Church DC**
