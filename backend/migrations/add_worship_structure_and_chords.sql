-- Migration: Add structure column to worship_songs
-- This column will store song structure data (intro, verse, chorus, bridge, outro)
-- Date: 2025-11-09

-- Add structure column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worship_songs' AND column_name = 'structure'
    ) THEN
        ALTER TABLE worship_songs ADD COLUMN structure JSONB;
        COMMENT ON COLUMN worship_songs.structure IS 'Song structure: intro, verses, chorus, bridge, outro with timing';
    END IF;
END $$;

-- Update chords to JSONB for better structure
DO $$ 
BEGIN
    -- Check if chords is TEXT type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worship_songs' 
        AND column_name = 'chords' 
        AND data_type = 'text'
    ) THEN
        -- Convert existing TEXT chords to JSONB
        ALTER TABLE worship_songs ALTER COLUMN chords TYPE JSONB USING 
            CASE 
                WHEN chords IS NULL THEN NULL
                WHEN chords = '' THEN NULL
                ELSE ('{"raw": "' || replace(chords, '"', '\"') || '"}')::JSONB
            END;
        COMMENT ON COLUMN worship_songs.chords IS 'Chords data in JSONB format with timing';
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_worship_songs_has_timing ON worship_songs(has_timing) WHERE has_timing = true;
CREATE INDEX IF NOT EXISTS idx_worship_songs_structure ON worship_songs USING GIN(structure) WHERE structure IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_worship_songs_chords ON worship_songs USING GIN(chords) WHERE chords IS NOT NULL;

COMMENT ON TABLE worship_songs IS 'Worship songs with full synchronization: lyrics, timing, chords, structure';

-- Sample query to verify
SELECT 
    id, 
    title, 
    has_timing,
    CASE WHEN timing_data IS NOT NULL THEN 'Yes' ELSE 'No' END as has_timing_data,
    CASE WHEN chords IS NOT NULL THEN 'Yes' ELSE 'No' END as has_chords,
    CASE WHEN structure IS NOT NULL THEN 'Yes' ELSE 'No' END as has_structure
FROM worship_songs
LIMIT 5;
