# 📖 WordProject Data Import Guide

راهنمای import داده‌های کتاب مقدس از WordProject به دیتابیس Supabase

## 📂 ساختار فایل‌های منبع

```
D:\https___www.wordproject.org_bibles_audio_01_english_index.htm\
├── www.wordproject.org\
│   ├── bibles\
│   │   ├── fa\               # متن فارسی (ترجمه قدیم)
│   │   │   └── 01\
│   │   │       ├── 01_001.html  # پیدایش فصل 1
│   │   │       ├── 01_002.html  # پیدایش فصل 2
│   │   │       └── ...
│   │   ├── kj\               # King James Version (English)
│   │   │   ├── index.html
│   │   │   └── ...
│   │   └── audio\
│   │       └── 20_farsi\     # فایل‌های صوتی فارسی
│   │           ├── 01_001.mp3  # پیدایش فصل 1 (صوتی)
│   │           ├── 01_002.mp3  # پیدایش فصل 2 (صوتی)
│   │           └── ...
```

## 🔧 پیش‌نیازها

### 1. نصب Dependencies

```bash
cd "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch"

# نصب کتابخانه‌های مورد نیاز
npm install cheerio @supabase/supabase-js
```

### 2. تنظیم Environment Variables

فایل `.env` در backend را ویرایش کنید:

```env
SUPABASE_URL=https://wxzhzsqicgwfxffxayhy.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
# یا
SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. آماده‌سازی دیتابیس

اطمینان حاصل کنید که این جداول در Supabase وجود دارند:

- `bible_books` - اطلاعات کتاب‌ها
- `bible_translations` - ترجمه‌های مختلف
- `bible_verses` - آیات کتاب مقدس
- `bible_audio` - لینک‌های فایل‌های صوتی

## 🚀 مراحل Import

### مرحله 1: Import متن آیات (فارسی و انگلیسی)

```bash
# اجرای اسکریپت import
node scripts/import-wordproject-data.js
```

این اسکریپت:
- ✅ تمام فایل‌های HTML را اسکن می‌کند
- ✅ آیات را استخراج می‌کند
- ✅ به دیتابیس Supabase آپلود می‌کند
- ✅ به صورت خودکار book_id و translation_id را تشخیص می‌دهد

**زمان تقریبی:** 30-60 دقیقه (بسته به سرعت اینترنت)

### مرحله 2: Import فایل‌های صوتی

```bash
# اجرای اسکریپت import صوتی
node scripts/import-audio-files.js
```

این اسکریپت:
- ✅ تمام فایل‌های MP3 را پیدا می‌کند
- ✅ به Supabase Storage آپلود می‌کند
- ✅ URL های عمومی را در جدول `bible_audio` ذخیره می‌کند

**زمان تقریبی:** 2-4 ساعت (حجم فایل‌های صوتی زیاد است)

## 📊 بررسی نتایج

### 1. تعداد آیات وارد شده

```sql
SELECT 
  b.book_name as book,
  COUNT(*) as verse_count
FROM bible_verses v
JOIN bible_books b ON v.book_id = b.id
GROUP BY b.book_name
ORDER BY b.book_number;
```

### 2. تعداد فایل‌های صوتی

```sql
SELECT COUNT(*) as audio_count
FROM bible_audio
WHERE language = 'fa';
```

### 3. کتاب‌های ناقص

```sql
-- کتاب‌هایی که آیات فارسی ندارند
SELECT b.book_name, b.book_iso
FROM bible_books b
WHERE NOT EXISTS (
  SELECT 1 FROM bible_verses v
  WHERE v.book_id = b.id AND v.text_fa IS NOT NULL
);
```

## 🔍 ساختار فایل‌های HTML

### نمونه فایل فارسی (`01_001.html`)

```html
<!DOCTYPE html>
<html>
<body>
  <p>
    <span class="verse">1</span>
    در ابتدا، خدا آسمانها و زمین را آفرید.
  </p>
  <p>
    <span class="verse">2</span>
    و زمین، بی‌شکل و خالی بود...
  </p>
</body>
</html>
```

یا:

```html
<verse num="1">در ابتدا، خدا آسمانها و زمین را آفرید.</verse>
<verse num="2">و زمین، بی‌شکل و خالی بود...</verse>
```

## 🎯 کدهای کتاب‌ها (ISO)

| شماره | کد ISO | نام فارسی | نام انگلیسی |
|-------|--------|----------|------------|
| 01 | GEN | پیدایش | Genesis |
| 02 | EXO | خروج | Exodus |
| 03 | LEV | لاویان | Leviticus |
| 04 | NUM | اعداد | Numbers |
| 05 | DEU | تثنیه | Deuteronomy |
| ... | ... | ... | ... |
| 40 | MAT | متی | Matthew |
| 41 | MRK | مرقس | Mark |
| ... | ... | ... | ... |
| 66 | REV | مکاشفه | Revelation |

(لیست کامل در فایل `import-wordproject-data.js` موجود است)

## ⚠️ نکات مهم

### 1. مسیرهای فایل

اگر مسیرهای شما متفاوت است، در فایل‌های اسکریپت تغییر دهید:

```javascript
// در import-wordproject-data.js
const SOURCE_PATHS = {
  farsi: 'مسیر-فایل-های-فارسی',
  english: 'مسیر-فایل-های-انگلیسی',
  audio_farsi: 'مسیر-فایل-های-صوتی'
};
```

### 2. حجم داده

- **متن آیات:** ~5 MB
- **فایل‌های صوتی:** ~2-3 GB

### 3. سرعت آپلود

برای سرعت بیشتر، می‌توانید batch size را تغییر دهید:

```javascript
const batchSize = 100; // افزایش به 500 برای سرعت بیشتر
```

### 4. خطاها

اگر خطایی رخ داد:
- بررسی کنید که مسیرها صحیح هستند
- اطمینان حاصل کنید که Supabase keys درست است
- لاگ‌ها را بررسی کنید

## 🔄 Import مجدد

اگر می‌خواهید دوباره import کنید:

```sql
-- حذف آیات قبلی (احتیاط!)
DELETE FROM bible_verses WHERE translation_id IN (
  SELECT id FROM bible_translations WHERE code IN ('qadim', 'kjv')
);

-- حذف فایل‌های صوتی قبلی
DELETE FROM bible_audio WHERE language = 'fa';
```

سپس اسکریپت‌ها را دوباره اجرا کنید.

## 📞 پشتیبانی

اگر مشکلی پیش آمد:
1. لاگ‌های console را بررسی کنید
2. فایل خطا را مشخص کنید
3. ساختار HTML فایل را چک کنید

## ✅ چک‌لیست نهایی

- [ ] Dependencies نصب شدند
- [ ] Environment variables تنظیم شدند
- [ ] مسیرهای فایل صحیح هستند
- [ ] جداول دیتابیس آماده‌اند
- [ ] اسکریپت متن آیات اجرا شد
- [ ] اسکریپت فایل‌های صوتی اجرا شد
- [ ] داده‌ها در دیتابیس بررسی شدند
- [ ] صفحه Bible در سایت تست شد

## 🎉 تبریک!

اگر همه مراحل با موفقیت انجام شد، الان دارید:
- ✅ 66 کتاب کامل کتاب مقدس
- ✅ ~31,000 آیه به دو زبان فارسی و انگلیسی
- ✅ ~1,189 فایل صوتی فارسی (هر فصل یک فایل)
- ✅ آماده برای استفاده در سایت!

---

**تاریخ ایجاد:** October 28, 2025  
**نسخه:** 1.0.0
