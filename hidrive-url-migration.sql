-- HiDrive URL migration script
-- Generated: 2025-11-10 19:13:10
-- Update sermons.audiourl
UPDATE sermons SET audiourl = REPLACE(audiourl, '/audio/', 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/sermons/audio/') WHERE audiourl LIKE '/audio/%';
SELECT id,audiourl FROM sermons WHERE audiourl LIKE 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/sermons/audio/%' LIMIT 5;

-- Update worship_songs.audiourl
UPDATE worship_songs SET audiourl = REPLACE(audiourl, '/worship/audio/', 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/') WHERE audiourl LIKE '/worship/audio/%';
SELECT id,audiourl FROM worship_songs WHERE audiourl LIKE 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/%' LIMIT 5;

-- Update events.imageurl
UPDATE events SET imageurl = REPLACE(imageurl, '/images/', 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/events/images/') WHERE imageurl LIKE '/images/%';
SELECT id,imageurl FROM events WHERE imageurl LIKE 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/events/images/%' LIMIT 5;

