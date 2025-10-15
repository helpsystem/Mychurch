-- Enhanced Bible Database Schema for Modern Interactive Features
-- Execute this to upgrade the existing database

-- Users table for authentication and profiles
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    avatar_url TEXT,
    preferred_language VARCHAR(10) DEFAULT 'fa',
    preferred_translation VARCHAR(50) DEFAULT 'pcb',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- User sessions for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    device_info JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Verse highlights with colors and categories
CREATE TABLE IF NOT EXISTS verse_highlights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    translation_code VARCHAR(50) NOT NULL REFERENCES bible_translations(code),
    book_code VARCHAR(10) NOT NULL,
    chapter_number INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    highlight_color VARCHAR(20) DEFAULT 'yellow', -- yellow, blue, green, pink, orange, purple
    highlight_type VARCHAR(20) DEFAULT 'background', -- background, underline, border
    selection_start INTEGER, -- Character position start
    selection_end INTEGER,   -- Character position end
    selected_text TEXT,      -- The actual highlighted text portion
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure unique highlight per user per verse section
    UNIQUE(user_id, translation_code, book_code, chapter_number, verse_number, selection_start, selection_end)
);

-- Personal notes and annotations
CREATE TABLE IF NOT EXISTS verse_notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    translation_code VARCHAR(50) NOT NULL REFERENCES bible_translations(code),
    book_code VARCHAR(10) NOT NULL,
    chapter_number INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    note_title VARCHAR(200),
    note_content TEXT NOT NULL,
    note_type VARCHAR(20) DEFAULT 'personal', -- personal, study, prayer, question
    is_private BOOLEAN DEFAULT true,
    tags TEXT[], -- Array of tags for organization
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Personal Bible collections (like bookmarks but more advanced)
CREATE TABLE IF NOT EXISTS personal_collections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collection_name VARCHAR(200) NOT NULL,
    description TEXT,
    color_theme VARCHAR(20) DEFAULT 'blue',
    is_public BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Items in personal collections
CREATE TABLE IF NOT EXISTS collection_items (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES personal_collections(id) ON DELETE CASCADE,
    translation_code VARCHAR(50) NOT NULL REFERENCES bible_translations(code),
    book_code VARCHAR(10) NOT NULL,
    chapter_number INTEGER NOT NULL,
    verse_number INTEGER,
    item_type VARCHAR(20) DEFAULT 'verse', -- verse, chapter, passage
    note TEXT,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMP DEFAULT NOW()
);

-- Reading progress tracking
CREATE TABLE IF NOT EXISTS reading_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    translation_code VARCHAR(50) NOT NULL REFERENCES bible_translations(code),
    book_code VARCHAR(10) NOT NULL,
    chapter_number INTEGER NOT NULL,
    verse_number INTEGER,
    progress_percentage DECIMAL(5,2) DEFAULT 0.0,
    time_spent INTEGER DEFAULT 0, -- seconds
    last_read_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint per user per chapter
    UNIQUE(user_id, translation_code, book_code, chapter_number)
);

-- Audio playback history and preferences
CREATE TABLE IF NOT EXISTS audio_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- NULL for guests
    session_id UUID, -- For guest users
    translation_code VARCHAR(50) NOT NULL REFERENCES bible_translations(code),
    book_code VARCHAR(10) NOT NULL,
    chapter_number INTEGER NOT NULL,
    verse_number INTEGER,
    audio_speed DECIMAL(3,2) DEFAULT 1.0,
    voice_preference VARCHAR(50),
    played_at TIMESTAMP DEFAULT NOW()
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    font_family VARCHAR(50) DEFAULT 'Noto Sans',
    font_size INTEGER DEFAULT 16,
    line_height DECIMAL(3,2) DEFAULT 1.6,
    theme VARCHAR(20) DEFAULT 'light', -- light, dark, sepia
    reading_mode VARCHAR(20) DEFAULT 'paginated', -- paginated, scroll, flipbook
    highlight_opacity DECIMAL(3,2) DEFAULT 0.3,
    auto_scroll BOOLEAN DEFAULT false,
    show_verse_numbers BOOLEAN DEFAULT true,
    show_chapter_headers BOOLEAN DEFAULT true,
    preferred_audio_speed DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_verse_highlights_user_translation ON verse_highlights(user_id, translation_code);
CREATE INDEX IF NOT EXISTS idx_verse_highlights_location ON verse_highlights(book_code, chapter_number, verse_number);
CREATE INDEX IF NOT EXISTS idx_verse_notes_user_translation ON verse_notes(user_id, translation_code);
CREATE INDEX IF NOT EXISTS idx_verse_notes_location ON verse_notes(book_code, chapter_number, verse_number);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON reading_progress(user_id, last_read_at DESC);
CREATE INDEX IF NOT EXISTS idx_audio_history_user ON audio_history(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id, sort_order);

-- Update existing bible_verses table if needed
ALTER TABLE bible_verses ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;
ALTER TABLE bible_verses ADD COLUMN IF NOT EXISTS reading_time_seconds INTEGER DEFAULT 0;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_verse_highlights_updated_at ON verse_highlights;
CREATE TRIGGER update_verse_highlights_updated_at BEFORE UPDATE ON verse_highlights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_verse_notes_updated_at ON verse_notes;
CREATE TRIGGER update_verse_notes_updated_at BEFORE UPDATE ON verse_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();