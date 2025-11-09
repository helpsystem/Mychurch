-- Create missing tables for admin panel

-- Settings table for site configuration
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB,
  category VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (key, value, category, description) VALUES
('site_name', '{"fa": "کلیسای مسیحی ایرانی واشنگتن دی‌سی", "en": "Iranian Christian Church of D.C."}', 'general', 'Site name'),
('site_description', '{"fa": "دسترسی آمن برای پرسش محور", "en": "Safe access for questioning"}', 'general', 'Site description'),
('contact_email', '"info@mychurch.com"', 'contact', 'Contact email'),
('max_upload_size', '52428800', 'storage', 'Max upload size in bytes (50MB)'),
('allowed_file_types', '["image/jpeg", "image/png", "image/gif", "audio/mpeg", "audio/mp3", "video/mp4", "application/pdf"]', 'storage', 'Allowed file MIME types')
ON CONFLICT (key) DO NOTHING;

-- Files table for file management
CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  original_name VARCHAR(500),
  mime_type VARCHAR(100),
  size BIGINT,
  url TEXT,
  path TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  category VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);

-- Add comments
COMMENT ON TABLE settings IS 'Site-wide configuration settings';
COMMENT ON TABLE files IS 'Uploaded files and media management';
