-- Create error_reports table to capture client-side and server-side runtime errors
CREATE TABLE IF NOT EXISTS error_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    code VARCHAR(255),
    url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    source VARCHAR(255),
    stack TEXT,
    ai_summary TEXT,
    ai_severity VARCHAR(50),
    ai_probable_cause TEXT,
    ai_suggested_fix TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on timestamp for performance when querying logs
CREATE INDEX IF NOT EXISTS idx_error_reports_timestamp ON error_reports (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_reports_severity ON error_reports (ai_severity);
