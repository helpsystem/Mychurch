#!/bin/bash
# Migration script for production server
# Run this on samanabyar.online server

echo "🔄 Starting migration..."

# Navigate to project directory (adjust path as needed)
cd /var/www/mychurch || cd /home/mychurch || cd ~

# Run migration SQL
PGPASSWORD='MyChurch2024Secure!' psql -h localhost -p 5433 -U mychurch_user -d mychurch << 'EOF'
-- Add bio column (JSONB for bilingual support)
ALTER TABLE leaders 
ADD COLUMN IF NOT EXISTS bio JSONB DEFAULT '{"fa": "", "en": ""}'::jsonb;

-- Add whatsapp_number column
ALTER TABLE leaders 
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

-- Verify columns were added
\echo '\n✅ Verifying columns...'
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'leaders' 
AND column_name IN ('bio', 'whatsapp_number')
ORDER BY column_name;

\echo '\n✅ Migration completed successfully!'
EOF

echo "✅ Done! Backend server can now use bio and whatsappNumber fields."
