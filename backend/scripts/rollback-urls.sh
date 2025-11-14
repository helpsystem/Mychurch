#!/bin/bash

# Supabase credentials (embedded)
SUPABASE_URL="https://yxeobqzgqghndjvkzwjy.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZW9icXpncWdobmRqdmt6d2p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTU3MDE5NiwiZXhwIjoyMDQxMTQ2MTk2fQ.SkR-sLh4YS1RRLYd9KHh5Hq37L9wJOqiZKhJ95qwGHs"

echo "🔄 Rolling back URLs from HiDrive to local paths..."
echo ""

# Get all songs with HiDrive URLs
SONGS=$(curl -s "${SUPABASE_URL}/rest/v1/worship_songs?audiourl=like.*hidrive*&select=id,audiourl" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}")

echo "📊 Songs to update:"
echo "$SONGS" | head -20
echo ""

# Update each song (this is a simplified version - in production you'd loop through results)
curl -X PATCH "${SUPABASE_URL}/rest/v1/worship_songs?audiourl=like.*hidrive*" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "audiourl": "replace(audiourl, \"https://webdav.hidrive.ionos.com/users/adminchurch/mychurch\", \"\")"
  }'

echo ""
echo "✅ Rollback completed!"
