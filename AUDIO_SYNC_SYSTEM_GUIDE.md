# 🎵 سیستم همگام‌سازی خودکار صوتی

## نمای کلی (Overview)

این سیستم یک راه‌حل قدرتمند برای همگام‌سازی خودکار فایل‌های صوتی با متن‌ها است که از هوش مصنوعی Gemini استفاده می‌کند. این سیستم دو حالت عملکرد دارد:

### 1️⃣ حالت سرودهای پرستشی (Worship Songs Mode)
- **مخاطب**: مدیران و رهبران پرستش
- **محل استفاده**: پنل ادمین (`/#/admin/sync-management`)
- **فرآیند**:
  - آپلود سرود پرستشی (صوتی + متن Finglish و فارسی)
  - پردازش خودکار یا دستی با زدن دکمه
  - ذخیره‌سازی timing در دیتابیس
  - نمایش به کاربران در صفحات مختلف

### 2️⃣ حالت کتاب مقدس صوتی (Bible Audio Mode)
- **مخاطب**: مدیران سایت
- **محل استفاده**: پنل ادمین (همان صفحه)
- **فرآیند**:
  - انتخاب فصل کتاب مقدس
  - دریافت خودکار فایل صوتی از هاست
  - استخراج متن آیات از دیتابیس
  - پردازش و همگام‌سازی توسط AI
  - ذخیره timing برای نمایش به کاربران

---

