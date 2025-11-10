# IONOS HiDrive Storage Integration Guide
# راهنمای یکپارچه‌سازی ذخیره‌سازی HiDrive

## 📋 Overview / نمای کلی

This guide explains how to integrate IONOS HiDrive cloud storage for heavy media files (audio, video, images) to reduce server storage costs and improve performance.

این راهنما نحوه یکپارچه‌سازی ذخیره‌سازی ابری IONOS HiDrive را برای فایل‌های سنگین (صوتی، تصویری، ویدئویی) توضیح می‌دهد تا هزینه فضای سرور کاهش یابد و عملکرد بهبود یابد.

---

## 🎯 Goals / اهداف

1. **Store heavy files on cloud**: Move worship songs, sermon audio, event images, etc. to HiDrive
2. **Reduce server costs**: Free up server disk space
3. **Improve performance**: Faster uploads/downloads via CDN
4. **Maintain compatibility**: Existing URLs work seamlessly

1. **ذخیره فایل‌های سنگین در کلود**: انتقال سرودها، صوت موعظه‌ها، تصاویر رویدادها و ... به HiDrive
2. **کاهش هزینه سرور**: آزادسازی فضای دیسک سرور
3. **بهبود عملکرد**: آپلود/دانلود سریع‌تر از طریق CDN
4. **حفظ سازگاری**: آدرس‌های موجود بدون مشکل کار می‌کنند

---

## 🔑 IONOS HiDrive Credentials / اطلاعات دسترسی

```
Username: adminchurch
Host (SFTP): sftp.hidrive.ionos.com
Host (WebDAV): https://webdav.hidrive.ionos.com/
Base Path: /users/adminchurch/mychurch
Public URL: https://webdav.hidrive.ionos.com/users/adminchurch/mychurch
```

### Connection Methods:
- **SFTP**: `sftp://adminchurch@sftp.hidrive.ionos.com`
- **rsync**: `rsync -avz file adminchurch@rsync.hidrive.ionos.com:/users/adminchurch/`
- **WebDAV**: `https://webdav.hidrive.ionos.com/` (browser access)
- **SMB**: `\\smb3.hidrive.ionos.com\root`

---

## 📁 Directory Structure / ساختار دایرکتوری

Files are organized by category on HiDrive:

```
/users/adminchurch/mychurch/
├── worship/
│   ├── audio/           # Worship song MP3/M4A files
│   ├── videos/          # Worship videos
│   ├── sheets/          # Sheet music PDFs
│   └── presentations/   # PowerPoint/Keynote
├── sermons/
│   └── audio/           # Sermon recordings
├── events/
│   └── images/          # Event photos
├── church/
│   └── photos/          # General church photos
├── bible/
│   └── audio/           # Bible chapter audio
├── ai/
│   └── generated/       # AI-generated images
└── documents/           # PDFs, docs, etc.
```

---

## 🚀 Setup / راه‌اندازی

### 1. Install Dependencies

```bash
npm install ssh2-sftp-client
```

### 2. Configure Environment Variables

Add to `backend/.env`:

```bash
# IONOS HiDrive Storage
HIDRIVE_HOST=sftp.hidrive.ionos.com
HIDRIVE_PORT=22
HIDRIVE_USER=adminchurch
HIDRIVE_PASSWORD=your_password_here
HIDRIVE_BASE_PATH=/users/adminchurch/mychurch
HIDRIVE_PUBLIC_URL=https://webdav.hidrive.ionos.com/users/adminchurch/mychurch
```

### 3. Test Connection

```bash
# Windows PowerShell
sftp adminchurch@sftp.hidrive.ionos.com

# Linux/Mac
sftp adminchurch@sftp.hidrive.ionos.com
```

---

## 📤 Migration Process / فرآیند مهاجرت

### Step 1: Analyze Files / تحلیل فایل‌ها

```powershell
# Run analysis (dry-run)
.\migrate-to-hidrive.ps1 -Mode dry-run
```

This creates `migration-plan.json` with:
- Total files to migrate
- Total size (MB/GB)
- File categories
- Source/destination paths

### Step 2: Upload Files / آپلود فایل‌ها

**Option A: Using PowerShell Script (Windows)**

```powershell
.\migrate-to-hidrive.ps1 -Mode upload
```

**Option B: Using rsync (Linux/Mac/WSL)**

```bash
# Upload worship audio
rsync -avz --progress public/worship/data/audio/ \
  adminchurch@rsync.hidrive.ionos.com:/users/adminchurch/mychurch/worship/audio/

# Upload event images
rsync -avz --progress public/images/ \
  adminchurch@rsync.hidrive.ionos.com:/users/adminchurch/mychurch/events/images/
```

**Option C: Using WinSCP/FileZilla (GUI)**

1. Open WinSCP or FileZilla
2. Connect to: `sftp://adminchurch@sftp.hidrive.ionos.com`
3. Navigate to `/users/adminchurch/mychurch`
4. Upload folders as per `migration-plan.json`

