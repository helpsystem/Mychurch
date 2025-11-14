-- Migration: Create sync_jobs table for background processing
-- Purpose: Queue system for automatic worship song processing

CREATE TABLE IF NOT EXISTS sync_jobs (
    id SERIAL PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL, -- 'worship_song', 'bible_chapter'
    entity_id INTEGER NOT NULL, -- ID of worship_song or bible chapter
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    result JSONB, -- Store processing results
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX idx_sync_jobs_type_id ON sync_jobs(job_type, entity_id);
CREATE INDEX idx_sync_jobs_created_at ON sync_jobs(created_at DESC);

-- Add auto_sync flag to worship_songs
ALTER TABLE worship_songs 
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT true;

-- Add processing status to worship_songs
ALTER TABLE worship_songs 
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'not_processed'; 
-- 'not_processed', 'queued', 'processing', 'completed', 'failed'

COMMENT ON TABLE sync_jobs IS 'Background job queue for automatic audio synchronization';
COMMENT ON COLUMN sync_jobs.job_type IS 'Type of sync job: worship_song or bible_chapter';
COMMENT ON COLUMN sync_jobs.status IS 'Current status: pending, processing, completed, failed';
COMMENT ON COLUMN sync_jobs.priority IS 'Job priority (1=highest, 10=lowest)';
