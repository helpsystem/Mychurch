# 🚀 راهنمای سریع آپلود صوتی (5 دقیقه)

## گام 1: ساخت جدول (2 دقیقه)

1. برو به: https://supabase.com/dashboard
2. پروژه خودت رو باز کن
3. **SQL Editor** → **New Query**
4. این دستور رو کپی و **Run** کن:

```sql
CREATE TABLE IF NOT EXISTS bible_audio_files (
  id SERIAL PRIMARY KEY,
  book_iso VARCHAR(10) NOT NULL,
  chapter_number INT DEFAULT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'fa',
  file_url TEXT NOT NULL,
  file_size BIGINT,
  duration FLOAT,
  source VARCHAR(50) DEFAULT 'wordproject',
  UNIQUE(book_iso, chapter_number, language)
);

CREATE INDEX idx_bible_audio_book_lang ON bible_audio_files(book_iso, language);

ALTER TABLE bible_audio_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON bible_audio_files FOR SELECT USING (true);
```

## گام 2: ساخت Storage Bucket (1 دقیقه)

1. از منوی چپ: **Storage** → **New Bucket**
2. نام: `audio-files`
3. Public: ✅ (چک کن)
4. **Create Bucket**

## گام 3: آپلود فایل‌ها (2 دقیقه + زمان آپلود)

در PowerShell:

```bash
node scripts/upload-bible-audio.cjs
```

منتظر بمون تا **"✅ موفق: 66 فایل"** رو ببینی

## گام 4: تست

```bash
curl http://localhost:3001/api/bible-audio/stats
```

باید ببینی: `"total_files": "66"`

---

## ✅ تمام!

حالا برو به: http://localhost:5173/#/bible-presentation

و دکمه **▶️ خواندن** رو بزن. صدای فارسی با کیفیت حرفه‌ای پخش می‌شه! 🎉

---

**مشکل داری؟** راهنمای کامل رو بخون: [BIBLE_AUDIO_UPLOAD_GUIDE.md](./BIBLE_AUDIO_UPLOAD_GUIDE.md)
