# Manual HiDrive Migration Guide
# راهنمای مهاجرت دستی به HiDrive

## Quick Start - شروع سریع

### 1. Check Current Files
```powershell
# See total size of files to migrate
Get-ChildItem public/worship,public/audio,public/images,public/church-photos -Recurse -File | Measure-Object -Property Length -Sum | Select-Object @{Name="SizeMB";Expression={[math]::Round($_.Sum/1MB,2)}},Count
```

### 2. Test HiDrive Connection
```powershell
# Connect via SFTP
sftp adminchurch@sftp.hidrive.ionos.com
# Enter password when prompted
# Type 'exit' to disconnect
```

### 3. Upload Files (Choose One Method)

#### Method A: Using WinSCP (Recommended for Windows)
1. Download WinSCP: https://winscp.net/
2. Connect:
   - Protocol: SFTP
   - Host: sftp.hidrive.ionos.com
   - Port: 22
   - Username: adminchurch
   - Password: [from admin]
3. Navigate to: /users/adminchurch/
4. Create folder: `mychurch`
5. Upload folders:
   - `public/worship/data/audio` → `/users/adminchurch/mychurch/worship/audio`
   - `public/images` → `/users/adminchurch/mychurch/events/images`
   - `public/audio` → `/users/adminchurch/mychurch/sermons/audio`

#### Method B: Using rsync (Linux/Mac/WSL)
```bash
# Upload worship audio
rsync -avz --progress public/worship/data/audio/ adminchurch@rsync.hidrive.ionos.com:/users/adminchurch/mychurch/worship/audio/

# Upload event images
rsync -avz --progress public/images/ adminchurch@rsync.hidrive.ionos.com:/users/adminchurch/mychurch/events/images/

# Upload sermon audio
rsync -avz --progress public/audio/ adminchurch@rsync.hidrive.ionos.com:/users/adminchurch/mychurch/sermons/audio/
```

#### Method C: Using SFTP Command Line
```bash
sftp adminchurch@sftp.hidrive.ionos.com

# Inside SFTP:
mkdir /users/adminchurch/mychurch
mkdir /users/adminchurch/mychurch/worship
mkdir /users/adminchurch/mychurch/worship/audio
cd /users/adminchurch/mychurch/worship/audio
lcd public/worship/data/audio
put *
exit
```

### 4. Update Database URLs

After files are uploaded, update database to point to HiDrive:

```sql
-- Connect to database
ssh root@samanabyar.online
psql -U myuser -d mychurch

-- Update worship songs audio URLs
UPDATE worship_songs
SET audiourl = REPLACE(audiourl, '/worship/data/audio/', 
  'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/')
WHERE audiourl LIKE '/worship/data/audio/%';

-- Verify changes
SELECT id, title, audiourl FROM worship_songs WHERE audiourl LIKE 'https://webdav%' LIMIT 5;

-- Update event images
UPDATE events
SET imageurl = REPLACE(imageurl, '/images/', 
  'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/events/images/')
WHERE imageurl LIKE '/images/%';

-- Verify
SELECT id, title, imageurl FROM events WHERE imageurl LIKE 'https://webdav%' LIMIT 5;

-- Commit changes
\q
```

### 5. Test on Website

1. Open website: https://samanabyar.online
2. Go to worship songs page
3. Try playing a song
4. Check if audio loads from HiDrive URL
5. Check browser DevTools Network tab

### 6. Verify Files Are Accessible

Test a HiDrive URL directly in browser:
```
https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/[filename].mp3
```

If file downloads or plays, migration successful!

## File Categories Mapping

| Local Path | HiDrive Path | Database Table | Column |
|-----------|--------------|---------------|--------|
| `/worship/data/audio/` | `/mychurch/worship/audio/` | `worship_songs` | `audiourl` |
| `/worship/videos/` | `/mychurch/worship/videos/` | `worship_songs` | `videourl` |
| `/images/` | `/mychurch/events/images/` | `events` | `imageurl` |
| `/audio/` | `/mychurch/sermons/audio/` | `sermons` | `audiourl` |
| `/church-photos/` | `/mychurch/church/photos/` | N/A | Static |
| `/bible-timings/` | `/mychurch/bible/audio/` | `bible_audio_timings` | `audiourl` |

## Rollback (If Needed)

If migration causes issues:

```sql
-- Revert worship songs URLs
UPDATE worship_songs
SET audiourl = REPLACE(audiourl, 
  'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/',
  '/worship/data/audio/')
WHERE audiourl LIKE 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/%';

-- Verify rollback
SELECT id, audiourl FROM worship_songs WHERE audiourl LIKE '/worship%' LIMIT 5;
```

## Using API for Future Uploads

Once backend is deployed with HiDrive routes:

```javascript
// Upload new song directly to HiDrive
const formData = new FormData();
formData.append('file', audioFile);
formData.append('category', 'worship-audio');
formData.append('filename', 'new-song.mp3');

const response = await fetch('/api/hidrive/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log('Uploaded to:', data.url);
// Use data.url in database
```

## Monitoring Storage

Check HiDrive usage via web interface:
- Login: https://www.ionos.com/
- Navigate to: HiDrive → Storage
- View: Files, folders, storage used

## Benefits After Migration

- Server disk space freed (~9GB)
- Faster file delivery via CDN
- Scalable storage (upgrade HiDrive plan if needed)
- Reduced server backup size
- Better performance for users

## Troubleshooting

**Problem**: SFTP connection refused
**Solution**: Check firewall, verify credentials

**Problem**: Upload slow
**Solution**: Use rsync with compression (-z flag)

**Problem**: Files not accessible via WebDAV URL
**Solution**: Check file permissions on HiDrive, ensure public access

**Problem**: Database URLs not updated
**Solution**: Re-run SQL UPDATE queries, check WHERE clause

**Problem**: Website can't load audio
**Solution**: Check CORS settings, verify URL format

## Support

For issues:
1. Check HIDRIVE_STORAGE_GUIDE.md for detailed docs
2. Contact IONOS support: https://www.ionos.com/help/
3. Test connection: `sftp adminchurch@sftp.hidrive.ionos.com`

---

Last Updated: 2025-11-10
