-- 🎬 Broadcast Sessions Table
-- Migration for Broadcast Console Pro

-- Create broadcast_sessions table
CREATE TABLE IF NOT EXISTS broadcast_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slides JSONB NOT NULL DEFAULT '[]',
    settings JSONB NOT NULL DEFAULT '{}',
    created_by VARCHAR(255) NOT NULL DEFAULT 'anonymous',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_template BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}'
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_broadcast_sessions_created_by ON broadcast_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_broadcast_sessions_is_template ON broadcast_sessions(is_template);
CREATE INDEX IF NOT EXISTS idx_broadcast_sessions_tags ON broadcast_sessions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_broadcast_sessions_updated_at ON broadcast_sessions(updated_at DESC);

-- Add comment to table
COMMENT ON TABLE broadcast_sessions IS 'Stores broadcast console sessions with slides and settings';

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_broadcast_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS broadcast_sessions_updated_at ON broadcast_sessions;
CREATE TRIGGER broadcast_sessions_updated_at
    BEFORE UPDATE ON broadcast_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_broadcast_sessions_updated_at();

-- Insert default templates
INSERT INTO broadcast_sessions (name, description, slides, settings, created_by, is_template, tags)
VALUES 
(
    'جلسه پرستشی یکشنبه',
    'قالب پیش‌فرض برای جلسات پرستشی یکشنبه',
    '[]',
    '{"layout": "SLIDES_ONLY", "showLogo": true}',
    'system',
    TRUE,
    ARRAY['sunday', 'worship', 'template']
),
(
    'Sunday Service Template',
    'Default template for Sunday worship services',
    '[]',
    '{"layout": "SLIDES_ONLY", "showLogo": true}',
    'system',
    TRUE,
    ARRAY['sunday', 'worship', 'template', 'english']
)
ON CONFLICT DO NOTHING;

-- Verify table was created
SELECT 'broadcast_sessions table created successfully' AS status;
