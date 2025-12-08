# 📦 Storage Migration Guide - مهاجرت فایل‌های سنگین

## 🎯 هدف
انتقال فایل‌های سنگین (صوت، تصویر، ویدیو) از سرور به **Supabase Storage** برای:
- کاهش فشار روی سرور
- سرعت بالاتر (CDN)
- مدیریت بهتر فضا
- کاهش هزینه

---

## 📊 فایل‌های قابل مهاجرت

### 1. Worship Audio (اولویت بالا)
```
📁 public/worship/audio/          ~3-5 GB
   - فایل‌های MP3/M4A ستایش
   
📁 public/worship/data/            ~500 MB
   - JSON files
   - Timing files
   
📁 public/worship/pdf/             ~1 GB
   - PDF documents
```

### 2. Bible Audio (اولویت بالا)
```
📁 public/bible/audio/             ~2-3 GB
   - فایل‌های MP3 کتاب مقدس
   
📁 public/bible/data/timings/      ~25 MB
   - 1071 timing JSON files
```

### 3. Sermons (اولویت متوسط)
```
📁 public/sermons/                 ~5-10 GB
   - ویدیوها و MP3های موعظه
```

### 4. Images (اولویت پایین)
```
📁 public/images/                  ~500 MB
   - تصاویر سایت
```

---

## 🚀 مراحل Setup

### 1. تنظیم Supabase Storage

در Supabase Dashboard:
1. برو به **Storage** section
2. ایجاد buckets زیر (همه Public):
   - `worship-audio`
   - `bible-audio`
   - `sermons`
   - `images`
   - `documents`
   - `videos`

### 2. تنظیم Environment Variables

در `.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key  # برای upload
```

### 3. نصب Dependencies

```bash
npm install @supabase/supabase-js multer
```

---

## 📝 استفاده از اسکریپت Migration

### Setup Buckets فقط
```bash
node scripts/migrate-to-storage.cjs --type=setup
```

### مهاجرت Worship Audio
```bash
node scripts/migrate-to-storage.cjs --type=worship
```

### مهاجرت Bible Audio
```bash
node scripts/migrate-to-storage.cjs --type=bible
```

### مهاجرت Bible Timings
```bash
node scripts/migrate-to-storage.cjs --type=bible-timings
```

### مهاجرت همه چیز (احتیاط!)
```bash
node scripts/migrate-to-storage.cjs --type=all
```

### تولید URL Mapping
```bash
node scripts/migrate-to-storage.cjs --type=mapping
```

---

## 🔄 Update کردن کدهای Frontend

### قبل:
```javascript
const audioUrl = '/worship/audio/song-123.mp3';
```

### بعد:
```javascript
const audioUrl = 'https://your-project.supabase.co/storage/v1/object/public/worship-audio/audio/song-123.mp3';
```

### با Helper Function:
```javascript
// utils/storage.ts
export function getStorageUrl(bucket: string, path: string) {
  return `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// Usage
const audioUrl = getStorageUrl('worship-audio', 'audio/song-123.mp3');
```

---

## 🗄️ Update Database References

تمام جاهایی که URL فایل ذخیره شده باید update بشن:

### 1. Worship Songs Table
```sql
UPDATE worship_songs 
SET audio_url = REPLACE(
  audio_url, 
  '/worship/audio/', 
  'https://your-project.supabase.co/storage/v1/object/public/worship-audio/audio/'
)
WHERE audio_url LIKE '/worship/audio/%';
```

### 2. Bible Audio References
```sql
UPDATE bible_audio_files
SET audio_url = REPLACE(
  audio_url,
  '/bible/audio/',
  'https://your-project.supabase.co/storage/v1/object/public/bible-audio/audio/'
)
WHERE audio_url LIKE '/bible/audio/%';
```

### 3. Sermons
```sql
UPDATE sermons
SET video_url = REPLACE(
  video_url,
  '/sermons/',
  'https://your-project.supabase.co/storage/v1/object/public/sermons/'
)
WHERE video_url LIKE '/sermons/%';
```

---

## 📱 API Usage

### Upload فایل جدید
```javascript
// POST /api/storage/upload
const formData = new FormData();
formData.append('file', audioFile);
formData.append('bucket', 'worship-audio');
formData.append('path', 'audio/new-song.mp3');

