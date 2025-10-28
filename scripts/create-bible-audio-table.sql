-- جدول فایل‌های صوتی کتاب مقدس
-- این جدول اطلاعات فایل‌های صوتی WordProject را نگهداری می‌کند

CREATE TABLE IF NOT EXISTS bible_audio_files (
  id SERIAL PRIMARY KEY,
  book_iso VARCHAR(10) NOT NULL,              -- کد ISO کتاب (GEN, EXO, ...)
  chapter_number INT DEFAULT NULL,             -- شماره فصل (NULL = کل کتاب)
  language VARCHAR(10) NOT NULL DEFAULT 'fa',  -- زبان (fa, en, ar, ...)
  file_url TEXT NOT NULL,                      -- آدرس فایل صوتی در Supabase Storage
  file_size BIGINT,                            -- حجم فایل به بایت
  duration FLOAT,                              -- مدت زمان صدا به ثانیه
  source VARCHAR(50) DEFAULT 'wordproject',    -- منبع فایل صوتی
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- محدودیت: هر کتاب/فصل/زبان فقط یک فایل صوتی
  UNIQUE(book_iso, chapter_number, language)
);

-- Index برای جستجوی سریع بر اساس کتاب و زبان
CREATE INDEX IF NOT EXISTS idx_bible_audio_book_lang 
  ON bible_audio_files(book_iso, language);

-- Index برای جستجوی سریع بر اساس فصل
CREATE INDEX IF NOT EXISTS idx_bible_audio_chapter 
  ON bible_audio_files(book_iso, chapter_number, language);

-- فعال‌سازی Row Level Security
ALTER TABLE bible_audio_files ENABLE ROW LEVEL SECURITY;

-- Policy: همه می‌توانند فایل‌های صوتی را بخوانند
CREATE POLICY "Enable read access for all users" 
  ON bible_audio_files
  FOR SELECT 
  USING (true);

-- Policy: فقط کاربران احراز هویت شده می‌توانند فایل اضافه کنند
CREATE POLICY "Enable insert for authenticated users only" 
  ON bible_audio_files
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- نمونه داده برای تست (اختیاری)
-- INSERT INTO bible_audio_files (book_iso, language, file_url, file_size) 
-- VALUES ('GEN', 'fa', 'https://...supabase.co/.../GEN.mp3', 47389234);
