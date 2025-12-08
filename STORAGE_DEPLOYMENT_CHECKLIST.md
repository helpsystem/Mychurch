# ✅ Storage System Deployment Checklist

## Pre-Deployment

- [ ] Supabase project created
- [ ] Storage enabled in Supabase dashboard
- [ ] `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` added to server `.env`
- [ ] Backend has internet access to Supabase
- [ ] PM2 running backend on server

## Deployment Steps

### 1. Deploy Code
```powershell
.\deploy-storage.ps1
```

**Expected output:**
```
[1/5] Uploading Storage Service...
✓ Storage service uploaded
[2/5] Uploading Storage Routes...
✓ Storage routes uploaded
[3/5] Uploading Migration Script...
✓ Migration script uploaded
[4/5] Uploading Updated server.js...
✓ Server.js uploaded
[5/5] Restarting Backend...
✓ Backend restarted
```

- [ ] All 5 files uploaded successfully
- [ ] Backend restarted without errors

### 2. Test API Connectivity
```bash
# از local تست کن
curl https://samanabyar.online/api/storage/buckets
```

**Expected response:**
```json
{
  "success": true,
  "buckets": [
    {"name": "worship-audio", "public": true},
    {"name": "bible-audio", "public": true},
    ...
  ]
}
```

- [ ] API responds with 200 OK
- [ ] Returns list of buckets

### 3. Setup Buckets (First Time Only)
```bash
ssh root@samanabyar.online
cd /root/Mychurch
node scripts/migrate-to-storage.cjs --type=setup
```

**Expected output:**
```
Creating buckets...
✓ Created bucket: worship-audio (public)
✓ Created bucket: bible-audio (public)
✓ Created bucket: sermons (public)
✓ Created bucket: images (public)
✓ Created bucket: documents (public)
✓ Created bucket: videos (public)
All buckets created successfully!
```

- [ ] All 6 buckets created
- [ ] No errors about existing buckets (or "already exists" is OK)

### 4. Test Small Migration
```bash
# Bible timings (smallest, ~25MB, 1071 files)
ssh root@samanabyar.online
cd /root/Mychurch
node scripts/migrate-to-storage.cjs --type=bible-timings
```

**Expected output:**
```
Migrating bible-timings...
Source: public/bible/data/timings/
Destination: bible-audio/timings/
Scanning files...
Found 1071 files (24.5 MB)
Uploading...
[████████████████████████████████████] 1071/1071 (24.5 MB)
✓ Success: 1071 files
✗ Failed: 0 files
Total time: ~5 minutes
```

- [ ] All files uploaded successfully
- [ ] No upload failures
- [ ] Progress bar reached 100%

### 5. Verify Uploaded Files
```bash
# لیست فایل‌ها
curl https://samanabyar.online/api/storage/list/bible-audio?folder=timings
```

**Expected response:**
```json
{
  "success": true,
  "files": [
    {"name": "genesis_1_timing.json", "size": 23456, ...},
    {"name": "genesis_2_timing.json", "size": 18932, ...},
    ...
  ]
}
```

- [ ] Returns list of uploaded files
- [ ] File count matches source (1071 files)

### 6. Test Public URL Access
```bash
# یک فایل رندوم تست کن
curl -I https://YOUR_PROJECT.supabase.co/storage/v1/object/public/bible-audio/timings/genesis_1_timing.json
```

**Expected output:**
```
HTTP/2 200
content-type: application/json
content-length: 23456
...
```

- [ ] Returns 200 OK
- [ ] Content-Type is correct
- [ ] File size matches

### 7. Test in Frontend (Optional)
```tsx
// در یک test component
import { getBibleTimingUrl, checkFileExists } from '@/lib/storage';

const url = getBibleTimingUrl('genesis', 1);
console.log(url);
// https://PROJECT.supabase.co/storage/v1/object/public/bible-audio/timings/genesis_1_timing.json

const exists = await checkFileExists(url);
console.log(exists); // true
```

- [ ] URL generated correctly
- [ ] File accessible from browser
- [ ] No CORS errors

### 8. Full Migration (After Test Success)

**Estimated times:**
- Bible timings: ~5 min (25MB, 1071 files) ✓ Already done
- Worship data: ~10 min (500MB)
- Bible audio: ~30 min (3GB)
- Worship audio: ~45 min (4GB)
- Sermons: ~1-2 hours (10GB)
- Images: ~10 min (500MB)

```bash
# Migrate worship data
node scripts/migrate-to-storage.cjs --type=worship-data

# Migrate bible audio
node scripts/migrate-to-storage.cjs --type=bible

# Migrate worship audio
node scripts/migrate-to-storage.cjs --type=worship

# Or all at once (takes 2-3 hours)
node scripts/migrate-to-storage.cjs --type=all
```

- [ ] All migrations completed
- [ ] No failures
- [ ] Total size matches expected (~16.5GB)

### 9. Update Database URLs

**After successful migration, run SQL in Supabase:**

