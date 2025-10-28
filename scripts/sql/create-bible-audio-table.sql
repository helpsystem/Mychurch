-- جدول فایل‌های صوتی کتاب مقدس
CREATE TABLE IF NOT EXISTS bible_audio_files (
  id SERIAL PRIMARY KEY,
  book_iso VARCHAR(10) NOT NULL,
  chapter_number INT DEFAULT NULL,  -- NULL = کل کتاب
  language VARCHAR(10) NOT NULL DEFAULT 'fa',
  file_url TEXT NOT NULL,
  file_size BIGINT,
  duration FLOAT,  -- مدت زمان به ثانیه
  source VARCHAR(50) DEFAULT 'wordproject',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(book_iso, chapter_number, language)
);

-- Index برای جستجوی سریع
CREATE INDEX IF NOT EXISTS idx_bible_audio_book_lang ON bible_audio_files(book_iso, language);
CREATE INDEX IF NOT EXISTS idx_bible_audio_chapter ON bible_audio_files(book_iso, chapter_number, language);

-- نظرات
COMMENT ON TABLE bible_audio_files IS 'فایل‌های صوتی کتاب مقدس به زبان‌های مختلف';
COMMENT ON COLUMN bible_audio_files.book_iso IS 'کد ISO کتاب (مثلاً GEN, EXO)';
COMMENT ON COLUMN bible_audio_files.chapter_number IS 'شماره فصل (NULL = کل کتاب)';
COMMENT ON COLUMN bible_audio_files.language IS 'کد زبان (fa, en, ar)';
COMMENT ON COLUMN bible_audio_files.file_url IS 'URL فایل صوتی';
COMMENT ON COLUMN bible_audio_files.duration IS 'مدت زمان به ثانیه';
