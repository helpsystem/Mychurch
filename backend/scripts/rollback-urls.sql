-- Rollback worship songs URLs from HiDrive to local paths
-- Run with: psql -h <host> -U <user> -d <database> -f rollback-urls.sql

BEGIN;

-- Update worship_songs URLs from HiDrive to local
UPDATE worship_songs
SET audiourl = regexp_replace(
  audiourl,
  'https://webdav\.hidrive\.ionos\.com/users/adminchurch/mychurch',
  '',
  'g'
)
WHERE audiourl LIKE '%hidrive%';

-- Show results
SELECT 
  COUNT(*) as total_songs,
  COUNT(CASE WHEN audiourl LIKE '/worship/%' THEN 1 END) as local_urls,
  COUNT(CASE WHEN audiourl LIKE '%hidrive%' THEN 1 END) as hidrive_urls
FROM worship_songs;

COMMIT;

\echo ''
\echo '✅ Rollback completed! URLs updated to local paths.'
