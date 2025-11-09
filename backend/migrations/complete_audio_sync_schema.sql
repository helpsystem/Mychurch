-- Complete Migration: Add all audio sync columns
-- Date: 2025-11-09

BEGIN;

-- Add timing columns to worship_songs if they don't exist
DO $$ 
BEGIN
    -- timing_data
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worship_songs' AND column_name = 'timing_data'
    ) THEN
        ALTER TABLE worship_songs ADD COLUMN timing_data JSONB DEFAULT NULL;
        COMMENT ON COLUMN worship_songs.timing_data IS 'Word-level timestamps from AI';
    END IF;

    -- timing_updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worship_songs' AND column_name = 'timing_updated_at'
    ) THEN
        ALTER TABLE worship_songs ADD COLUMN timing_updated_at TIMESTAMP DEFAULT NULL;
        COMMENT ON COLUMN worship_songs.timing_updated_at IS 'Last timing update';
    END IF;

    -- has_timing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worship_songs' AND column_name = 'has_timing'
    ) THEN
        ALTER TABLE worship_songs ADD COLUMN has_timing BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN worship_songs.has_timing IS 'Whether song has timing data';
    END IF;

    -- structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worship_songs' AND column_name = 'structure'
    ) THEN
        ALTER TABLE worship_songs ADD COLUMN structure JSONB DEFAULT NULL;
        COMMENT ON COLUMN worship_songs.structure IS 'Song structure with timing';
    END IF;

    -- Ensure chords exists and is JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worship_songs' AND column_name = 'chords'
    ) THEN
        -- Check if it's TEXT and convert to JSONB
        IF (SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'worship_songs' AND column_name = 'chords') = 'text' 
        THEN
            ALTER TABLE worship_songs ALTER COLUMN chords TYPE JSONB USING 
                CASE 
                    WHEN chords IS NULL OR chords = '' THEN NULL
                    ELSE jsonb_build_object('raw', chords)
                END;
        END IF;
    ELSE
        ALTER TABLE worship_songs ADD COLUMN chords JSONB DEFAULT NULL;
    END IF;
    
    COMMENT ON COLUMN worship_songs.chords IS 'Chord progressions with timing';
END $$;

-- Create bible_audio_timing table if it doesn't exist
CREATE TABLE IF NOT EXISTS bible_audio_timing (
  id SERIAL PRIMARY KEY,
  book VARCHAR(10) NOT NULL,
  chapter INTEGER NOT NULL,
  translation VARCHAR(50) NOT NULL,
  audio_url TEXT,
  timing_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book, chapter, translation)
);

COMMENT ON TABLE bible_audio_timing IS 'Verse and word-level timing for Bible audio';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_worship_timing ON worship_songs(timing_updated_at) WHERE timing_data IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_worship_has_timing ON worship_songs(has_timing) WHERE has_timing = true;
CREATE INDEX IF NOT EXISTS idx_worship_structure ON worship_songs USING GIN(structure) WHERE structure IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_worship_chords ON worship_songs USING GIN(chords) WHERE chords IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bible_timing_lookup ON bible_audio_timing(book, chapter, translation);

-- Update has_timing based on existing data
UPDATE worship_songs 
SET has_timing = true 
WHERE timing_data IS NOT NULL AND has_timing = false;

COMMIT;

-- Verify
SELECT 
    'worship_songs' as table_name,
    COUNT(*) as total_songs,
    COUNT(timing_data) as with_timing,
    COUNT(structure) as with_structure,
    COUNT(chords) as with_chords
FROM worship_songs;

SELECT 
    'bible_audio_timing' as table_name,
    COUNT(*) as total_chapters
FROM bible_audio_timing;
