-- Bible Database Schema
-- Supports multiple languages with word-level timestamps for TTS synchronization

-- Drop existing tables if they exist
DROP TABLE IF EXISTS bible_word_timestamps CASCADE;
DROP TABLE IF EXISTS bible_verses CASCADE;
DROP TABLE IF EXISTS bible_chapters CASCADE;
DROP TABLE IF EXISTS bible_books CASCADE;
DROP TABLE IF EXISTS bible_translations CASCADE;

-- Translations table
CREATE TABLE bible_translations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_fa VARCHAR(100),
  language VARCHAR(5) NOT NULL,
  description TEXT,
  year_published INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books table
CREATE TABLE bible_books (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_fa VARCHAR(100),
  testament VARCHAR(2) NOT NULL CHECK (testament IN ('OT', 'NT')),
  book_number INTEGER NOT NULL,
  chapters_count INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chapters table
CREATE TABLE bible_chapters (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES bible_books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  verse_count INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (book_id, chapter_number)
);

-- Verses table (supports multiple languages in one row)
CREATE TABLE bible_verses (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES bible_chapters(id) ON DELETE CASCADE,
  verse_number INTEGER NOT NULL,
  
  -- Text in multiple languages
  text_en TEXT,
  text_fa TEXT,
  text_ar TEXT,
  
  -- Word-level data for TTS (JSON format)
  -- Structure: [{ word: "In", start: 0.0, end: 0.3 }, ...]
  words_en JSONB,
  words_fa JSONB,
  words_ar JSONB,
  
  -- Audio file references (optional pre-recorded audio)
  audio_url_en VARCHAR(500),
  audio_url_fa VARCHAR(500),
  audio_url_ar VARCHAR(500),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (chapter_id, verse_number)
);

-- Word timestamps table (alternative to JSONB for better querying)
CREATE TABLE bible_word_timestamps (
  id SERIAL PRIMARY KEY,
  verse_id INTEGER NOT NULL REFERENCES bible_verses(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL,
  word_index INTEGER NOT NULL,
  word TEXT NOT NULL,
  start_time REAL NOT NULL,  -- in seconds
  end_time REAL NOT NULL,     -- in seconds
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (verse_id, language, word_index)
);

-- Indexes for performance
CREATE INDEX idx_bible_chapters_book ON bible_chapters(book_id);
CREATE INDEX idx_bible_verses_chapter ON bible_verses(chapter_id);
CREATE INDEX idx_bible_verses_text_en ON bible_verses USING gin(to_tsvector('english', text_en));
CREATE INDEX idx_bible_verses_text_fa ON bible_verses USING gin(to_tsvector('simple', text_fa));
CREATE INDEX idx_bible_word_timestamps_verse ON bible_word_timestamps(verse_id);
CREATE INDEX idx_bible_word_timestamps_language ON bible_word_timestamps(language);

-- Insert default translations
INSERT INTO bible_translations (code, name_en, name_fa, language) VALUES
('KJV', 'King James Version', 'نسخه کینگ جیمز', 'en'),
('NIV', 'New International Version', 'ترجمه بین‌المللی نو', 'en'),
('QADIM', 'Qadim (Old Persian)', 'قدیم', 'fa'),
('MOJDEH', 'Mojdeh (Good News)', 'مژده', 'fa'),
('TAFSIRI', 'Tafsiri', 'تفسیری', 'fa');

-- Insert all 66 Bible books
INSERT INTO bible_books (code, name_en, name_fa, testament, book_number, chapters_count) VALUES
-- Old Testament (39 books)
('GEN', 'Genesis', 'پیدایش', 'OT', 1, 50),
('EXO', 'Exodus', 'خروج', 'OT', 2, 40),
('LEV', 'Leviticus', 'لاویان', 'OT', 3, 27),
('NUM', 'Numbers', 'اعداد', 'OT', 4, 36),
('DEU', 'Deuteronomy', 'تثنیه', 'OT', 5, 34),
('JOS', 'Joshua', 'یوشع', 'OT', 6, 24),
('JDG', 'Judges', 'داوران', 'OT', 7, 21),
('RUT', 'Ruth', 'روت', 'OT', 8, 4),
('1SA', '1 Samuel', 'اول سموئیل', 'OT', 9, 31),
('2SA', '2 Samuel', 'دوم سموئیل', 'OT', 10, 24),
('1KI', '1 Kings', 'اول پادشاهان', 'OT', 11, 22),
('2KI', '2 Kings', 'دوم پادشاهان', 'OT', 12, 25),
('1CH', '1 Chronicles', 'اول تواریخ', 'OT', 13, 29),
('2CH', '2 Chronicles', 'دوم تواریخ', 'OT', 14, 36),
('EZR', 'Ezra', 'عزرا', 'OT', 15, 10),
('NEH', 'Nehemiah', 'نحمیا', 'OT', 16, 13),
('EST', 'Esther', 'استر', 'OT', 17, 10),
('JOB', 'Job', 'ایوب', 'OT', 18, 42),
('PSA', 'Psalms', 'مزامیر', 'OT', 19, 150),
('PRO', 'Proverbs', 'امثال', 'OT', 20, 31),
('ECC', 'Ecclesiastes', 'جامعه', 'OT', 21, 12),
('SNG', 'Song of Solomon', 'غزل غزلها', 'OT', 22, 8),
('ISA', 'Isaiah', 'اشعیا', 'OT', 23, 66),
('JER', 'Jeremiah', 'ارمیا', 'OT', 24, 52),
('LAM', 'Lamentations', 'مراثی ارمیا', 'OT', 25, 5),
('EZK', 'Ezekiel', 'حزقیال', 'OT', 26, 48),
('DAN', 'Daniel', 'دانیال', 'OT', 27, 12),
('HOS', 'Hosea', 'هوشع', 'OT', 28, 14),
('JOL', 'Joel', 'یوئیل', 'OT', 29, 3),
('AMO', 'Amos', 'عاموس', 'OT', 30, 9),
('OBA', 'Obadiah', 'عوبدیا', 'OT', 31, 1),
('JON', 'Jonah', 'یونس', 'OT', 32, 4),
('MIC', 'Micah', 'میکاه', 'OT', 33, 7),
('NAM', 'Nahum', 'ناحوم', 'OT', 34, 3),
('HAB', 'Habakkuk', 'حبقوق', 'OT', 35, 3),
('ZEP', 'Zephaniah', 'صفنیا', 'OT', 36, 3),
('HAG', 'Haggai', 'حجی', 'OT', 37, 2),
('ZEC', 'Zechariah', 'زکریا', 'OT', 38, 14),
('MAL', 'Malachi', 'ملاکی', 'OT', 39, 4),

-- New Testament (27 books)
('MAT', 'Matthew', 'متی', 'NT', 40, 28),
('MRK', 'Mark', 'مرقس', 'NT', 41, 16),
('LUK', 'Luke', 'لوقا', 'NT', 42, 24),
('JHN', 'John', 'یوحنا', 'NT', 43, 21),
('ACT', 'Acts', 'اعمال رسولان', 'NT', 44, 28),
('ROM', 'Romans', 'رومیان', 'NT', 45, 16),
('1CO', '1 Corinthians', 'اول قرنتیان', 'NT', 46, 16),
('2CO', '2 Corinthians', 'دوم قرنتیان', 'NT', 47, 13),
('GAL', 'Galatians', 'غلاطیان', 'NT', 48, 6),
('EPH', 'Ephesians', 'افسسیان', 'NT', 49, 6),
('PHP', 'Philippians', 'فیلیپیان', 'NT', 50, 4),
('COL', 'Colossians', 'کولسیان', 'NT', 51, 4),
('1TH', '1 Thessalonians', 'اول تسالونیکیان', 'NT', 52, 5),
('2TH', '2 Thessalonians', 'دوم تسالونیکیان', 'NT', 53, 3),
('1TI', '1 Timothy', 'اول تیموتاؤس', 'NT', 54, 6),
('2TI', '2 Timothy', 'دوم تیموتاؤس', 'NT', 55, 4),
('TIT', 'Titus', 'تیطس', 'NT', 56, 3),
('PHM', 'Philemon', 'فلیمون', 'NT', 57, 1),
('HEB', 'Hebrews', 'عبرانیان', 'NT', 58, 13),
('JAS', 'James', 'یعقوب', 'NT', 59, 5),
('1PE', '1 Peter', 'اول پطرس', 'NT', 60, 5),
('2PE', '2 Peter', 'دوم پطرس', 'NT', 61, 3),
('1JN', '1 John', 'اول یوحنا', 'NT', 62, 5),
('2JN', '2 John', 'دوم یوحنا', 'NT', 63, 1),
('3JN', '3 John', 'سوم یوحنا', 'NT', 64, 1),
('JUD', 'Jude', 'یهودا', 'NT', 65, 1),
('REV', 'Revelation', 'مکاشفه', 'NT', 66, 22);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bible_verses
CREATE TRIGGER update_bible_verses_updated_at
  BEFORE UPDATE ON bible_verses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample query to get a complete verse with book/chapter info:
-- SELECT 
--   bb.name_en as book_name,
--   bc.chapter_number,
--   bv.verse_number,
--   bv.text_en,
--   bv.text_fa,
--   bv.words_en
-- FROM bible_verses bv
-- JOIN bible_chapters bc ON bv.chapter_id = bc.id
-- JOIN bible_books bb ON bc.book_id = bb.id
-- WHERE bb.code = 'JHN' AND bc.chapter_number = 3 AND bv.verse_number = 16;

COMMENT ON TABLE bible_verses IS 'Stores Bible verses with support for multiple languages and TTS word-level timing';
COMMENT ON COLUMN bible_verses.words_en IS 'JSON array of word objects with timing: [{ word: "In", start: 0.0, end: 0.3 }]';
COMMENT ON COLUMN bible_verses.words_fa IS 'JSON array of Persian word objects with timing';
