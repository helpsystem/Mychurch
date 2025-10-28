# 🎯 راهنمای کامل استخراج و آپلود محتوای کتاب مقدس

## 📋 فهرست

1. [نصب و راه‌اندازی](#نصب-و-راه‌اندازی)
2. [استخراج داده‌ها](#استخراج-داده‌ها)
3. [آپلود به Supabase](#آپلود-به-supabase)
4. [ساختار داده‌ها](#ساختار-داده‌ها)
5. [عیب‌یابی](#عیب‌یابی)

---

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها

```bash
# Python 3.10 یا بالاتر
python --version

# pip (package manager)
pip --version
```

### نصب بسته‌های Python

```bash
cd scripts
pip install -r requirements.txt
```

**بسته‌های نصب شده:**
- `beautifulsoup4` - پارس HTML
- `supabase` - اتصال به دیتابیس
- `paramiko` - SFTP (اختیاری)
- `python-dotenv` - مدیریت متغیرهای محیطی

---

## 📊 استخراج داده‌ها

### مرحله 1: اجرای اسکریپت استخراج

```bash
python extract-bible-content.py
```

### عملکرد اسکریپت:

1. ✅ **اسکن پوشه‌ها** - تمام فایل‌های MP3، HTML، TXT را پیدا می‌کند
2. ✅ **استخراج متادیتا** - نام کتاب، فصل، زبان را تشخیص می‌دهد
3. ✅ **پارس HTML** - محتوای متنی را از HTML استخراج می‌کند
4. ✅ **ساخت JSON** - فایل ساختاریافته `bible_complete_index.json` می‌سازد
5. ✅ **گزارش‌دهی** - لاگ کامل و آمار را ذخیره می‌کند

### خروجی‌ها:

```
output/bible_data/
├── bible_complete_index.json    ← داده‌های استخراج شده
├── extraction_log.txt            ← لاگ کامل عملیات
└── create_tables.sql             ← SQL برای ساخت جداول
```

### نمونه خروجی JSON:

```json
{
  "generated_at": "2025-10-27T10:30:00",
  "total_entries": 1290,
  "statistics": {
    "total_files": 1500,
    "mp3_files": 300,
    "html_files": 990
  },
  "entries": [
    {
      "filepath": "D:/bibles/audio/20_farsi/01.mp3",
      "filename": "01.mp3",
      "language": "farsi",
      "book": "Genesis",
      "chapter": 1,
      "book_iso": "GEN",
      "file_type": "mp3",
      "file_size": 5242880,
      "audio_path": "D:/bibles/audio/20_farsi/01.mp3",
      "url": "/audio/bible/farsi/01.mp3"
    }
  ]
}
```

---

## ☁️ آپلود به Supabase

### مرحله 1: تنظیم متغیرهای محیطی

فایل `.env` در ریشه پروژه بسازید:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### مرحله 2: ساخت جداول در Supabase

1. به Supabase Dashboard بروید
2. SQL Editor را باز کنید
3. محتوای `output/bible_data/create_tables.sql` را کپی کنید
4. اجرا کنید

**جداول ساخته شده:**
- `bible_books` - اطلاعات کتاب‌ها
- `bible_chapters` - فصل‌ها با محتوای متنی
- `bible_audio_files` - فایل‌های صوتی

### مرحله 3: اجرای اسکریپت آپلود

```bash
python upload-to-supabase.py
```

### عملکرد اسکریپت:

1. ✅ **خواندن JSON** - داده‌های استخراج شده را بارگذاری می‌کند
2. ✅ **آپلود صوت** - متادیتای فایل‌های MP3 را آپلود می‌کند
3. ✅ **آپلود متن** - محتوای فصل‌ها را ذخیره می‌کند
4. ✅ **Upsert** - اگر رکورد وجود داشت، به‌روز می‌شود
5. ✅ **گزارش** - نتیجه آپلود را نمایش می‌دهد

### خروجی:

```
output/bible_data/
└── upload_log.txt    ← لاگ آپلود
```

---

## 🗂️ ساختار داده‌ها

### جدول `bible_books`

| ستون | نوع | توضیح |
|------|-----|-------|
| id | SERIAL | شناسه یکتا |
| book_name | VARCHAR | نام انگلیسی |
| book_name_fa | VARCHAR | نام فارسی |
| book_iso | VARCHAR | کد ISO (GEN, EXO, ...) |
| book_number | INTEGER | شماره کتاب (1-66) |
| testament | VARCHAR | OT یا NT |

### جدول `bible_chapters`

| ستون | نوع | توضیح |
|------|-----|-------|
| id | SERIAL | شناسه یکتا |
| book_iso | VARCHAR | کد کتاب |
| chapter_number | INTEGER | شماره فصل |
| language | VARCHAR | farsi یا english |
| text_content | TEXT | محتوای متنی |
| audio_url | VARCHAR | URL صوت |

### جدول `bible_audio_files`

| ستون | نوع | توضیح |
|------|-----|-------|
| id | SERIAL | شناسه یکتا |
| book_iso | VARCHAR | کد کتاب |
| chapter_number | INTEGER | شماره فصل |
| language | VARCHAR | زبان |
| filename | VARCHAR | نام فایل |
| filepath | VARCHAR | مسیر کامل (UNIQUE) |
| file_size | INTEGER | حجم فایل (بایت) |
| url | VARCHAR | URL عمومی |

---

## 🔧 تنظیمات پیشرفته

### تغییر مسیرهای ورودی

فایل `extract-bible-content.py` را ویرایش کنید:

```python
CONFIG = {
    "base_dirs": [
        r"D:\your\path\here",
        r"D:\another\path"
    ],
    "output_dir": "output/bible_data"
}
```

### تغییر اندازه Batch در آپلود

فایل `upload-to-supabase.py` را ویرایش کنید:

```python
CONFIG = {
    "batch_size": 100  # تعداد رکورد در هر batch
}
```

### افزودن نگاشت کتاب‌های بیشتر

در `extract-bible-content.py`:

```python
BIBLE_BOOKS = {
    "genesis": {"en": "Genesis", "fa": "پیدایش", "iso": "GEN", "id": 1},
    "exodus": {"en": "Exodus", "fa": "خروج", "iso": "EXO", "id": 2},
    # اضافه کنید...
}
```

---

## 🐛 عیب‌یابی

### خطا: Module not found

```bash
pip install -r requirements.txt
```

### خطا: Supabase connection failed

- بررسی کنید `.env` وجود دارد
- `SUPABASE_URL` و `SUPABASE_ANON_KEY` صحیح هستند
- اینترنت متصل است

### خطا: Permission denied

در Windows:
```bash
# اجرا به عنوان Administrator
python extract-bible-content.py
```

### خطا: Encoding issues (فارسی)

همیشه از `encoding='utf-8'` استفاده می‌شود. اگر مشکل دارید:

```python
# در extract-bible-content.py
with open(file, 'r', encoding='utf-8', errors='ignore') as f:
```

### فایل‌ها پیدا نمی‌شوند

```bash
# بررسی مسیرها
python
>>> import os
>>> os.path.exists(r"D:\your\path")
True  # باید True باشد
```

---

## 📊 گزارش نمونه

### پس از استخراج:

```
╔════════════════════════════════════════════════════════════════╗
║          Bible Content Extraction Report                       ║
╚════════════════════════════════════════════════════════════════╝

📊 Statistics:
   • Total Files Processed: 1500
   • MP3 Audio Files: 300
   • HTML Files: 990
   • Text Files: 210
   • Errors: 5
   • Total Entries: 1290

🌍 Languages:
   • Farsi Entries: 90
   • English Entries: 1200

✅ Extraction Complete!
```

### پس از آپلود:

```
╔════════════════════════════════════════════════════════════════╗
║          Supabase Upload Report                                ║
╚════════════════════════════════════════════════════════════════╝

📊 Statistics:
   • Total Entries: 1290
   • Audio Files Uploaded: 300
   • Chapters Updated: 990
   • Errors: 0

✅ Upload Complete!
```

---

## 🎯 فلوچارت کامل

```
WordProject Files (Local)
          ↓
   [extract-bible-content.py]
     • Scan directories
     • Extract metadata
     • Parse HTML/TXT
     • Generate JSON
          ↓
bible_complete_index.json
          ↓
   [upload-to-supabase.py]
     • Read JSON
     • Batch upload
     • Upsert records
          ↓
    Supabase Database
     • bible_books
     • bible_chapters
     • bible_audio_files
          ↓
   Website (React/API)
     • Fetch from Supabase
     • Display content
     • Play audio
```

---

## 🚀 دستورات سریع

```bash
# نصب
pip install -r requirements.txt

# استخراج
python extract-bible-content.py

# بررسی خروجی
cat output/bible_data/bible_complete_index.json

# ساخت جداول (در Supabase SQL Editor)
# محتوای output/bible_data/create_tables.sql را کپی کنید

# آپلود
python upload-to-supabase.py

# بررسی لاگ
cat output/bible_data/upload_log.txt
```

---

## ✅ چک‌لیست

- [ ] Python 3.10+ نصب شده
- [ ] بسته‌ها نصب شده (`pip install -r requirements.txt`)
- [ ] مسیرهای فایل‌ها در `extract-bible-content.py` تنظیم شده
- [ ] اسکریپت استخراج اجرا شده
- [ ] فایل JSON بررسی شده
- [ ] `.env` با اطلاعات Supabase ساخته شده
- [ ] جداول در Supabase ساخته شده
- [ ] اسکریپت آپلود اجرا شده
- [ ] داده‌ها در Supabase بررسی شده

---

## 📞 پشتیبانی

اگر مشکلی پیش آمد:

1. لاگ فایل‌ها را بررسی کنید (`extraction_log.txt`, `upload_log.txt`)
2. خطا را کپی کرده و جستجو کنید
3. مسیرها و تنظیمات را دوباره چک کنید

**موفق باشید! 🎉**
