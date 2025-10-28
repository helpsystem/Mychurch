# 🎵 راهنمای آپلود فایل‌های صوتی کتاب مقدس

این راهنما نحوه آپلود فایل‌های صوتی کتاب مقدس فارسی WordProject به Supabase را توضیح می‌دهد.

## 📋 پیش‌نیازها

- فایل‌های صوتی WordProject در مسیر:
  ```
  D:\https___www.wordproject.org_bibles_audio_01_english_index.htm\www.wordproject.org\bibles\audio\20_farsi
  ```
- دسترسی به Supabase Dashboard
- Node.js نصب شده باشد

## 🔧 مراحل نصب

### 1️⃣ ساخت جدول در Supabase

**گام اول:** به Supabase Dashboard بروید:
- https://supabase.com/dashboard
- پروژه خود را باز کنید
- از منوی چپ: **SQL Editor** → **New Query**

**گام دوم:** SQL زیر را کپی و اجرا کنید:

```sql
-- جدول فایل‌های صوتی
CREATE TABLE IF NOT EXISTS bible_audio_files (
  id SERIAL PRIMARY KEY,
  book_iso VARCHAR(10) NOT NULL,
  chapter_number INT DEFAULT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'fa',
  file_url TEXT NOT NULL,
  file_size BIGINT,
  duration FLOAT,
  source VARCHAR(50) DEFAULT 'wordproject',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(book_iso, chapter_number, language)
);

-- Indexes برای جستجوی سریع
CREATE INDEX IF NOT EXISTS idx_bible_audio_book_lang ON bible_audio_files(book_iso, language);
CREATE INDEX IF NOT EXISTS idx_bible_audio_chapter ON bible_audio_files(book_iso, chapter_number, language);

-- RLS (Row Level Security) - دسترسی عمومی برای خواندن
ALTER TABLE bible_audio_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON bible_audio_files
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON bible_audio_files
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

**گام سوم:** Storage Bucket بسازید:
- از منوی چپ: **Storage** → **New Bucket**
- نام: `audio-files`
- Public: ✅ (چک باکس را فعال کنید)
- **Create Bucket**

### 2️⃣ بررسی جدول

```bash
node scripts/create-audio-table.cjs
```

اگر جدول وجود داشت، پیام موفقیت می‌بینید.

### 3️⃣ آپلود فایل‌های صوتی

```bash
node scripts/upload-bible-audio.cjs
```

این اسکریپت:
- تمام فایل‌های MP3 را از مسیر WordProject می‌خواند
- هر فایل را به Supabase Storage آپلود می‌کند
- اطلاعات هر فایل را در جدول `bible_audio_files` ثبت می‌کند

**خروجی نمونه:**
```
🎵 شروع آپلود فایل‌های صوتی کتاب مقدس فارسی...

📁 66 فایل MP3 پیدا شد

📤 در حال آپلود: 01.mp3 (GEN) - 45.23 MB
   ✅ موفق: https://...supabase.co/storage/v1/object/public/audio-files/bible/audio/farsi/GEN.mp3
📤 در حال آپلود: 02.mp3 (EXO) - 38.15 MB
   ✅ موفق: https://...supabase.co/storage/v1/object/public/audio-files/bible/audio/farsi/EXO.mp3
...

============================================================
📊 خلاصه:
   ✅ موفق: 66 فایل
   ❌ خطا: 0 فایل
============================================================
```

### 4️⃣ بررسی نتیجه

```bash
# لیست فایل‌های آپلود شده
curl http://localhost:3001/api/bible-audio/list?lang=fa

# آمار کلی
curl http://localhost:3001/api/bible-audio/stats

# دریافت فایل صوتی برای یک کتاب
curl http://localhost:3001/api/bible-audio/book/EPH?lang=fa
```

## 🎯 استفاده در Frontend

### کامپوننت BilingualBiblePresentation

فایل‌های صوتی به صورت خودکار از API دریافت و استفاده می‌شوند:

```typescript
// pages/BilingualPresentationDemo.tsx
const audioResponse = await axios.get(`/api/bible-audio/book/${bookISO}?lang=fa`);
if (audioResponse.data.success) {
  const audioUrl = audioResponse.data.audio.file_url;
  // استفاده از URL برای پخش صدا
}
```

### مثال استفاده:

```tsx
<BilingualBiblePresentation 
  data={{
    book_en: "Ephesians",
    book_fa: "افسسیان",
    chapters: [{
      chapterNumber: 1,
      verses: [{
        verseNumber: 1,
        text_en: "Paul, an apostle...",
        text_fa: "پولس، رسول...",
        audio_fa: "https://...supabase.co/.../EPH.mp3" // 🎵 فایل صوتی
      }]
    }]
  }}
