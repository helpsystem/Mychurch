-- Migration Part 2: Create bible_audio_timing table
-- Date: 2025-11-09

DO $$
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bible_audio_timing') THEN
        CREATE TABLE bible_audio_timing (
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
        
        COMMENT ON TABLE bible_audio_timing IS 'Verse and word-level timing for Bible audio chapters';
        
        -- Create index
        CREATE INDEX idx_bible_timing_lookup ON bible_audio_timing(book, chapter, translation);
        
        RAISE NOTICE 'Table bible_audio_timing created successfully';
    ELSE
        RAISE NOTICE 'Table bible_audio_timing already exists';
    END IF;
END $$;

-- Verification
SELECT COUNT(*) as total_chapters FROM bible_audio_timing;
