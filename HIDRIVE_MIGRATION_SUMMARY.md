# HiDrive Storage Integration - Summary Report
# گزارش خلاصه یکپارچه‌سازی ذخیره‌سازی HiDrive

## ✅ Completed / انجام شده

### 1. Analysis / تحلیل
- ✅ Analyzed heavy files: **9.2 GB** total (3,485 files)
- ✅ Categories identified:
  - Worship audio/videos
  - Sermon audio
  - Event images
  - Church photos
  - Bible audio/timings
  - AI generated images
  - Documents

### 2. Backend Implementation / پیاده‌سازی Backend

#### Files Created:
- ✅ `backend/services/hidriveStorage.js` - HiDrive SFTP client service
- ✅ `backend/routes/hidriveRoutes.js` - API endpoints for HiDrive management
- ✅ `backend/server.js` - Updated with HiDrive routes

#### API Endpoints:
- ✅ `POST /api/hidrive/upload` - Upload files to HiDrive
- ✅ `POST /api/hidrive/migrate` - Migrate local file to HiDrive
- ✅ `POST /api/hidrive/batch-migrate` - Batch migrate from database table
- ✅ `GET /api/hidrive/stats` - Get storage statistics
- ✅ `GET /api/hidrive/proxy/:category/:filename` - Stream files from HiDrive
- ✅ `DELETE /api/hidrive/file` - Delete file from HiDrive
- ✅ `POST /api/hidrive/check-exists` - Check if file exists

### 3. Migration Scripts / اسکریپت‌های مهاجرت

- ✅ `migrate-to-hidrive.ps1` - PowerShell migration script (dry-run, upload, update-db modes)
- ✅ `deploy-hidrive.sh` - Bash deployment script
- ✅ `deploy-hidrive.ps1` - PowerShell deployment script

### 4. Documentation / مستندات

- ✅ `HIDRIVE_STORAGE_GUIDE.md` - Complete 500+ line guide
- ✅ `HIDRIVE_QUICK_START.md` - Quick start manual migration guide
- ✅ `backend/.env.example` - Updated with HiDrive config
- ✅ `backend/.env.hidrive` - Sample HiDrive configuration

### 5. Dependencies / وابستگی‌ها

- ✅ `ssh2-sftp-client@11.0.0` - Installed and added to package.json

---

## 📋 Next Steps / مراحل بعدی

### Step 1: Deploy Backend to Production

```powershell
# Run deployment script
.\deploy-hidrive.ps1
```

**Manual steps:**
1. Upload `backend/services/hidriveStorage.js` to server
2. Upload `backend/routes/hidriveRoutes.js` to server
3. Upload updated `backend/server.js` to server
4. SSH to server: `ssh root@samanabyar.online`
5. Install package: `cd /root/Mychurch/backend && npm install ssh2-sftp-client`
6. Add HiDrive credentials to `/root/Mychurch/backend/.env`:
   ```
   HIDRIVE_HOST=sftp.hidrive.ionos.com
   HIDRIVE_PORT=22
   HIDRIVE_USER=adminchurch
   HIDRIVE_PASSWORD=[get from admin]
   HIDRIVE_BASE_PATH=/users/adminchurch/mychurch
   HIDRIVE_PUBLIC_URL=https://webdav.hidrive.ionos.com/users/adminchurch/mychurch
   ```
7. Restart backend: `pm2 restart mychurch-backend`
8. Verify: `pm2 logs mychurch-backend --lines 30`

### Step 2: Upload Files to HiDrive

**Option A: WinSCP (Recommended)**
1. Download: https://winscp.net/
2. Connect: `sftp://adminchurch@sftp.hidrive.ionos.com`
3. Create folders:
   - `/users/adminchurch/mychurch/worship/audio`
   - `/users/adminchurch/mychurch/events/images`
   - `/users/adminchurch/mychurch/sermons/audio`
4. Upload files from `public/` folders

**Option B: Command Line (rsync)**
```bash
# Upload worship audio
rsync -avz --progress public/worship/data/audio/ \
  adminchurch@rsync.hidrive.ionos.com:/users/adminchurch/mychurch/worship/audio/
```

### Step 3: Update Database URLs

```sql
-- Connect to database
ssh root@samanabyar.online
psql -U myuser -d mychurch

-- Update worship_songs
UPDATE worship_songs
SET audiourl = REPLACE(audiourl, '/worship/data/audio/', 
  'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/')
WHERE audiourl LIKE '/worship/data/audio/%';

-- Verify
SELECT id, title, audiourl FROM worship_songs WHERE audiourl LIKE 'https://webdav%' LIMIT 5;

-- Update events
UPDATE events
SET imageurl = REPLACE(imageurl, '/images/', 
  'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/events/images/')
WHERE imageurl LIKE '/images/%';

-- Commit
\q
```

### Step 4: Test on Website

1. Open: https://samanabyar.online/#/worship
2. Play a worship song
3. Check if audio loads from HiDrive
4. Open DevTools → Network tab
5. Verify URL: `https://webdav.hidrive.ionos.com/...`

### Step 5: Monitor Storage

