# 🚀 سیستم خودکار همگام‌سازی سرودها - راهنمای کامل

## 📋 فهرست مطالب
1. [نمای کلی معماری](#نمای-کلی-معماری)
2. [جزئیات فنی](#جزئیات-فنی)
3. [نصب و راه‌اندازی](#نصب-و-راه-اندازی)
4. [استفاده](#استفاده)
5. [نظارت و مدیریت](#نظارت-و-مدیریت)
6. [رفع مشکلات](#رفع-مشکلات)

---

## 🏗️ نمای کلی معماری

### فرآیند خودکار (Automatic Flow):

```
┌─────────────────────────────────────────────────────────────┐
│  1. سرود جدید اضافه می‌شود (Create Worship Song)          │
│     POST /api/worship-songs                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Auto-check: Has audio + lyrics?
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Job به صف اضافه می‌شود (Queue Job)                    │
│     INSERT INTO sync_jobs (...)                              │
│     Status: 'pending'                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Background Worker polls every 10s
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Worker پردازش را شروع می‌کند (Processing)             │
│     - Download audio file                                    │
│     - Send to Gemini AI                                      │
│     - Extract timing, chords, structure                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Success or Failure
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  4. نتایج در دیتابیس ذخیره می‌شود (Save Results)          │
│     UPDATE worship_songs SET timing_data = ...               │
│     UPDATE sync_jobs SET status = 'completed'                │
└─────────────────────────────────────────────────────────────┘
```

### فرآیند دستی (Manual Re-sync):

```
┌─────────────────────────────────────────────────────────────┐
│  1. ادمین دکمه Re-sync را می‌زند                           │
│     POST /api/worship-songs/:id/resync                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Priority = 1 (highest)
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Job با اولویت بالا به صف اضافه می‌شود                │
│     (Same as automatic flow, but priority 1)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 جزئیات فنی

### 1. **Database Schema**

#### جدول `sync_jobs` (صف کارها):
```sql
CREATE TABLE sync_jobs (
    id SERIAL PRIMARY KEY,
    job_type VARCHAR(50),        -- 'worship_song' or 'bible_chapter'
    entity_id INTEGER,            -- ID سرود یا فصل کتاب مقدس
    status VARCHAR(20),           -- 'pending', 'processing', 'completed', 'failed'
    priority INTEGER DEFAULT 5,   -- 1 = بالاترین اولویت
    attempts INTEGER DEFAULT 0,   -- تعداد تلاش‌ها
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    result JSONB,
    created_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);
```

#### ستون‌های جدید در `worship_songs`:
```sql
ALTER TABLE worship_songs 
ADD COLUMN auto_sync_enabled BOOLEAN DEFAULT true,
ADD COLUMN processing_status VARCHAR(20) DEFAULT 'not_processed';
-- processing_status: 'not_processed', 'queued', 'processing', 'completed', 'failed'
```

### 2. **Background Worker**

فایل: `backend/services/syncWorker.js`

**ویژگی‌ها:**
- ✅ اجرا به صورت خودکار در background
- ✅ Polling هر 10 ثانیه
- ✅ پردازش همزمان حداکثر 2 سرود
- ✅ Auto-retry برای jobهای failed (تا 3 بار)
- ✅ Priority queue (manual re-sync = priority 1)
- ✅ Database locking برای جلوگیری از race condition

**نحوه کار:**
```javascript
// شروع در server.js
const syncWorker = require('./services/syncWorker');
syncWorker.start();

// متد اصلی
async processLoop() {
  while (this.isRunning) {
    if (this.activeJobs < this.maxConcurrentJobs) {
      await this.processNextJob(); // Get & process next pending job
    }
    await this.sleep(10000); // Wait 10 seconds
  }
}
```

### 3. **API Endpoints**

#### 📌 `POST /api/worship-songs` (ایجاد سرود جدید)
**تغییرات:**
- ✅ Auto-queue برای پردازش اگر `audioUrl` و `lyrics` موجود باشند
- ✅ پارامتر `autoSync` (optional): اگر `false` باشد، auto-sync انجام نمی‌شود

**مثال Request:**
```json
{
  "title": { "fa": "عنوان فارسی", "en": "English Title" },
  "artist": "نام هنرمند",
  "youtubeId": "abc123",
  "lyrics": { "fa": "متن فارسی...", "en": "English lyrics..." },
  "audioUrl": "/worship/audio/song.mp3",
  "autoSync": true
}
```

**Response:**
```json
{
  "id": 365,
  "title": { "fa": "عنوان فارسی", "en": "English Title" },
  "processingStatus": "queued",
  "autoSyncEnabled": true
}
```

#### 📌 `POST /api/worship-songs/:id/resync` (Re-sync دستی)
**دسترسی:** SUPER_ADMIN, MANAGER, WORSHIP_LEADER

**Request:**
```json
{
  "priority": 1  // Optional: 1-10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Song queued for re-sync",
  "songId": 365,
  "processingStatus": "queued"
}
```

#### 📌 `GET /api/worship-songs/:id/sync-status` (چک وضعیت)
**Response:**
```json
{
  "hasJob": true,
  "job": {
    "id": 42,
    "status": "processing",
    "attempts": 1,
    "maxAttempts": 3,
    "createdAt": "2025-11-10T17:00:00Z",
    "startedAt": "2025-11-10T17:00:10Z"
  }
}
```

### 4. **Frontend Component**

فایل: `components/SyncStatusBadge.tsx`

**ویژگی‌ها:**
- ✅ نمایش وضعیت real-time (Auto-refresh هر 5 ثانیه)
- ✅ Badge رنگی برای هر وضعیت:
  - 🟢 **Completed**: سبز
  - 🔵 **Processing**: آبی (با انیمیشن)
  - 🟡 **Queued**: زرد
  - 🔴 **Failed**: قرمز
  - ⚪ **Not Processed**: خاکستری
- ✅ Tooltip با جزئیات
- ✅ دکمه Re-sync برای ادمین‌ها

**استفاده:**
```tsx
import SyncStatusBadge from './SyncStatusBadge';

<SyncStatusBadge 
  songId={song.id}
  processingStatus={song.processingStatus}
  showResyncButton={isAdmin}
  onResyncClick={() => console.log('Resynced!')}
/>
```

---

## 🚀 نصب و راه‌اندازی

### مرحله 1: ایجاد جدول دیتابیس

```bash
ssh root@samanabyar.online
psql -U myuser -d mychurch -f /root/Mychurch/backend/migrations/create_sync_jobs_table.sql
```

**یا دستی:**
```bash
psql -U myuser -d mychurch
```

```sql
-- Copy/paste محتوای فایل create_sync_jobs_table.sql
```

### مرحله 2: آپلود فایل‌های Backend

```powershell
# Worker
scp backend\services\syncWorker.js root@samanabyar.online:/root/Mychurch/backend/services/

# Routes (updated)
scp backend\routes\worshipRoutes.js root@samanabyar.online:/root/Mychurch/backend/routes/

# Server (updated with worker start)
scp backend\server.js root@samanabyar.online:/root/Mychurch/backend/
```

### مرحله 3: Restart Backend

```bash
ssh root@samanabyar.online "pm2 restart mychurch-backend"
```

**چک لاگ‌ها:**
```bash
ssh root@samanabyar.online "pm2 logs mychurch-backend --lines 50"
```

**باید این پیام‌ها را ببینی:**
```
✅ Church API Backend running on http://localhost:3001
🚀 Background Sync Worker started
```

### مرحله 4: Build و Deploy Frontend

```powershell
# Build
npm run build

# Deploy
scp dist\index.html root@samanabyar.online:/var/www/html/
scp dist\assets\index-*.js root@samanabyar.online:/var/www/html/assets/
```

---

## 📱 استفاده

### برای کاربران عادی:
✅ **هیچ کاری لازم نیست!** همه چیز خودکار است.

### برای ادمین‌ها و رهبران:

#### 1️⃣ اضافه کردن سرود جدید
1. به صفحه **Admin Panel** → **Worship Songs** برو
2. روی **"Add New Song"** کلیک کن
3. فرم را پر کن:
   - عنوان (فارسی و انگلیسی)
   - هنرمند
   - YouTube ID
   - **متن سرود** (فارسی یا انگلیسی)
   - **فایل صوتی** (آپلود یا لینک)
4. روی **Save** کلیک کن

✨ **بعد از Save:**
- سرود به دیتابیس اضافه می‌شود
- اگر audio + lyrics داشته باشد، **خودکار** به صف پردازش اضافه می‌شود
- Worker در background شروع به پردازش می‌کند
- بعد از 30-60 ثانیه، timing data آماده است!

#### 2️⃣ نمایش وضعیت پردازش
در لیست سرودها، کنار هر سرود یک **Badge** نمایش داده می‌شود:

- 🟢 **Synced**: پردازش کامل شده
- 🔵 **Processing...**: در حال پردازش
- 🟡 **Queued**: در صف
- 🔴 **Failed**: خطا
- ⚪ **Not Processed**: پردازش نشده

#### 3️⃣ Re-sync دستی
اگر نیاز به آپدیت یا پردازش مجدد داری:
1. روی دکمه **🔄 Re-sync** کنار سرود کلیک کن
2. سرود با **اولویت بالا** (priority 1) به صف اضافه می‌شود
3. Worker در اولین فرصت آن را پردازش می‌کند

---

## 🔍 نظارت و مدیریت

### چک کردن صف کارها

```bash
ssh root@samanabyar.online
psql -U myuser -d mychurch
```

```sql
-- نمایش همه jobهای در صف
SELECT id, job_type, entity_id, status, priority, attempts, created_at 
FROM sync_jobs 
WHERE status IN ('pending', 'processing')
ORDER BY priority ASC, created_at ASC;

-- نمایش آخرین jobها
SELECT 
  sj.id, 
  sj.status, 
  sj.attempts,
  ws.title->>'fa' as song_title,
  sj.created_at,
  sj.completed_at,
  sj.error_message
FROM sync_jobs sj
JOIN worship_songs ws ON sj.entity_id = ws.id
WHERE sj.job_type = 'worship_song'
ORDER BY sj.created_at DESC
LIMIT 10;

-- آمار کلی
SELECT 
  status, 
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_seconds
FROM sync_jobs
WHERE job_type = 'worship_song'
GROUP BY status;
```

### لاگ‌های Worker

```bash
# Live logs
ssh root@samanabyar.online "pm2 logs mychurch-backend --lines 100"

# Grep برای worker logs
ssh root@samanabyar.online "pm2 logs mychurch-backend --lines 500 | grep -i 'sync\|worker\|job'"
```

**پیام‌های مهم:**
```
🚀 Sync worker started
📋 Processing job 42 (worship_song #365)
🎵 Processing worship song 365
📥 Downloading audio from: https://...
✅ Audio downloaded: 3.42 MB
🤖 Generating AI analysis...
✅ Worship song 365 processed: 324 words, 12 chords
✅ Job 42 completed successfully
```

### Restart Worker

```bash
ssh root@samanabyar.online "pm2 restart mychurch-backend"
```

---

## 🐛 رفع مشکلات

### مشکل 1: Worker شروع نمی‌شود
**علت:** فایل `syncWorker.js` وجود ندارد یا خطای syntax

**راه حل:**
```bash
ssh root@samanabyar.online
cd /root/Mychurch/backend/services
ls -la syncWorker.js  # Check if file exists
node -c syncWorker.js  # Check for syntax errors
```

### مشکل 2: Jobها پردازش نمی‌شوند
**بررسی:**
```bash
# چک وضعیت PM2
ssh root@samanabyar.online "pm2 status"

# چک لاگ‌ها
ssh root@samanabyar.online "pm2 logs mychurch-backend --lines 100"
```

**احتمالات:**
1. Worker متوقف شده → Restart کن
2. GEMINI_API_KEY موجود نیست → چک کن `.env`
3. Job در حالت `processing` گیر کرده → Manual reset:
   ```sql
   UPDATE sync_jobs SET status = 'pending', attempts = 0 WHERE id = <job_id>;
   ```

### مشکل 3: همه jobها Failed می‌شوند
**بررسی:**
```sql
SELECT id, entity_id, error_message, attempts 
FROM sync_jobs 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 5;
```

**خطاهای رایج:**
- `"No audio URL found"` → سرود فایل صوتی ندارد
- `"No lyrics found"` → سرود متن ندارد
- `"Failed to download audio"` → لینک صوتی نامعتبر است
- `"GEMINI_API_KEY not configured"` → API key تنظیم نشده

**راه حل:**
1. سرود را اصلاح کن (audio/lyrics اضافه کن)
2. دوباره Re-sync کن

### مشکل 4: Worker CPU یا Memory زیاد مصرف می‌کند
**محدود کردن:**

در `syncWorker.js`:
```javascript
this.maxConcurrentJobs = 1; // کاهش به 1 job همزمان
this.pollInterval = 30000;  // افزایش polling به 30 ثانیه
```

**یا استفاده از PM2 limits:**
```bash
pm2 restart mychurch-backend --max-memory-restart 500M
```

### مشکل 5: Badge در frontend نمایش داده نمی‌شود
**بررسی:**
1. آیا `SyncStatusBadge` در component import شده؟
2. آیا `processing_status` از API برگردانده می‌شود؟
3. Console browser را چک کن برای خطاها

---

## 📊 تنظیمات پیشرفته

### تغییر اولویت پیش‌فرض

در `worshipRoutes.js` خط قبل از INSERT:
```javascript
const defaultPriority = 5; // 1 = بالاترین، 10 = پایین‌ترین
```

### غیرفعال کردن Auto-sync برای همه سرودها

در دیتابیس:
```sql
UPDATE worship_songs SET auto_sync_enabled = false;
```

### افزایش max_attempts

```sql
ALTER TABLE sync_jobs ALTER COLUMN max_attempts SET DEFAULT 5;
UPDATE sync_jobs SET max_attempts = 5 WHERE status = 'pending';
```

### پاک کردن jobهای قدیمی

```sql
-- حذف jobهای completed بیش از 30 روز قبل
DELETE FROM sync_jobs 
WHERE status = 'completed' 
AND completed_at < NOW() - INTERVAL '30 days';

-- حذف jobهای failed بیش از 7 روز قبل
DELETE FROM sync_jobs 
WHERE status = 'failed' 
AND created_at < NOW() - INTERVAL '7 days';
```

---

## 🎯 خلاصه مزایا

### ✅ برای کاربران:
- سرودها **خودکار** پردازش می‌شوند
- بدون نیاز به مداخله دستی
- تجربه یکپارچه و seamless

### ✅ برای ادمین‌ها:
- یک دکمه ساده برای Re-sync
- نمایش وضعیت real-time
- کنترل کامل روی صف پردازش
- لاگ‌های دقیق برای troubleshooting

### ✅ برای سیستم:
- پردازش background بدون تأثیر روی performance
- Auto-retry برای reliability
- Priority queue برای کنترل بهتر
- Scalable: می‌تواند تا صدها سرود را مدیریت کند

---

## 📞 پشتیبانی

اگر مشکلی داشتی:
1. لاگ‌های PM2 را چک کن
2. جدول `sync_jobs` را بررسی کن
3. Console browser را چک کن
4. بهم اطلاع بده تا کمک کنم!

---

**تاریخ ایجاد:** 2025-11-10  
**نسخه:** 1.0.0  
**وضعیت:** ✅ آماده برای Production
