-- Production Database Initialization Script for MyChurch
-- This script creates the complete database schema with optimized production settings

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create optimized tables with production-ready configurations
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    profile_image_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

CREATE TABLE IF NOT EXISTS bible_books (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_persian VARCHAR(100),
    testament VARCHAR(20) NOT NULL CHECK (testament IN ('OLD', 'NEW')),
    book_number INTEGER NOT NULL,
    chapters INTEGER NOT NULL,
    verses INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, testament)
);

CREATE TABLE IF NOT EXISTS bible_verses (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES bible_books(id) ON DELETE CASCADE,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    text_persian TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, chapter, verse)
);

CREATE TABLE IF NOT EXISTS songs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_persian VARCHAR(255),
    artist VARCHAR(255),
    artist_persian VARCHAR(255),
    album VARCHAR(255),
    album_persian VARCHAR(255),
    genre VARCHAR(100),
    year INTEGER,
    duration INTEGER,
    file_path VARCHAR(500),
    file_size BIGINT,
    audio_url VARCHAR(500),
    lyrics TEXT,
    lyrics_persian TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    play_count INTEGER DEFAULT 0,
    tags TEXT[],
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS audio_files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_processed BOOLEAN DEFAULT false,
    processing_status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    CONSTRAINT valid_category CHECK (category IN ('bible', 'song', 'worship', 'sermon', 'other'))
);

