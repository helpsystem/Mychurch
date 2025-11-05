-- SQL Migration for Worship Audio Suite
-- Add new columns to worship_songs table for AI-generated content

-- Check if columns exist before adding them
DO $$ 
BEGIN
  -- Add finglish_lyrics column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='worship_songs' AND column_name='finglish_lyrics') THEN
    ALTER TABLE worship_songs ADD COLUMN finglish_lyrics TEXT;
  END IF;

  -- Add persian_lyrics column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='worship_songs' AND column_name='persian_lyrics') THEN
    ALTER TABLE worship_songs ADD COLUMN persian_lyrics TEXT;
  END IF;

  -- Add chords column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='worship_songs' AND column_name='chords') THEN
    ALTER TABLE worship_songs ADD COLUMN chords TEXT;
  END IF;

  -- Add audio_url column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='worship_songs' AND column_name='audio_url') THEN
    ALTER TABLE worship_songs ADD COLUMN audio_url TEXT;
  END IF;

  -- Add audio_file_name column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='worship_songs' AND column_name='audio_file_name') THEN
    ALTER TABLE worship_songs ADD COLUMN audio_file_name TEXT;
  END IF;

  -- Add synchronized_data column if not exists (stores word-level timestamps)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='worship_songs' AND column_name='synchronized_data') THEN
    ALTER TABLE worship_songs ADD COLUMN synchronized_data JSONB;
  END IF;

  -- Add duration column if not exists (in seconds)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='worship_songs' AND column_name='duration') THEN
    ALTER TABLE worship_songs ADD COLUMN duration INTEGER;
  END IF;

  -- Add created_by column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='worship_songs' AND column_name='created_by') THEN
    ALTER TABLE worship_songs ADD COLUMN created_by INTEGER REFERENCES users(id);
  END IF;

  -- Add timestamps if not exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='worship_songs' AND column_name='created_at') THEN
    ALTER TABLE worship_songs ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='worship_songs' AND column_name='updated_at') THEN
    ALTER TABLE worship_songs ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create index on JSONB column for faster queries
CREATE INDEX IF NOT EXISTS idx_worship_songs_synchronized_data 
ON worship_songs USING GIN (synchronized_data);

-- Create index on text search columns
CREATE INDEX IF NOT EXISTS idx_worship_songs_title 
ON worship_songs (title);

CREATE INDEX IF NOT EXISTS idx_worship_songs_finglish_lyrics 
ON worship_songs USING GIN (to_tsvector('english', finglish_lyrics));

CREATE INDEX IF NOT EXISTS idx_worship_songs_persian_lyrics 
ON worship_songs USING GIN (to_tsvector('simple', persian_lyrics));

-- Add comment to table
COMMENT ON TABLE worship_songs IS 'Worship songs with AI-generated transcription, translation, chords, and audio synchronization';

-- Add comments to new columns
COMMENT ON COLUMN worship_songs.finglish_lyrics IS 'Phonetic Persian lyrics using English alphabet';
COMMENT ON COLUMN worship_songs.persian_lyrics IS 'Original Persian lyrics in Persian script';
COMMENT ON COLUMN worship_songs.chords IS 'AI-generated chord progression';
COMMENT ON COLUMN worship_songs.audio_url IS 'URL to audio file (local or cloud storage)';
COMMENT ON COLUMN worship_songs.audio_file_name IS 'Original audio file name';
COMMENT ON COLUMN worship_songs.synchronized_data IS 'JSONB object with word-level timestamps: {words: [{word, startTime, endTime}]}';
COMMENT ON COLUMN worship_songs.duration IS 'Duration in seconds';

-- Example synchronized_data structure:
-- {
--   "words": [
--     {"word": "El", "startTime": 0.0, "endTime": 0.2},
--     {"word": "Shaday", "startTime": 0.25, "endTime": 0.6}
--   ],
--   "chords": [
--     {"chord": "C", "position": 0},
--     {"chord": "G", "position": 5}
--   ]
-- }
