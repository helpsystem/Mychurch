-- Bible Books Table
CREATE TABLE IF NOT EXISTS bible_books (
    id SERIAL PRIMARY KEY,
    book_number INTEGER NOT NULL,
    name_en TEXT,
    name_fa TEXT,
    testament TEXT,
    abbreviation TEXT,
    chapters_count INTEGER
);

-- Bible Verses Table
CREATE TABLE IF NOT EXISTS bible_verses (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES bible_books(id),
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text_en TEXT,
    text_fa TEXT
);