```sql
-- Update worship songs audio URLs
UPDATE worship_songs 
SET audio_url = REPLACE(
  audio_url, 
  '/worship/audio/', 
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/worship-audio/audio/'
)
WHERE audio_url LIKE '/worship/audio/%';

-- Update bible audio URLs
UPDATE bible_audio_files 
SET audio_url = REPLACE(
  audio_url,
  '/bible/audio/',
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/bible-audio/audio/'
)
WHERE audio_url LIKE '/bible/audio/%';

-- Update sermons
UPDATE sermons 
SET video_url = REPLACE(
  video_url,
  '/sermons/',
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/sermons/'
)
WHERE video_url LIKE '/sermons/%';

-- Verify changes
SELECT audio_url FROM worship_songs LIMIT 5;
SELECT audio_url FROM bible_audio_files LIMIT 5;
SELECT video_url FROM sermons LIMIT 5;
```

- [ ] All UPDATE queries ran successfully
- [ ] URLs now point to storage
- [ ] Test queries show correct format

### 10. Update Frontend Code

**Option 1: Auto-migrate URLs (Recommended)**
```tsx
// در components که URL دارند
import { migrateUrl } from '@/lib/storage';

// قبل از استفاده:
const finalUrl = migrateUrl(song.audioUrl);
```

**Option 2: Update data source directly**
```tsx
// در ContentContext یا useContent
const audioUrl = getBibleAudioUrl(bookKey, chapter);
```

- [ ] Frontend updated to use storage URLs
- [ ] Audio players work correctly
- [ ] No broken links

### 11. Test Frontend Playback

**Test pages:**
- [ ] Worship songs page (`/#/worship`)
- [ ] Bible audio page (`/#/bible`)
- [ ] Sermons page (`/#/sermons`)
- [ ] Admin dashboard

**For each page:**
- [ ] Audio/video loads without errors
- [ ] Playback starts correctly
- [ ] No console errors
- [ ] Timing sync works (if applicable)

### 12. Performance Check

**Before migration (baseline):**
- Server bandwidth usage: `___ GB/month`
- Audio load time: `___ seconds`
- Server CPU/Memory: `___ %`

**After migration:**
- [ ] Server bandwidth reduced
- [ ] Audio load time same or faster (CDN)
- [ ] Server CPU/Memory reduced
- [ ] Supabase storage: ~16.5GB used
- [ ] Supabase bandwidth: `___ GB/month`

### 13. Monitor for Issues

**First 24 hours:**
- [ ] No 404 errors in browser console
- [ ] No audio playback failures
- [ ] No CORS errors
- [ ] Supabase bandwidth within free tier or acceptable Pro tier

**First week:**
- [ ] Monitor Supabase usage dashboard
- [ ] Check for any user complaints
- [ ] Verify billing is as expected

### 14. Backup & Cleanup

**Backup original files:**
```bash
ssh root@samanabyar.online
cd /root/Mychurch
tar -czf backup-media-$(date +%Y%m%d).tar.gz public/worship/audio public/bible/audio public/sermons
```

- [ ] Backup created
- [ ] Backup size verified
- [ ] Backup downloaded to local (optional)

**Cleanup (after 1 week of stable operation):**
```bash
# Remove large files from server (optional)
rm -rf public/worship/audio/*
rm -rf public/bible/audio/*
# Keep backup file!
```

- [ ] Old files removed (if desired)
- [ ] Backup kept safe
- [ ] Server disk space freed

### 15. Documentation

- [ ] Update `README.md` with storage info
- [ ] Update deployment docs
- [ ] Document rollback procedure
- [ ] Add monitoring alerts

---

## Rollback Procedure (If Needed)

If something goes wrong:

1. **Restore database URLs:**
```sql
UPDATE worship_songs 
SET audio_url = REPLACE(audio_url, 'supabase.co/storage/v1/object/public/worship-audio/audio/', '/worship/audio/');
```

2. **Revert frontend code:**
```bash
git revert <commit-hash>
npm run build
```

3. **Re-upload static files:**
```bash
scp -r public/worship/audio root@samanabyar.online:/root/Mychurch/public/worship/
```

4. **Restart backend:**
```bash
ssh root@samanabyar.online "pm2 restart mychurch-backend"
```

---

## Success Criteria

✅ **Deployment successful if:**
- All API endpoints respond correctly
- Files uploaded to Supabase Storage
- Database URLs updated
- Frontend plays audio/video without errors
- No increase in error rates
- Server resources freed up
- Costs within budget

🚨 **Consider rollback if:**
- High rate of 404 errors
- Audio playback failures
- CORS issues not resolved
- Supabase costs exceed budget
- User complaints increase

---

## Estimated Timeline

- **Setup + Deploy**: 30 minutes
- **Small migration test**: 15 minutes
- **Full migration**: 2-3 hours
- **Database updates**: 10 minutes
- **Frontend updates**: 30 minutes
- **Testing**: 1 hour
- **Monitoring**: 24 hours

**Total**: ~1 day for complete migration

---

## Cost Monitoring

**Supabase Pro Plan ($25/month):**
- 100GB storage (we use ~16.5GB = 16.5%)
- 200GB bandwidth/month
- Estimate: 500-1000 plays/day × 3MB avg = 45-90GB/month

✅ **Within budget if:**
- Bandwidth < 200GB/month
- No surge in traffic

🚨 **Upgrade needed if:**
- Bandwidth > 200GB/month regularly
- Need > 100GB storage

---

**Ready to start? Run:**
```powershell
.\deploy-storage.ps1
```
