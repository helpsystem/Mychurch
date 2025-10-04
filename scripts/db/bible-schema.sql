-- Bible Books
CREATE TABLE IF NOT EXISTS bible_books (
  id SERIAL PRIMARY KEY,
  source_id INTEGER UNIQUE,
  book_number INTEGER UNIQUE NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_fa VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(10) UNIQUE NOT NULL,
  testament VARCHAR(10) CHECK (testament IN ('old', 'new')) NOT NULL,
  chapters_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bible_books_abbreviation ON bible_books(abbreviation);
CREATE INDEX IF NOT EXISTS idx_bible_books_source_id ON bible_books(source_id);

-- Bible Chapters
CREATE TABLE IF NOT EXISTS bible_chapters (
  id SERIAL PRIMARY KEY,
  source_id INTEGER UNIQUE,
  book_id INTEGER REFERENCES bible_books(id),
  chapter_number INTEGER NOT NULL,
  verses_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id, chapter_number)
);
CREATE INDEX IF NOT EXISTS idx_bible_chapters_book ON bible_chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_bible_chapters_source_id ON bible_chapters(source_id);

-- Bible Verses
CREATE TABLE IF NOT EXISTS bible_verses (
  id SERIAL PRIMARY KEY,
  source_id INTEGER UNIQUE,
  chapter_id INTEGER REFERENCES bible_chapters(id),
  verse_number INTEGER NOT NULL,
  text_en TEXT,
  text_fa TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chapter_id, verse_number)
);
CREATE INDEX IF NOT EXISTS idx_bible_verses_chapter ON bible_verses(chapter_id);
CREATE INDEX IF NOT EXISTS idx_bible_verses_text ON bible_verses USING gin(to_tsvector('english', COALESCE(text_en, '') || ' ' || COALESCE(text_fa, '')));
CREATE INDEX IF NOT EXISTS idx_bible_verses_source_id ON bible_verses(source_id);