```bash
# Check HiDrive stats via API
curl -X GET https://samanabyar.online/api/hidrive/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Or login to IONOS: https://www.ionos.com/

### Step 6: Cleanup Local Files (After Verification)

⚠️ **IMPORTANT**: Only after confirming files work on website!

```bash
# Backup first
ssh root@samanabyar.online
cd /var/www/html/
tar -czf heavy-files-backup-$(date +%Y%m%d).tar.gz public/worship/data/audio public/images public/audio

# Move to safe location
mv heavy-files-backup-*.tar.gz /root/backups/

# Delete local files to free space
rm -rf public/worship/data/audio/*
rm -rf public/images/*
rm -rf public/audio/*

# Check disk space freed
df -h
```

---

## 🎯 Expected Results / نتایج مورد انتظار

After successful migration:

- ✅ **Server Storage**: Reduced by ~9GB
- ✅ **Performance**: Faster file delivery via HiDrive CDN
- ✅ **Scalability**: Easy to add more files
- ✅ **Cost**: Lower server hosting costs
- ✅ **Reliability**: HiDrive backup and redundancy

---

## 🔧 Troubleshooting / رفع مشکل

### Backend Connection Issues

```bash
# Check if service is running
ssh root@samanabyar.online
pm2 list

# Check logs
pm2 logs mychurch-backend --lines 50

# Test SFTP connection from server
sftp adminchurch@sftp.hidrive.ionos.com
# Enter password
# Type: ls
# Type: exit
```

### Files Not Loading

1. **Check URL format**: Must be `https://webdav.hidrive.ionos.com/...`
2. **Test URL directly**: Open in browser
3. **Check CORS**: HiDrive should allow cross-origin requests
4. **Verify file uploaded**: Use WinSCP to browse HiDrive

### Database URLs Not Updated

```sql
-- Check current URLs
SELECT id, audiourl FROM worship_songs LIMIT 10;

-- If still local paths, re-run UPDATE query
UPDATE worship_songs
SET audiourl = REPLACE(audiourl, '/worship/data/audio/', 
  'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/')
WHERE audiourl LIKE '/worship/data/audio/%';
```

---

## 📚 Documentation / مستندات

- **Full Guide**: `HIDRIVE_STORAGE_GUIDE.md` (500+ lines)
- **Quick Start**: `HIDRIVE_QUICK_START.md` (Manual steps)
- **API Reference**: Section 6 in `HIDRIVE_STORAGE_GUIDE.md`
- **Code Examples**: Section 7 in `HIDRIVE_STORAGE_GUIDE.md`

---

## 🚀 Future Enhancements / بهبودهای آینده

1. **Auto-upload on song creation**: Modify `worshipRoutes.js` to upload directly to HiDrive
2. **Admin UI**: Add HiDrive management page in admin dashboard
3. **Storage monitoring**: Add storage usage widget in admin panel
4. **Automatic cleanup**: Schedule job to delete old local files after migration
5. **CDN integration**: Consider Cloudflare in front of HiDrive for better performance

---

## 📊 Storage Comparison / مقایسه ذخیره‌سازی

| Metric | Before (Local) | After (HiDrive) |
|--------|---------------|-----------------|
| **Server Storage** | 9.2 GB | ~100 MB (metadata only) |
| **Upload Speed** | Limited by server | Faster (HiDrive optimized) |
| **Scalability** | Limited by disk | Up to 500GB+ (HiDrive plan) |
| **Cost** | Server storage fees | HiDrive subscription |
| **Backup** | Manual | Automatic (HiDrive) |
| **CDN** | None | Built-in (HiDrive) |

---

## ✅ Checklist / چک‌لیست

- [ ] Backend files deployed to server
- [ ] `ssh2-sftp-client` installed on server
- [ ] HiDrive credentials added to `.env`
- [ ] Backend restarted with `pm2 restart`
- [ ] Files uploaded to HiDrive via WinSCP/rsync
- [ ] Database URLs updated with SQL scripts
- [ ] Website tested - audio/images load from HiDrive
- [ ] API endpoints tested (`/api/hidrive/stats`)
- [ ] Local files backed up
- [ ] Old local files deleted (after verification)
- [ ] Server disk space verified (df -h)
- [ ] Documentation reviewed by team

---

## 🎉 Success Criteria / معیارهای موفقیت

Migration is successful when:

1. ✅ All worship songs play from HiDrive URLs
2. ✅ All event images display from HiDrive URLs
3. ✅ Server disk space reduced by ~9GB
4. ✅ No broken links or 404 errors
5. ✅ Admin can upload new files to HiDrive via API
6. ✅ `/api/hidrive/stats` returns storage information
7. ✅ Team members can access HiDrive via WinSCP/SFTP

---

## 📞 Support / پشتیبانی

- **IONOS Support**: https://www.ionos.com/help/hidrive/
- **Technical Docs**: HIDRIVE_STORAGE_GUIDE.md
- **Quick Help**: HIDRIVE_QUICK_START.md

---

**Last Updated**: 2025-11-10
**Status**: ✅ Ready for Deployment
**Estimated Time**: 2-3 hours for full migration