const response = await fetch('/api/storage/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { url } = await response.json();
// url: https://...supabase.co/storage/v1/object/public/worship-audio/audio/new-song.mp3
```

### لیست فایل‌ها
```javascript
// GET /api/storage/list/worship-audio?folder=audio
const response = await fetch('/api/storage/list/worship-audio?folder=audio', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { files } = await response.json();
```

### حذف فایل
```javascript
// DELETE /api/storage/delete/worship-audio/audio/song.mp3
await fetch('/api/storage/delete/worship-audio/audio/song.mp3', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### گرفتن Public URL
```javascript
// GET /api/storage/url/worship-audio/audio/song.mp3
const response = await fetch('/api/storage/url/worship-audio/audio/song.mp3');
const { url } = await response.json();
```

### گرفتن Signed URL (برای فایل‌های private)
```javascript
// GET /api/storage/url/worship-audio/audio/song.mp3?signed=true&expiresIn=3600
const response = await fetch('/api/storage/url/worship-audio/audio/song.mp3?signed=true&expiresIn=3600');
const { url, expiresIn } = await response.json();
```

---

## ⚡ Performance Tips

### 1. CDN Caching
Supabase Storage به صورت خودکار CDN داره، ولی می‌تونی cache headers رو تنظیم کنی:

```javascript
await storage.uploadFile(bucket, localPath, remotePath, {
  cacheControl: '31536000', // 1 year
  contentType: 'audio/mpeg'
});
```

### 2. Lazy Loading
```javascript
// برای تصاویر
<img src={storageUrl} loading="lazy" />

// برای صوت - فقط وقتی play می‌شه load کن
<audio preload="none" src={storageUrl} />
```

### 3. Progressive Loading
برای فایل‌های بزرگ، از range requests استفاده کن:
```javascript
fetch(audioUrl, {
  headers: {
    'Range': 'bytes=0-1023' // اول 1KB
  }
});
```

---

## 🔐 Security

### Public vs Private Buckets

**Public Buckets** (برای محتوای عمومی):
- `worship-audio` ✅
- `bible-audio` ✅
- `images` ✅
- `documents` (PDF های عمومی) ✅

**Private Buckets** (اگر نیاز باشه):
- `sermons-premium` (موعظه‌های اختصاصی)
- `member-content` (محتوای فقط برای اعضا)

### RLS Policies

برای private buckets، policy بزن:

```sql
-- فقط اعضای login شده
CREATE POLICY "Members can view sermon files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'sermons' AND
  auth.role() = 'authenticated'
);

-- فقط admin می‌تونه upload کنه
CREATE POLICY "Admins can upload"
ON storage.objects FOR INSERT
USING (
  bucket_id = 'sermons' AND
  auth.jwt() ->> 'role' = 'SUPER_ADMIN'
);
```

---

## 💰 هزینه‌ها

### Supabase Storage Pricing (تقریبی):
- **Free Tier**: 1 GB storage + 2 GB bandwidth/month
- **Pro ($25/month)**: 100 GB storage + 200 GB bandwidth
- **Storage اضافه**: $0.021/GB/month
- **Bandwidth اضافه**: $0.09/GB

### تخمین هزینه برای پروژه شما:
```
Worship Audio:    ~4 GB
Bible Audio:      ~3 GB
Sermons:          ~8 GB
Images:           ~0.5 GB
Documents:        ~1 GB
Bible Timings:    ~0.025 GB
-------------------------
Total:            ~16.5 GB

Pro Plan:         $25/month  (شامل 100 GB می‌شه)
```

---

## 🧹 Cleanup بعد از Migration

### 1. بررسی کنید همه چیز کار می‌کنه
```bash
# تست تمام URLها
npm test
```

### 2. Backup بگیر
```bash
# فایل‌های قدیمی رو فشرده کن
tar -czf public-backup-$(date +%Y%m%d).tar.gz public/
```

### 3. حذف فایل‌های local (احتیاط!)
```bash
# فقط بعد از اطمینان کامل!
rm -rf public/worship/audio/*
rm -rf public/bible/audio/*
# یا keep کن برای backup
```

---

## 🐛 Troubleshooting

### خطای "CORS"
اگر از domain دیگه‌ای می‌خوای access کنی:
1. Supabase Dashboard > Storage > Configuration
2. CORS allowed origins: اضافه کن `*` یا domain خودت

### خطای "File too large"
```javascript
// در storageService.js
fileSizeLimit: 1024 * 1024 * 1024 // 1 GB
```

### خطای "Permission denied"
- Check SUPABASE_SERVICE_KEY
- Check bucket policies (public vs private)

### Upload آهسته
- استفاده از compression قبل از upload:
```bash
ffmpeg -i input.mp3 -b:a 128k output.mp3  # کاهش کیفیت
```

---

## 📚 منابع

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/storage-from-upload)
- [CDN Best Practices](https://developers.cloudflare.com/cache/)

---

## ✅ Checklist

- [ ] Setup Supabase buckets
- [ ] Configure environment variables
- [ ] Run migration script (test با یک فایل اول)
- [ ] Update database URLs
- [ ] Update frontend code
- [ ] Test audio playback
- [ ] Test image loading
- [ ] Check all links
- [ ] Backup local files
- [ ] Remove local files (optional)
- [ ] Monitor storage usage
- [ ] Setup alerts برای bandwidth

---

**نکته مهم**: اول با **یک یا دو فایل تست کن** قبل از اینکه همه چیز رو migrate کنی! 🚨
