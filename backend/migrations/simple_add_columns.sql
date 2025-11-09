-- Simple Migration Part 1: Add essential columns only
-- Date: 2025-11-09

-- Add has_timing column
ALTER TABLE worship_songs ADD COLUMN IF NOT EXISTS has_timing BOOLEAN DEFAULT FALSE;

-- Add timing_data if not exists
ALTER TABLE worship_songs ADD COLUMN IF NOT EXISTS timing_data JSONB DEFAULT NULL;

-- Add timing_updated_at if not exists
ALTER TABLE worship_songs ADD COLUMN IF NOT EXISTS timing_updated_at TIMESTAMP DEFAULT NULL;

-- Add structure column
ALTER TABLE worship_songs ADD COLUMN IF NOT EXISTS structure JSONB DEFAULT NULL;

-- Simple verification
SELECT 
    COUNT(*) as total_songs,
    COUNT(timing_data) FILTER (WHERE timing_data IS NOT NULL) as with_timing
FROM worship_songs;