### Step 3: Update Database URLs / به‌روزرسانی آدرس‌های دیتابیس

```powershell
.\migrate-to-hidrive.ps1 -Mode update-db
```

This generates `hidrive-url-migration.sql` which updates database URLs from local paths to HiDrive URLs.

**Example SQL:**

```sql
-- Update worship_songs.audiourl
UPDATE worship_songs
SET audiourl = REPLACE(audiourl, '/worship/data/audio/', 
  'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/')
WHERE audiourl LIKE '/worship/data/audio/%';

-- Update events.imageurl
UPDATE events
SET imageurl = REPLACE(imageurl, '/images/', 
  'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/events/images/')
WHERE imageurl LIKE '/images/%';
```

**Execute on server:**

```bash
ssh root@samanabyar.online
psql -U myuser -d mychurch -f hidrive-url-migration.sql
```

---

## 🔌 API Endpoints / نقاط API

### Upload File

```javascript
POST /api/hidrive/upload

Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Body:
  file: <file>
  category: "worship-audio"
  filename: "song-123.mp3" (optional)

Response:
{
  "success": true,
  "url": "https://webdav.hidrive.ionos.com/.../worship/audio/song-123.mp3",
  "filename": "song-123.mp3",
  "category": "worship-audio",
  "size": 5242880
}
```

### Migrate Local File

```javascript
POST /api/hidrive/migrate

Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
{
  "localPath": "/worship/data/audio/old-song.mp3",
  "category": "worship-audio"
}

Response:
{
  "success": true,
  "originalPath": "/worship/data/audio/old-song.mp3",
  "newUrl": "https://webdav.hidrive.ionos.com/.../worship/audio/old-song.mp3",
  "category": "worship-audio"
}
```

### Batch Migrate from Database

```javascript
POST /api/hidrive/batch-migrate

Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
{
  "table": "worship_songs",
  "column": "audiourl",
  "category": "worship-audio",
  "filter": "id < 100" // optional
}

Response:
{
  "success": true,
  "table": "worship_songs",
  "column": "audiourl",
  "category": "worship-audio",
  "total": 50,
  "migrated": 48,
  "failed": 2,
  "results": [...]
}
```

### Get Storage Stats

```javascript
GET /api/hidrive/stats

Headers:
  Authorization: Bearer <token>

Response:
{
  "success": true,
  "stats": {
    "connected": true,
    "categories": {
      "worship-audio": { "files": 120, "sizeMB": 450.32 },
      "event-images": { "files": 85, "sizeMB": 125.67 }
    },
    "totalFiles": 205,
    "totalSizeMB": 576.99,
    "totalSizeGB": 0.56
  }
}
```

### Proxy File (Stream from HiDrive)

```javascript
GET /api/hidrive/proxy/:category/:filename

Example:
GET /api/hidrive/proxy/worship-audio/song-123.mp3

Response: Audio stream (no auth required for public files)
```

---

## 🔄 Backend Integration / یکپارچه‌سازی Backend

### Import Service

```javascript
const hidriveStorage = require('./services/hidriveStorage');
```

### Upload File from Buffer

```javascript
// Upload from memory (e.g., after processing)
const buffer = Buffer.from(audioData);
const url = await hidriveStorage.uploadFile(
  buffer, 
  'worship-audio', 
  'processed-song.mp3'
);

console.log('Uploaded to:', url);
```

### Upload File from Local Path

```javascript
// Upload from local file system
const url = await hidriveStorage.uploadFile(
  '/path/to/local/file.mp3',
  'worship-audio',
  'song.mp3'
);
```

### Download File

```javascript
// Download to local path
await hidriveStorage.downloadFile(
  'worship-audio',
  'song.mp3',
  '/tmp/downloaded-song.mp3'
);
```

### Check if File Exists

```javascript
const exists = await hidriveStorage.fileExists('worship-audio', 'song.mp3');
if (exists) {
  console.log('File already on HiDrive!');
}
```

### Get File Stream

```javascript
// Stream file without downloading
const stream = await hidriveStorage.getFileStream('worship-audio', 'song.mp3');
stream.pipe(res); // Send to HTTP response
```

### Get Public URL

```javascript
// Generate public URL for a file
const url = hidriveStorage.getPublicUrl('worship-audio', 'song.mp3');
// Returns: https://webdav.hidrive.ionos.com/.../worship/audio/song.mp3
```

### Parse HiDrive URL

```javascript
// Extract category and filename from URL
const parsed = hidriveStorage.parseHiDriveUrl(
  'https://webdav.hidrive.ionos.com/.../worship/audio/song.mp3'
);
// Returns: { category: 'worship-audio', filename: 'song.mp3' }
```

---

## 🎵 Example: Auto-Upload Worship Songs

Update `worshipRoutes.js` to auto-upload to HiDrive:

```javascript
const hidriveStorage = require('../services/hidriveStorage');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', 
  authenticateToken, 
  authorizeRoles('SUPER_ADMIN', 'WORSHIP_LEADER'),
  upload.single('audioFile'),
  async (req, res) => {
    try {
      const { title, artist, lyrics } = req.body;
      
      let audioUrl = null;
      if (req.file) {
        // Upload directly to HiDrive
        const filename = `${Date.now()}-${req.file.originalname}`;
        audioUrl = await hidriveStorage.uploadFile(
          req.file.buffer,
          'worship-audio',
          filename
        );
        console.log('✅ Audio uploaded to HiDrive:', audioUrl);
      }
      
      // Save to database with HiDrive URL
      const result = await pool.query(
        'INSERT INTO worship_songs (title, artist, lyrics, audiourl) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, artist, lyrics, audioUrl]
      );
      
      res.json({ success: true, song: result.rows[0] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

---

## 🛡️ Security / امنیت

### Access Control

- **SFTP Password**: Stored in `backend/.env` (never commit to Git)
- **API Endpoints**: Protected with JWT auth + role checks
- **Public URLs**: Files are accessible via WebDAV URL (no auth)
- **Private Files**: Use `/api/hidrive/proxy` for auth-required streaming

### Best Practices

1. **Never commit passwords**: Use `.env` and `.gitignore`
2. **Backup database**: Before URL migration, backup database
3. **Test on staging**: Run migration on test environment first
4. **Monitor storage**: Use `/api/hidrive/stats` to track usage
5. **Cleanup old files**: After migration, delete local files to save space

---

## 🐛 Troubleshooting / رفع مشکلات

### Connection Issues

```bash
# Test SFTP connection
sftp -vvv adminchurch@sftp.hidrive.ionos.com

# Check SSH key (if using key auth)
ssh-add -l
```

### Upload Failures

- Check file size limits (HiDrive: 100GB per file, API: 100MB per request)
- Verify remote directory exists
- Check disk quota on HiDrive

### Database URL Issues

```sql
-- Check current URLs
SELECT id, audiourl FROM worship_songs WHERE audiourl LIKE 'http%' LIMIT 10;

-- Revert URL migration (if needed)
UPDATE worship_songs
SET audiourl = REPLACE(audiourl, 
  'https://webdav.hidrive.ionos.com/.../worship/audio/',
  '/worship/data/audio/')
WHERE audiourl LIKE 'https://webdav.hidrive.ionos.com%';
```

### Performance Issues

- Use `rsync` for bulk uploads (faster than SFTP)
- Enable compression: `rsync -avz`
- Upload during off-peak hours

---

## 📊 Monitoring / نظارت

### Check Storage Usage

```javascript
// Get storage statistics
const stats = await hidriveStorage.getStats();
console.log('Total files:', stats.totalFiles);
console.log('Total size:', stats.totalSizeGB, 'GB');
```

### Database Query for Migrated Files

```sql
-- Count files on HiDrive
SELECT COUNT(*) FROM worship_songs 
WHERE audiourl LIKE 'https://webdav.hidrive.ionos.com%';

-- Count local files (not migrated)
SELECT COUNT(*) FROM worship_songs 
WHERE audiourl NOT LIKE 'http%' 
AND audiourl IS NOT NULL;
```

---

## 🔄 Rollback / بازگشت

If migration causes issues, rollback:

```sql
-- Revert worship_songs URLs
UPDATE worship_songs
SET audiourl = REPLACE(audiourl, 
  'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/',
  '/worship/data/audio/')
WHERE audiourl LIKE 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/%';

-- Verify
SELECT id, audiourl FROM worship_songs WHERE audiourl LIKE '/worship%' LIMIT 5;
```

---

## 📚 Resources / منابع

- **IONOS HiDrive Docs**: https://www.ionos.com/help/hidrive/
- **SFTP Client**: https://www.npmjs.com/package/ssh2-sftp-client
- **rsync Manual**: https://linux.die.net/man/1/rsync
- **WinSCP**: https://winscp.net/

---

## ✅ Post-Migration Checklist / چک‌لیست پس از مهاجرت

- [ ] All files uploaded to HiDrive
- [ ] Database URLs updated
- [ ] Frontend can access files via new URLs
- [ ] Audio player works with HiDrive URLs
- [ ] Admin dashboard shows correct file locations
- [ ] Backup old files before deleting from server
- [ ] Monitor server disk space (should be reduced)
- [ ] Test upload new files directly to HiDrive
- [ ] Document any custom changes for team

---

## 🎉 Success! / موفقیت!

After successful migration:
- ✅ ~9GB of heavy files moved to cloud
- ✅ Server storage costs reduced
- ✅ Faster file delivery via CDN
- ✅ Scalable storage solution
- ✅ Existing functionality maintained

**از HiDrive استفاده کنید و فضای سرور را آزاد کنید! 🚀**

---

**Last Updated**: 2025-11-10
**Version**: 1.0.0
**Maintainer**: Church Tech Team
