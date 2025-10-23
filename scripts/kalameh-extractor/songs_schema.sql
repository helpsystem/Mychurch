-- ================================================================
-- Kalameh Songs Database Schema for Supabase
-- ================================================================
-- Persian Christian Songs Archive from Kalameh.com
-- Supports multilingual (FA/EN), audio/video playback, and lyrics

-- Drop existing tables if needed
DROP TABLE IF EXISTS song_favorites CASCADE;
DROP TABLE IF EXISTS song_playlists CASCADE;
DROP TABLE IF EXISTS songs CASCADE;

-- ================================================================
-- Main Songs Table
-- ================================================================
CREATE TABLE songs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identifiers
  slug TEXT UNIQUE NOT NULL,
  letter TEXT NOT NULL, -- Persian alphabet letter (آ، ا، ب، پ، ...)
  
  -- Titles
  title_fa TEXT NOT NULL,
  title_en TEXT,
  
  -- Artist/Performer
  artist_fa TEXT,
  artist_en TEXT,
  
  -- Content
  lyrics_fa TEXT,
  lyrics_en TEXT,
  description TEXT,
  
  -- Media Files
  audio_url TEXT,
  video_url TEXT,
  ppt_url TEXT,
  chord_url TEXT,
  chord_key TEXT, -- e.g., "Dm", "G", "C#m"
  
  -- Metadata
  duration INTEGER DEFAULT 0, -- in seconds
  bpm INTEGER,
  language TEXT DEFAULT 'fa', -- fa, en, ar, es
  category TEXT, -- worship, praise, christmas, easter, etc.
  tags TEXT[], -- array of tags
  
  -- File paths (relative to storage)
  file_path TEXT,
  thumbnail_url TEXT,
  
  -- Status
  is_published BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  play_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- ================================================================
-- Indexes for Performance
-- ================================================================
CREATE INDEX idx_songs_letter ON songs(letter);
CREATE INDEX idx_songs_title_fa ON songs USING GIN (to_tsvector('simple', title_fa));
CREATE INDEX idx_songs_title_en ON songs USING GIN (to_tsvector('english', title_en));
CREATE INDEX idx_songs_artist ON songs(artist_fa, artist_en);
CREATE INDEX idx_songs_slug ON songs(slug);
CREATE INDEX idx_songs_category ON songs(category);
CREATE INDEX idx_songs_language ON songs(language);
CREATE INDEX idx_songs_published ON songs(is_published, published_at);
CREATE INDEX idx_songs_featured ON songs(featured) WHERE featured = true;
CREATE INDEX idx_songs_tags ON songs USING GIN (tags);

-- ================================================================
-- User Favorites Table
-- ================================================================
CREATE TABLE song_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id BIGINT REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, song_id)
);

CREATE INDEX idx_favorites_user ON song_favorites(user_id);
CREATE INDEX idx_favorites_song ON song_favorites(song_id);

-- ================================================================
-- Playlists Table
-- ================================================================
CREATE TABLE song_playlists (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  song_ids BIGINT[], -- Array of song IDs
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_playlists_user ON song_playlists(user_id);
CREATE INDEX idx_playlists_public ON song_playlists(is_public) WHERE is_public = true;

-- ================================================================
-- TTS Sync Data (for word-level highlighting)
-- ================================================================
CREATE TABLE song_tts_sync (
  id BIGSERIAL PRIMARY KEY,
  song_id BIGINT REFERENCES songs(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'fa',
  sync_data JSONB, -- [{"word": "ای", "start": 0.0, "end": 0.3}, ...]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(song_id, language)
);

CREATE INDEX idx_tts_sync_song ON song_tts_sync(song_id);

-- ================================================================
-- Functions and Triggers
-- ================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER songs_updated_at
BEFORE UPDATE ON songs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER playlists_updated_at
BEFORE UPDATE ON song_playlists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Increment play count
CREATE OR REPLACE FUNCTION increment_song_play_count(song_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE songs 
  SET play_count = play_count + 1 
  WHERE slug = song_slug;
END;
$$ LANGUAGE plpgsql;

-- Search songs function
CREATE OR REPLACE FUNCTION search_songs(
  search_query TEXT,
  search_letter TEXT DEFAULT NULL,
  search_category TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id BIGINT,
  slug TEXT,
  title_fa TEXT,
  title_en TEXT,
  artist_fa TEXT,
  audio_url TEXT,
  video_url TEXT,
  duration INTEGER,
  letter TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.slug,
    s.title_fa,
    s.title_en,
    s.artist_fa,
    s.audio_url,
    s.video_url,
    s.duration,
    s.letter
  FROM songs s
  WHERE 
    s.is_published = true
    AND (
      search_query IS NULL 
      OR s.title_fa ILIKE '%' || search_query || '%'
      OR s.title_en ILIKE '%' || search_query || '%'
      OR s.artist_fa ILIKE '%' || search_query || '%'
      OR s.artist_en ILIKE '%' || search_query || '%'
      OR s.lyrics_fa ILIKE '%' || search_query || '%'
    )
    AND (search_letter IS NULL OR s.letter = search_letter)
    AND (search_category IS NULL OR s.category = search_category)
  ORDER BY s.featured DESC, s.play_count DESC, s.title_fa ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- Row Level Security (RLS) Policies
-- ================================================================

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_playlists ENABLE ROW LEVEL SECURITY;

-- Public read access to published songs
CREATE POLICY "Public songs are viewable by everyone"
ON songs FOR SELECT
USING (is_published = true);

-- Authenticated users can manage favorites
CREATE POLICY "Users can view their own favorites"
ON song_favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create favorites"
ON song_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their favorites"
ON song_favorites FOR DELETE
USING (auth.uid() = user_id);

-- Users can manage their own playlists
CREATE POLICY "Users can view their own playlists"
ON song_playlists FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create playlists"
ON song_playlists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their playlists"
ON song_playlists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their playlists"
ON song_playlists FOR DELETE
USING (auth.uid() = user_id);

-- ================================================================
-- Sample Data (Optional - for testing)
-- ================================================================

INSERT INTO songs (slug, letter, title_fa, title_en, artist_fa, lyrics_fa, audio_url, duration, category, is_published)
VALUES 
  ('ey-isa-nazdam-bia', 'آ', 'ای عیسی نزدم بیا', 'Come To Me Jesus', 'کشیش ادوارد هوسپیان', 
   'ای عیسی نزدم بیا\nبا محبتت بیا\nدر دل من جا بگیر\nتا ابد بمان در من',
   '/audio/songs/ey_isa_nazdam_bia.mp3', 222, 'worship', true),
  
  ('ba-man-baash', 'ب', 'با من باش', 'Be With Me', 'گروه رستاخیز',
   'با من باش تا ابد\nدر هر لحظه در هر دم\nنور راهم باش تو\nامید جانم باش تو',
   '/audio/songs/ba_man_baash.mp3', 195, 'praise', true);

-- ================================================================
-- Grant Permissions
-- ================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON songs TO anon, authenticated;
GRANT ALL ON song_favorites TO authenticated;
GRANT ALL ON song_playlists TO authenticated;
GRANT EXECUTE ON FUNCTION search_songs TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_song_play_count TO anon, authenticated;

-- ================================================================
-- Comments
-- ================================================================

COMMENT ON TABLE songs IS 'Persian Christian songs archive from Kalameh.com';
COMMENT ON COLUMN songs.letter IS 'Persian alphabet letter for categorization';
COMMENT ON COLUMN songs.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN songs.tags IS 'Array of tags for flexible categorization';
COMMENT ON FUNCTION search_songs IS 'Full-text search across songs with filters';