/>
```

## 📡 API Endpoints

### GET `/api/bible-audio/book/:bookISO`
دریافت فایل صوتی کامل یک کتاب

**Query Parameters:**
- `lang` - زبان (پیش‌فرض: `fa`)

**Response:**
```json
{
  "success": true,
  "audio": {
    "id": 1,
    "book_iso": "EPH",
    "language": "fa",
    "file_url": "https://...supabase.co/storage/v1/object/public/audio-files/bible/audio/farsi/EPH.mp3",
    "file_size": 42567891,
    "duration": 1845.5,
    "source": "wordproject"
  }
}
```

### GET `/api/bible-audio/chapter/:bookISO/:chapter`
دریافت فایل صوتی برای یک فصل خاص

**Query Parameters:**
- `lang` - زبان (پیش‌فرض: `fa`)

**Response:** مشابه endpoint بالا

### GET `/api/bible-audio/list`
لیست تمام کتاب‌هایی که فایل صوتی دارند

**Query Parameters:**
- `lang` - زبان (پیش‌فرض: `fa`)

**Response:**
```json
{
  "success": true,
  "books": [
    {
      "book_iso": "GEN",
      "language": "fa",
      "file_count": "1",
      "total_size": "47389234",
      "total_duration": null
    }
  ],
  "total_books": 66
}
```

### GET `/api/bible-audio/stats`
آمار کلی فایل‌های صوتی

**Response:**
```json
{
  "success": true,
  "stats": [
    {
      "language": "fa",
      "total_files": "66",
      "total_books": "66",
      "total_size": "2847392847",
      "avg_duration": null
    }
  ]
}
```

## 🔧 عیب‌یابی

### مشکل: "Cannot find module"
```bash
npm install
```

### مشکل: "Permission denied"
```bash
# Windows PowerShell را به عنوان Administrator اجرا کنید
```

### مشکل: "File not found"
مسیر فایل‌های WordProject را در `scripts/upload-bible-audio.cjs` بررسی کنید:
```javascript
const AUDIO_PATH = 'YOUR_PATH_HERE';
```

### مشکل: "Storage error"
- بررسی کنید که bucket با نام `audio-files` ساخته شده باشد
- بررسی کنید که bucket به صورت Public تنظیم شده باشد

## 📝 نکات مهم

1. **حجم فایل‌ها**: هر فایل حدود 20-50 MB است، آپلود کل کتاب مقدس حدود 2-3 GB حجم دارد
2. **زمان آپلود**: بسته به سرعت اینترنت، ممکنه 30-60 دقیقه طول بکشه
3. **Fallback to TTS**: اگر فایل صوتی موجود نباشد، سیستم به صورت خودکار از Web Speech API استفاده می‌کنه
4. **کش شدن**: بعد از اولین استفاده، مرورگر فایل‌ها رو کش می‌کنه و بارگذاری سریع‌تر می‌شه

## ✅ چک‌لیست

- [ ] جدول `bible_audio_files` در Supabase ساخته شد
- [ ] Storage bucket `audio-files` ساخته شد (Public)
- [ ] فایل‌های صوتی آپلود شدند (66 فایل)
- [ ] API endpoint تست شد
- [ ] Frontend به درستی فایل‌ها رو دریافت می‌کنه
- [ ] صدای فارسی در کامپوننت پخش می‌شه

## 🎉 نتیجه

بعد از تکمیل این مراحل:
- ✅ 66 کتاب کتاب مقدس فایل صوتی فارسی دارند
- ✅ کامپوننت `BilingualBiblePresentation` از فایل‌های واقعی استفاده می‌کنه
- ✅ کیفیت صدا خیلی بهتر از TTS مرورگر است
- ✅ سیستم offline-ready است (با cache مرورگر)

---

**مستندات بیشتر:**
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [PostgreSQL Tables](https://supabase.com/docs/guides/database/tables)
- [WordProject Audio](http://www.wordproject.org/bibles/audio/)