## 🏗️ معماری (Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Panel UI                           │
│         (AdminSyncManagementPage.tsx)                       │
│  - Upload Interface                                         │
│  - Batch Processing                                         │
│  - Progress Monitoring                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend API Layer                            │
│           (/api/audio-sync/*)                               │
│  - POST /process-worship    (Upload + Process)              │
│  - POST /process-bible      (URL + Process)                 │
│  - GET  /timing/worship/:id (Retrieve Timing)               │
│  - GET  /timing/bible/:book/:ch/:trans (Retrieve Timing)    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Gemini AI Processing                           │
│         (Google Generative AI)                              │
│  - Audio Analysis (Base64)                                  │
│  - Word-level Timestamp Generation                          │
│  - Verse-level Segmentation                                 │
│  - JSON Structured Output                                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Database Storage                               │
│           (PostgreSQL/Supabase)                             │
│  Tables:                                                    │
│  - worship_songs (timing_data JSONB)                        │
│  - bible_audio_timing (timing_data JSONB)                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Frontend Display                               │
│  - LocalAudioPlayerWithSyncedLyrics.tsx                     │
│  - BibleAudioSync.tsx                                       │
│  - Word highlighting + Karaoke effect                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 ساختار فایل‌ها (File Structure)

```
backend/
├── routes/
│   ├── audioSyncRoutes.js          # API endpoints for sync
│   └── worshipRoutes.js            # Updated with timing fields
├── migrations/
│   └── add_audio_timing_support.sql # Database migration
└── runMigration.js                 # Migration runner script

pages/
└── AdminSyncManagementPage.tsx     # Admin interface

components/
├── LocalAudioPlayerWithSyncedLyrics.tsx  # Worship display
└── BibleAudioSync.tsx              # Bible display
```

---

## 🔌 API Endpoints

### 1. پردازش سرود پرستشی
**Endpoint**: `POST /api/audio-sync/process-worship`  
**Authentication**: Required (SUPER_ADMIN, MANAGER)  
**Content-Type**: `multipart/form-data`

**Request Body**:
```javascript
{
  audio: File,              // Audio file (mp3, wav, etc.)
  finglishText: string,     // Romanized Persian text
  persianText: string,      // Persian script text
  worshipSongId: number     // Song ID from database
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "timing": [
      { "word": "khoda", "startTime": 0.5, "endTime": 1.2 },
      { "word": "ra", "startTime": 1.3, "endTime": 1.6 }
    ],
    "finglishText": "...",
    "persianText": "...",
    "worshipSongId": 123,
    "wordCount": 45
  }
}
```

---

### 2. پردازش کتاب مقدس
**Endpoint**: `POST /api/audio-sync/process-bible`  
**Authentication**: Required (SUPER_ADMIN, MANAGER)  
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "audioUrl": "https://samanabyar.online/audio/bible/GEN_1_fa.mp3",
  "bookName": "Genesis",
  "bookCode": "GEN",
  "chapter": 1,
  "translation": "fa",
  "verses": [
    { "verse": 1, "text": "در ابتدا خدا آسمان‌ها و زمین را آفرید" }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "chapter": 1,
    "verses": [
      {
        "verse_number": 1,
        "text": "در ابتدا خدا آسمان‌ها و زمین را آفرید",
        "start_time": 0.0,
        "end_time": 5.3,
        "word_segments": [
          { "word": "در", "start_time": 0.0, "end_time": 0.4 },
          { "word": "ابتدا", "start_time": 0.5, "end_time": 1.1 }
        ]
      }
    ]
  }
}
```

---

### 3. دریافت Timing سرود پرستشی
**Endpoint**: `GET /api/audio-sync/timing/worship/:id`  
**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "timing": [...],
    "updatedAt": "2025-01-08T12:34:56Z"
  }
}
```

---

### 4. دریافت Timing کتاب مقدس
**Endpoint**: `GET /api/audio-sync/timing/bible/:bookCode/:chapter/:translation`  
**Authentication**: Required

**Example**: `GET /api/audio-sync/timing/bible/GEN/1/fa`

---

## 🗄️ Database Schema

### Table: `worship_songs`
```sql
ALTER TABLE worship_songs 
ADD COLUMN IF NOT EXISTS timing_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS timing_updated_at TIMESTAMP DEFAULT NULL;
```

**Example Data**:
```json
{
  "id": 123,
  "title": { "fa": "ای یهوه", "en": "Ya Yahweh" },
  "lyrics": { "fa": "...", "en": "..." },
  "timing_data": [
    { "word": "Ya", "startTime": 0.5, "endTime": 0.8 },
    { "word": "Yahweh", "startTime": 0.9, "endTime": 1.5 }
  ],
  "timing_updated_at": "2025-01-08T12:00:00Z"
}
```

---

### Table: `bible_audio_timing`
```sql
CREATE TABLE IF NOT EXISTS bible_audio_timing (
  id SERIAL PRIMARY KEY,
  book_code VARCHAR(10) NOT NULL,      -- 'GEN', 'EXO', etc.
  chapter INTEGER NOT NULL,
  translation VARCHAR(50) NOT NULL,    -- 'fa', 'en', 'mojdeh', etc.
  timing_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_code, chapter, translation)
);
```

**Example Data**:
```json
{
  "id": 1,
  "book_code": "GEN",
  "chapter": 1,
  "translation": "fa",
  "timing_data": {
    "chapter": 1,
    "verses": [
      {
        "verse_number": 1,
        "text": "در ابتدا خدا آسمان‌ها و زمین را آفرید",
        "start_time": 0.0,
        "end_time": 5.3,
        "word_segments": [...]
      }
    ]
  }
}
```

---

## 🎨 رابط کاربری ادمین (Admin UI)

### صفحه: `/admin/sync-management`

**ویژگی‌ها**:
- ✅ دو تب: سرودهای پرستشی و کتاب مقدس
- ✅ لیست همه سرودها با وضعیت همگام‌سازی
- ✅ دکمه آپلود سرود جدید
- ✅ پردازش دسته‌ای (Batch Processing)
- ✅ نمایش Progress Bar در حین پردازش
- ✅ نشان‌گذاری وضعیت: ✅ موفق | ❌ خطا | ⏳ در حال پردازش
- ✅ تاریخ آخرین همگام‌سازی
- ✅ گزینه پردازش مجدد

**دسترسی**: فقط `SUPER_ADMIN` و `MANAGER`

---

## 🚀 نحوه استفاده (Usage Guide)

### برای سرودهای پرستشی:

#### 1. آپلود سرود جدید
```typescript
// از صفحه Admin Sync Management
1. کلیک روی "آپلود سرود جدید"
2. انتخاب فایل صوتی
3. وارد کردن عنوان فارسی و انگلیسی
4. وارد کردن متن Finglish و فارسی
5. انتخاب "پردازش خودکار پس از آپلود"
6. کلیک روی "آپلود و پردازش"
```

#### 2. پردازش مجدد سرود موجود
```typescript
// از لیست سرودها
1. پیدا کردن سرود مورد نظر
2. کلیک روی دکمه "🔄" در ستون عملیات
3. صبر کردن تا پردازش کامل شود
4. مشاهده نتیجه: ✅ (موفق) یا ❌ (خطا)
```

#### 3. پردازش دسته‌ای
```typescript
// پردازش چندین سرود همزمان
1. انتخاب سرودهای مورد نظر با checkbox
2. کلیک روی "پردازش دسته‌ای (N)"
3. منتظر ماندن تا همه پردازش شوند
```

---

### برای کتاب مقدس:

```typescript
// این بخش به زودی فعال می‌شود
1. تب "کتاب مقدس صوتی" را انتخاب کنید
2. از لیست، کتاب و فصل مورد نظر را انتخاب کنید
3. کلیک روی "پردازش" - سیستم به طور خودکار:
   - فایل صوتی را از URL دریافت می‌کند
   - متن آیات را از دیتابیس می‌خواند
   - Timing را با AI ایجاد می‌کند
   - نتیجه را در دیتابیس ذخیره می‌کند
```

---

## 🧪 تست و عیب‌یابی (Testing & Debugging)

### چک کردن وضعیت Migration:
```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'worship_songs' 
  AND column_name IN ('timing_data', 'timing_updated_at');

-- Check Bible timing table
SELECT COUNT(*) FROM bible_audio_timing;
```

### تست API با cURL:
```bash
# Test worship song processing
curl -X POST http://localhost:3001/api/audio-sync/process-worship \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "audio=@song.mp3" \
  -F "finglishText=Ya Yahweh..." \
  -F "persianText=ای یهوه..." \
  -F "worshipSongId=123"

# Test Bible processing
curl -X POST http://localhost:3001/api/audio-sync/process-bible \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "audioUrl": "https://samanabyar.online/audio/bible/GEN_1_fa.mp3",
    "bookCode": "GEN",
    "bookName": "Genesis",
    "chapter": 1,
    "translation": "fa",
    "verses": [...]
  }'
```

### لاگ‌های Backend:
```javascript
// روشن کردن debug logs
console.log('🎵 Processing worship song ID:', worshipSongId);
console.log('✅ Audio loaded:', audioSize);
console.log('🤖 Generating word-level timestamps...');
console.log(`✅ Generated ${timingData.length} word timestamps`);
```

---

## ⚡ عملکرد و بهینه‌سازی (Performance)

### زمان پردازش:
- **سرود پرستشی (3-5 دقیقه)**: ~30-60 ثانیه
- **فصل کتاب مقدس (5-10 دقیقه)**: ~60-120 ثانیه

### محدودیت‌ها:
- حداکثر حجم فایل: 50 MB
- حداکثر طول صوت: 15 دقیقه (محدودیت Gemini)
- Rate limit: 60 request/minute (Gemini API)

### Fallback Strategy:
```javascript
// اگر Gemini خطا داد، از timing تقریبی استفاده می‌شود
function generateFallbackTiming(text) {
  const words = text.split(/\s+/);
  const SECONDS_PER_WORD = 0.5;
  
  return words.map((word, index) => ({
    word: word,
    startTime: index * SECONDS_PER_WORD,
    endTime: (index + 1) * SECONDS_PER_WORD
  }));
}
```

---

## 🔐 امنیت (Security)

### Authentication & Authorization:
- ✅ JWT Token Required
- ✅ Role-based Access: `SUPER_ADMIN`, `MANAGER` only
- ✅ File Type Validation (audio only)
- ✅ File Size Limit (50 MB)
- ✅ SQL Injection Protection (Parameterized Queries)

### Environment Variables:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://...
```

---

## 📊 Monitoring & Analytics

### Metrics to Track:
- تعداد سرودهای پردازش شده
- میانگین زمان پردازش
- نرخ موفقیت/شکست
- استفاده از API Gemini (Quota)

### Logging:
```javascript
// Success
console.log(`✅ Saved timing to database for song ID: ${worshipSongId}`);

// Error
console.error('❌ Error processing worship song:', error.message);

// Warning
console.warn('⚠️ Failed to save to database:', dbError.message);
```

---

## 🛠️ Troubleshooting

### خطاهای رایج:

#### 1. "GEMINI_API_KEY not configured"
**راه حل**: مطمئن شوید `.env` فایل API Key دارد:
```bash
GEMINI_API_KEY=AIza...
```

#### 2. "Failed to fetch audio"
**راه حل**: چک کنید URL صحیح باشد و فایل موجود باشد

#### 3. "JSON Parse Error"
**راه حل**: Gemini گاهی markdown برمی‌گرداند. سیستم خودکار cleanup می‌کند

#### 4. Database Connection Error
**راه حل**: مطمئن شوید `DATABASE_URL` صحیح است و migration اجرا شده

---

## 📝 TODO و بهبودها (Future Improvements)

- [ ] پشتیبانی از چند زبان بیشتر
- [ ] پردازش موازی برای بهبود سرعت
- [ ] کش کردن نتایج Gemini
- [ ] نمایش پیش‌نمایش قبل از ذخیره
- [ ] ویرایش دستی Timing
- [ ] Export به فرمت SRT/VTT
- [ ] تبدیل خودکار به ویدیو با Lyrics
- [ ] تشخیص خودکار زبان

---

## 📞 پشتیبانی (Support)

اگر مشکلی با سیستم دارید:
1. لاگ‌های Backend را چک کنید
2. Console Browser را بررسی کنید
3. از Testing Section بالا استفاده کنید
4. با تیم توسعه تماس بگیرید

---

## ✅ Status

| Feature | Status | Notes |
|---------|--------|-------|
| Worship Songs Processing | ✅ Complete | Fully functional |
| Admin UI for Worship | ✅ Complete | With batch processing |
| Database Migration | ✅ Complete | Tables created |
| Bible Processing API | ✅ Complete | Backend ready |
| Bible Admin UI | ⏳ Pending | Coming soon |
| Frontend Display | ✅ Complete | Word highlighting working |

---

**آخرین به‌روزرسانی**: 2025-01-08  
**نسخه**: 1.0.0  
**توسط**: AI Coding Agent
