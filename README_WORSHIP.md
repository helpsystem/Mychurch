# 🎵 سیستم مدیریت سرودها — راهنمای سریع

## 🚀 یک کلیک! تمام!

### Windows:
```
دابل کلیک: RUN_ALL.bat
```

این فایل **همه کارها را خودکار** انجام می‌دهد:
- ✅ استخراج 1164 سرود از آرشیو
- ✅ ساخت پروژه React
- ✅ بررسی فایل‌ها
- ✅ راه‌اندازی سرور تست (اختیاری)

---

## 📂 فایل‌های مهم

| فایل | توضیح |
|------|-------|
| `RUN_ALL.bat` | ⭐ **اجرای تمام مراحل** (توصیه می‌شود) |
| `scripts/START_HERE.bat` | فقط استخراج سرودها |
| `FINAL_STEPS.md` | راهنمای کامل مرحله به مرحله |
| `WORSHIP_SETUP_GUIDE.md` | مستندات کامل سیستم |

---

## 🎯 مراحل دستی (اگر RUN_ALL کار نکرد)

### 1️⃣ استخراج سرودها
```cmd
cd scripts
START_HERE.bat
```

### 2️⃣ ساخت پروژه
```cmd
npm run build
```

### 3️⃣ تست
```cmd
cd dist
python -m http.server 8080
```

سپس: `http://localhost:8080/#/worship`

---

## ✅ بررسی موفقیت

بعد از اجرا، این فایل‌ها باید وجود داشته باشند:

```
✅ dist/worship/data/worship_songs.json
✅ dist/worship/audio/*.mp3 (تعداد زیاد)
✅ dist/worship/pptx/*.pptx (تعداد زیاد)
✅ dist/worship/lyrics/*.txt
```

---

## 🐛 مشکل داری؟

### ❌ Python یافت نشد
```
📥 دانلود: https://www.python.org/downloads/
✅ حتماً گزینه "Add to PATH" را تیک بزنید
```

### ❌ npm یافت نشد
```
📥 دانلود Node.js: https://nodejs.org/
```

### ❌ فایل HTML یافت نشد
```
🔧 مسیر را در extract_worship_songs.py ویرایش کنید:
   BASE_DIR = r"مسیر آرشیو شما"
```

---

## 📖 راهنماهای بیشتر

- **راهنمای کامل:** `FINAL_STEPS.md`
- **Setup کامل:** `WORSHIP_SETUP_GUIDE.md`
- **مستندات اسکریپت:** `scripts/README_EXTRACTOR.md`
- **شروع سریع:** `scripts/README_QUICK_START.md`

---

## 🎉 موفق باشی!

**همین الان شروع کن:** دابل کلیک `RUN_ALL.bat` 🚀