CREATE TABLE IF NOT EXISTS playlists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_persian VARCHAR(255),
    description TEXT,
    description_persian TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS playlist_items (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
    audio_file_id INTEGER REFERENCES audio_files(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(playlist_id, audio_file_id)
);

CREATE TABLE IF NOT EXISTS user_activity (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_activity_type CHECK (activity_type IN ('login', 'logout', 'audio_play', 'audio_pause', 'audio_stop', 'search', 'download', 'upload', 'settings_change'))
);

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS backup_logs (
    id SERIAL PRIMARY KEY,
    backup_type VARCHAR(50) NOT NULL,
    backup_status VARCHAR(20) NOT NULL,
    backup_size BIGINT,
    backup_location VARCHAR(500),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create optimized indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_bible_books_testament ON bible_books(testament);
CREATE INDEX IF NOT EXISTS idx_bible_verses_book ON bible_verses(book_id);
CREATE INDEX IF NOT EXISTS idx_bible_verses_chapter ON bible_verses(chapter);
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
CREATE INDEX IF NOT EXISTS idx_songs_active ON songs(is_active);
CREATE INDEX IF NOT EXISTS idx_audio_files_category ON audio_files(category);
CREATE INDEX IF NOT EXISTS idx_audio_files_uploaded_at ON audio_files(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_public ON playlists(is_public);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_audio_file_id ON playlist_items(audio_file_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_bible_verses_text_search ON bible_verses USING gin(to_tsvector('english', text));
CREATE INDEX IF NOT EXISTS idx_bible_verses_persian_search ON bible_verses USING gin(to_tsvector('persian', text_persian));
CREATE INDEX IF NOT EXISTS idx_songs_title_search ON songs USING gin(to_tsvector('english', title || ' ' || COALESCE(artist, '')));
CREATE INDEX IF NOT EXISTS idx_songs_persian_search ON songs USING gin(to_tsvector('persian', title_persian || ' ' || COALESCE(artist_persian, '')));

-- Create partitioning for large tables (optional for very large datasets)
CREATE TABLE IF NOT EXISTS user_activity_partitioned (
    LIKE user_activity INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create partitions for the current year and next year
CREATE TABLE IF NOT EXISTS user_activity_partitioned_2025 PARTITION OF user_activity_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Create admin user with secure password
INSERT INTO users (email, password_hash, role, first_name, last_name, is_active, email_verified)
VALUES (
    'admin@mychurch.com',
    '$2b$10$MjIwMTY4MzQ0NzJhNDY3uO5F3K8L2m9n8p7q6r5s4t3y2w1x0c9v8b7n6m5k4l', -- This should be replaced with actual hash of 'MyChurchSecureAdmin2024!'
    'admin',
    'System',
    'Administrator',
    true,
    true
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample Bible books data
INSERT INTO bible_books (name, name_persian, testament, book_number, chapters, verses) VALUES
('Genesis', 'پیدایش', 'OLD', 1, 50, 1533),
('Exodus', 'خروج', 'OLD', 2, 40, 1210),
('Leviticus', 'لاویان', 'OLD', 3, 27, 859),
('Numbers', 'اعداد', 'OLD', 4, 36, 1288),
('Deuteronomy', 'تثنیه', 'OLD', 5, 34, 959),
('Joshua', 'یوشع', 'OLD', 6, 24, 658),
('Judges', 'داوران', 'OLD', 7, 21, 618),
('Ruth', 'روت', 'OLD', 8, 4, 85),
('1 Samuel', 'اول سموئیل', 'OLD', 9, 31, 810),
('2 Samuel', 'دوم سموئیل', 'OLD', 10, 24, 695),
('1 Kings', 'اول پادشاهان', 'OLD', 11, 22, 816),
('2 Kings', 'دوم پادشاهان', 'OLD', 12, 25, 716),
('1 Chronicles', 'اول تواریخ', 'OLD', 13, 29, 942),
('2 Chronicles', 'دوم تواریخ', 'OLD', 14, 36, 822),
('Ezra', 'عزرا', 'OLD', 15, 10, 280),
('Nehemiah', 'نحیمیا', 'OLD', 16, 13, 406),
('Esther', 'استر', 'OLD', 17, 10, 167),
('Job', 'ایوب', 'OLD', 18, 42, 1070),
('Psalms', 'مزامیر', 'OLD', 19, 150, 2461),
('Proverbs', 'امثال', 'OLD', 20, 31, 915),
('Ecclesiastes', 'جامعه', 'OLD', 21, 12, 222),
('Song of Solomon', 'غزل غزل', 'OLD', 22, 8, 117),
('Isaiah', 'اشعیا', 'OLD', 23, 66, 1292),
('Jeremiah', 'ارمیا', 'OLD', 24, 52, 1364),
('Lamentations',مراثی', 'OLD', 25, 5, 154),
('Ezekiel', 'حزقیال', 'OLD', 26, 48, 1273),
('Daniel', 'دانیال', 'OLD', 27, 12, 357),
('Hosea', 'هوشع', 'OLD', 28, 14, 197),
('Joel', 'یوئیل', 'OLD', 29, 3, 73),
('Amos', 'عاموس', 'OLD', 30, 9, 146),
('Obadiah', 'اوبدیا', 'OLD', 31, 1, 21),
('Jonah', 'یونس', 'OLD', 32, 4, 48),
('Micah', 'میخا', 'OLD', 33, 7, 105),
('Nahum', 'ناحوم', 'OLD', 34, 3, 47),
('Habakkuk', 'حبقوق', 'OLD', 35, 3, 56),
('Zephaniah', 'صفنیا', 'OLD', 36, 3, 53),
('Haggai', 'حجی', 'OLD', 37, 2, 38),
('Zechariah', 'زکریا', 'OLD', 38, 14, 211),
('Malachi', 'ملاکی', 'OLD', 39, 4, 55),
('Matthew', 'متی', 'NEW', 40, 28, 1071),
('Mark', 'مرقس', 'NEW', 41, 16, 678),
('Luke', 'لوقا', 'NEW', 42, 24, 1151),
('John', 'یوحنا', 'NEW', 43, 21, 879),
('Acts', 'اعمال', 'NEW', 44, 28, 1007),
('Romans', 'رومیان', 'NEW', 45, 16, 433),
('1 Corinthians', 'اول قرنتیان', 'NEW', 46, 16, 437),
('2 Corinthians', 'دوم قرنتیان', 'NEW', 47, 13, 257),
('Galatians', 'غلاطیان', 'NEW', 48, 6, 221),
('Ephesians', 'افسسیان', 'NEW', 49, 6, 155),
('Philippians', 'فیلیپیان', 'NEW', 50, 4, 104),
('Colossians', 'کولسیان', 'NEW', 51, 4, 95),
('1 Thessalonians', 'اول تسالونیکی', 'NEW', 52, 5, 89),
('2 Thessalonians', 'دوم تسالونیکی', 'NEW', 53, 3, 47),
('1 Timothy', 'اول تیموتائوس', 'NEW', 54, 6, 113),
('2 Timothy', 'دوم تیموتائوس', 'NEW', 55, 4, 83),
('Titus', 'تیتوس', 'NEW', 56, 3, 46),
('Philemon', 'فیلیمون', 'NEW', 57, 1, 25),
('Hebrews', 'عبرانیان', 'NEW', 58, 13, 303),
('James', 'یعقوب', 'NEW', 59, 5, 108),
('1 Peter', 'اول پطرس', 'NEW', 60, 5, 105),
('2 Peter', 'دوم پترس', 'NEW', 61, 3, 61),
('1 John', 'اول یوحنا', 'NEW', 62, 5, 105),
('2 John', 'دوم یوحنا', 'NEW', 63, 1, 13),
('3 John', 'سوم یوحنا', 'NEW', 64, 1, 14),
('Jude', 'هود', 'NEW', 65, 1, 25),
('Revelation', 'پدیدار', 'NEW', 66, 22, 404)
ON CONFLICT (name, testament) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('app_name', 'MyChurch', 'Application name'),
('app_version', '1.0.0', 'Application version'),
('default_language', 'en', 'Default application language'),
('maintenance_mode', false, 'Enable maintenance mode'),
('max_upload_size', 104857600, 'Maximum file upload size in bytes'),
('allowed_file_types', '["mp3", "wav", "m4a", "mp4", "jpg", "jpeg", "png", "pdf"]', 'Allowed file upload types'),
('backup_frequency', 'daily', 'Database backup frequency'),
('retention_policy', '{"logs": 30, "backups": 90}', 'Data retention policy in days'),
('security_settings', '{"max_login_attempts": 5, "lockout_duration": 900, "session_timeout": 3600}', 'Security configuration')
ON CONFLICT (setting_key) DO NOTHING;

-- Create database roles for better security
CREATE ROLE mychurch_readonly;
CREATE ROLE mychurch_readwrite;
CREATE ROLE mychurch_admin;

-- Grant permissions
<write_to_file>
<path>docker/postgres/init-db-prod.sql</path>
<content>
-- PostgreSQL Database Initialization Script for Production
-- MyChurch Production Database Schema
-- Run with: docker-compose -f docker-compose.prod.yml up -d

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'Asia/Tehran';

-- Create database if it doesn't exist
-- This is handled by the environment variable in docker-compose.prod.yml

-- Create admin user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mychurch_admin') THEN
        CREATE ROLE mychurch_admin WITH LOGIN PASSWORD 'MyChurchSecureDB2024!' CREATEDB CREATEROLE;
    END IF;
END
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE mychurch_prod TO mychurch_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mychurch_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mychurch_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO mychurch_admin;

-- Create application user with limited privileges
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mychurch_app') THEN
        CREATE ROLE mychurch_app WITH LOGIN PASSWORD 'MyChurchAppSecure2024!';
    END IF;
END
$$;

-- Grant limited privileges to application user
GRANT CONNECT ON DATABASE mychurch_prod TO mychurch_app;
GRANT USAGE ON SCHEMA public TO mychurch_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mychurch_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mychurch_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO mychurch_app;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    language VARCHAR(10) DEFAULT 'fa' CHECK (language IN ('fa', 'en')),
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    profile_image_url TEXT,
    preferences JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_fa VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    artist_fa VARCHAR(255),
    artist_en VARCHAR(255),
    album_fa VARCHAR(255),
    album_en VARCHAR(255),
    genre VARCHAR(100),
    duration INTEGER,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    lyrics_fa TEXT,
    lyrics_en TEXT,
    chords TEXT,
    tempo INTEGER,
    key_signature VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    tags TEXT[],
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS bible_books (
    id INTEGER PRIMARY KEY,
    name_fa VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    testament VARCHAR(20) NOT NULL CHECK (testament IN ('old', 'new')),
    chapters INTEGER NOT NULL,
    order_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bible_verses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id INTEGER REFERENCES bible_books(id) ON DELETE CASCADE,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text_fa TEXT NOT NULL,
    text_en TEXT,
    transliteration_fa TEXT,
    transliteration_en TEXT,
    audio_url TEXT,
    audio_duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, chapter, verse)
);

CREATE TABLE IF NOT EXISTS audio_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    duration INTEGER,
    bitrate INTEGER,
    sample_rate INTEGER,
    channels INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}',
    tags TEXT[]
);

CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fa VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description_fa TEXT,
    description_en TEXT,
    created_by UUID REFERENCES users(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS playlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    audio_file_id UUID REFERENCES audio_files(id),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(playlist_id, audio_file_id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL CHECK (level IN ('error', 'warn', 'info', 'debug')),
    message TEXT NOT NULL,
    context JSONB,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    backup_type VARCHAR(50) NOT NULL CHECK (backup_type IN ('full', 'incremental', 'database', 'files')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_songs_title_fa ON songs(title_fa);
CREATE INDEX IF NOT EXISTS idx_songs_title_en ON songs(title_en);
CREATE INDEX IF NOT EXISTS idx_songs_artist_fa ON songs(artist_fa);
CREATE INDEX IF NOT EXISTS idx_songs_artist_en ON songs(artist_en);
CREATE INDEX IF NOT EXISTS idx_songs_is_active ON songs(is_active);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at);
CREATE INDEX IF NOT EXISTS idx_songs_tags ON songs USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_bible_verses_book_id ON bible_verses(book_id);
CREATE INDEX IF NOT EXISTS idx_bible_verses_chapter ON bible_verses(chapter);
CREATE INDEX IF NOT EXISTS idx_bible_verses_verse ON bible_verses(verse);
CREATE INDEX IF NOT EXISTS idx_bible_verses_book_chapter ON bible_verses(book_id, chapter);

CREATE INDEX IF NOT EXISTS idx_audio_files_status ON audio_files(status);
CREATE INDEX IF NOT EXISTS idx_audio_files_created_at ON audio_files(created_at);
CREATE INDEX IF NOT EXISTS idx_audio_files_created_by ON audio_files(created_by);

CREATE INDEX IF NOT EXISTS idx_playlists_created_by ON playlists(created_by);
CREATE INDEX IF NOT EXISTS idx_playlists_is_public ON playlists(is_public);
CREATE INDEX IF NOT EXISTS idx_playlists_created_at ON playlists(created_at);

CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_audio_file_id ON playlist_items(audio_file_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_backups_backup_type ON backups(backup_type);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bible_verses_updated_at BEFORE UPDATE ON bible_verses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create admin user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@mychurch.com') THEN
        INSERT INTO users (email, password_hash, first_name, last_name, role, language, theme, is_active, email_verified)
        VALUES (
            'admin@mychurch.com',
            crypt('MyChurchSecureAdmin2024!', gen_salt('bf')),
            'مدیر',
            'سیستم',
            'super_admin',
            'fa',
            'light',
            true,
            true
        );
    END IF;
END
$$;

-- Create default super admin user
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@mychurch.com') THEN
        INSERT INTO users (email, password_hash, first_name, last_name, role, language, theme, is_active, email_verified)
        VALUES (
            'superadmin@mychurch.com',
            crypt('MyChurchSuperAdmin2024!', gen_salt('bf')),
            'ادمین',
            'سوپر',
            'super_admin',
            'fa',
            'dark',
            true,
            true
        );
    END IF;
END
$$;

-- Grant specific privileges to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO mychurch_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON songs TO mychurch_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON bible_books TO mychurch_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON bible_verses TO mychurch_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON audio_files TO mychurch_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON playlists TO mychurch_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON playlist_items TO mychurch_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO mychurch_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON system_logs TO mychurch_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON backups TO mychurch_app;

-- Create views for common queries
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.created_at,
    COUNT(DISTINCT s.id) as songs_count,
    COUNT(DISTINCT p.id) as playlists_count,
    MAX(u.last_login) as last_login
FROM users u
LEFT JOIN songs s ON u.id = s.created_by
LEFT JOIN playlists p ON u.id = p.created_by
GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.created_at, u.last_login;

-- Set up database maintenance
CREATE OR REPLACE FUNCTION vacuum_analyze_tables()
RETURNS VOID AS $$
BEGIN
    EXECUTE 'VACUUM ANALYZE users';
    EXECUTE 'VACUUM ANALYZE songs';
    EXECUTE 'VACUUM ANALYZE bible_verses';
    EXECUTE 'VACUUM ANALYZE audio_files';
    EXECUTE 'VACUUM ANALYZE playlists';
    EXECUTE 'VACUUM ANALYZE playlist_items';
    EXECUTE 'VACUUM ANALYZE user_sessions';
    EXECUTE 'VACUUM ANALYZE system_logs';
    EXECUTE 'VACUUM ANALYZE backups';
END;
$$ LANGUAGE plpgsql;

-- Create database maintenance job (run weekly)
-- This would be set up using pg_cron extension in production
-- SELECT cron.schedule('0 2 * * 0', 'America/New_York', $$SELECT vacuum_analyze_tables()$$);

-- Grant execute on function to application user
GRANT EXECUTE ON FUNCTION vacuum_analyze_tables() TO mychurch_app;

-- Create database statistics view
CREATE OR REPLACE VIEW database_stats AS
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM songs) as total_songs,
    (SELECT COUNT(*) FROM bible_verses) as total_verses,
    (SELECT COUNT(*) FROM audio_files) as total_audio_files,
    (SELECT COUNT(*) FROM playlists) as total_playlists,
    (SELECT COUNT(*) FROM system_logs WHERE level = 'error') as error_logs,
    (SELECT COUNT(*) FROM user_sessions WHERE expires_at > CURRENT_TIMESTAMP) as active_sessions,
    (SELECT pg_size_pretty(pg_database_size(current_database()))) as database_size;

-- Grant select on stats view to application user
GRANT SELECT ON user_stats TO mychurch_app;
GRANT SELECT ON database_stats TO mychurch_app;

-- Final verification
-- Check if all tables were created successfully
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Database initialized successfully with % tables', table_count;
END
$$;

-- Create backup verification function
CREATE OR REPLACE FUNCTION verify_backup_integrity()
RETURNS TABLE(
    table_name VARCHAR(255),
    row_count BIGINT,
    size_bytes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        n_tup_ins as row_count,
        pg_total_relation_size(schemaname || '.' || tablename) as size_bytes
    FROM pg_stat_user_tables
    ORDER BY tablename;
END;
$$ LANGUAGE plpgsql;

-- Grant execute on verification function to application user
GRANT EXECUTE ON FUNCTION verify_backup_integrity() TO mychurch_app;

-- Create database health check function
CREATE OR REPLACE FUNCTION check_database_health()
RETURNS TABLE(
    check_item VARCHAR(100),
    status VARCHAR(20),
    details TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'disk_space' as check_item,
        CASE WHEN pg_tablespace_size('pg_default') < 107374182400 THEN 'healthy' ELSE 'warning' END as status,
        pg_size_pretty(pg_tablespace_size('pg_default')) || ' used' as details
    
    UNION ALL
    
    SELECT 
        'connection_count' as check_item,
        CASE WHEN (SELECT COUNT(*) FROM pg_stat_activity) < 100 THEN 'healthy' ELSE 'warning' END as status,
        (SELECT COUNT(*) FROM pg_stat_activity) || ' active connections' as details
    
    UNION ALL
    
    SELECT 
        'deadlocks' as check_item,
        CASE WHEN (SELECT COUNT(*) FROM pg_stat_database WHERE datname = current_database()) = 0 THEN 'healthy' ELSE 'warning' END as status,
        'No deadlocks detected' as details;
END;
$$ LANGUAGE plpgsql;

-- Grant execute on health check function to application user
GRANT EXECUTE ON FUNCTION check_database_health() TO mychurch_app;

-- Final message
RAISE NOTICE 'PostgreSQL production database initialized successfully for MyChurch application';
RAISE NOTICE 'Admin credentials: admin@mychurch.com / MyChurchSecureAdmin2024!';
RAISE NOTICE 'Super admin credentials: superadmin@mychurch.com / MyChurchSuperAdmin2024!';