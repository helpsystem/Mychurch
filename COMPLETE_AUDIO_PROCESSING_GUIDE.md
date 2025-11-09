# 🎵 سیستم جامع پردازش فایل‌های صوتی
## راهنمای کامل استفاده از سیستم پردازش خودکار با هوش مصنوعی

---

## 📋 امکانات سیستم

### 🎵 سرودهای پرستشی (Worship Songs)
سیستم به طور خودکار موارد زیر را انجام می‌دهد:

1. **استخراج متن سرود**
   - متن فارسی و انگلیسی سرود را از database می‌خواند
   - در صورت نیاز، می‌تواند از AI برای استخراج متن استفاده کند

2. **همگام‌سازی متن با صدا (Word-by-Word Timing)**
   - هر کلمه با زمان دقیق شروع و پایان
   - قابل استفاده برای highlighting real-time
   - دقت بالا با استفاده از Gemini 2.0 Flash AI

3. **استخراج آکوردها (Chords)**
   - تشخیص خودکار آکوردها از صدا
   - زمان هر تغییر آکورد
   - ذخیره در فرمت JSONB برای انعطاف بالا

4. **تشخیص ساختار سرود (Song Structure)**
   - Intro (مقدمه)
   - Verse (بند)
   - Chorus (همخوان)
   - Bridge (پل ارتباطی)
   - Outro (پایان)
   - زمان شروع و پایان هر بخش

5. **تولید PowerPoint** (Coming Soon)
   - فایل پاورپوینت با متن سرود
   - همگام با صدا
   - قابل استفاده برای پروژکتور کلیسا

### 📖 کتاب مقدس صوتی (Bible Audio)

1. **استخراج متن آیات**
   - خواندن متن تمام آیات هر فصل از database
   - پشتیبانی از چند ترجمه (فارسی، انگلیسی)

2. **همگام‌سازی آیه به آیه**
   - زمان شروع و پایان هر آیه
   - word-by-word timing برای هر کلمه
   - قابل استفاده برای نمایش همزمان متن و صدا

---

## 🔧 نحوه استفاده

### روش 1: استفاده از Admin Panel (توصیه می‌شود)

1. **ورود به پنل ادمین**
   ```
   https://samanabyar.online/#/admin/sync-management
   ```
   - Username: `help.system@ymail.com`
   - Password: `Samyar@1989`

2. **پردازش دسته‌ای سرودها**
   - برو به تب "Worship Songs"
   - انتخاب سرودهایی که میخوای پردازش بشن (checkbox)
   - کلیک روی "Process Selected Songs"
   - منتظر بمون تا پردازش تمام بشه (progress bar)

3. **پردازش فصل‌های کتاب مقدس**
   - برو به تب "Bible Chapters"
   - انتخاب فصل‌هایی که میخوای
   - کلیک روی "Process Selected Chapters"
   - منتظر بمون تا پردازش تمام بشه

### روش 2: استفاده مستقیم از API

#### پردازش دسته‌ای سرودها

```bash
POST /api/audio-sync/process-batch-worship
Content-Type: application/json
Authorization: Bearer <your_jwt_token>

{
  "songIds": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "success": true,
  "processed": 5,
  "failed": 0,
  "results": [
    {
      "songId": 1,
      "success": true,
      "timing": 245,
      "chords": 32,
      "hasStructure": true
    }
  ],
  "errors": []
}
```

#### پردازش دسته‌ای فصل‌های کتاب مقدس

```bash
POST /api/audio-sync/process-batch-bible
Content-Type: application/json
Authorization: Bearer <your_jwt_token>

{
  "chapters": [
    {
      "book": "GEN",
      "chapter": 1,
      "translation": "mojdeh",
      "audioUrl": "https://samanabyar.online/audio/bible/GEN_1_fa.mp3"
    },
    {
      "book": "GEN",
      "chapter": 2,
      "translation": "mojdeh",
      "audioUrl": "https://samanabyar.online/audio/bible/GEN_2_fa.mp3"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "processed": 2,
  "failed": 0,
  "results": [
    {
      "book": "GEN",
      "chapter": 1,
      "translation": "mojdeh",
      "success": true,
      "verses": 31
    }
  ],
  "errors": []
}
```

---

## 📊 ساختار داده‌های ذخیره شده

### جدول `worship_songs`

```sql
worship_songs (
  id INTEGER PRIMARY KEY,
  title JSONB,                    -- {"fa": "نام فارسی", "en": "English Name"}
  lyrics JSONB,                   -- {"fa": "متن فارسی", "en": "English lyrics"}
  audiourl TEXT,                  -- آدرس فایل صوتی
  
  -- 🆕 فیلدهای جدید
  has_timing BOOLEAN,             -- آیا timing دارد؟
  timing_data JSONB,              -- آرایه timing هر کلمه
  timing_updated_at TIMESTAMP,    -- آخرین بار که timing به‌روز شد
  structure JSONB,                -- ساختار سرود (intro, verse, chorus, ...)
  chords JSONB                    -- آکوردها با زمان
)
```

**نمونه `timing_data`:**
```json
[
  {
    "word": "خدایا",
    "startTime": 0.5,
    "endTime": 1.2
  },
  {
    "word": "تو",
    "startTime": 1.3,
    "endTime": 1.6
  }
]
```

**نمونه `chords`:**
```json
[
  {
    "time": 0.0,
    "chord": "C"
  },
  {
    "time": 4.5,
    "chord": "G"
  },
  {
    "time": 8.2,
    "chord": "Am"
  }
]
```

**نمونه `structure`:**
```json
{
  "intro": {
    "start": 0,
    "end": 5
  },
  "verse1": {
    "start": 5,
    "end": 20
  },
  "chorus": {
    "start": 20,
    "end": 35
  },
  "verse2": {
    "start": 35,
    "end": 50
  },
  "bridge": {
    "start": 50,
    "end": 65
  },
  "outro": {
    "start": 65,
    "end": 75
  }
}
```

### جدول `bible_audio_timing`

```sql
bible_audio_timing (
  id SERIAL PRIMARY KEY,
  book VARCHAR(10),               -- کد کتاب (GEN, EXO, MAT, ...)
  chapter INTEGER,                -- شماره فصل
  translation VARCHAR(50),        -- ترجمه (mojdeh, qadim, tafsiri_ot, ...)
  audio_url TEXT,                 -- آدرس فایل صوتی
  timing_data JSONB,              -- داده‌های timing
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(book, chapter, translation)
)
```

**نمونه `timing_data`:**
```json
{
  "verses": [
    {
      "verse": 1,
      "start": 0.0,
      "end": 5.2,
      "words": [
        {
          "word": "در",
          "start": 0.0,
          "end": 0.2
        },
        {
          "word": "آغاز",
          "start": 0.2,
          "end": 0.8
        }
      ]
    }
  ]
}
```

---

## 🤖 فناوری استفاده شده

### Google Gemini 2.0 Flash AI
- **مدل**: `gemini-2.0-flash-exp`
- **قابلیت‌ها**:
  - تحلیل فایل‌های صوتی
  - تشخیص کلمات و زمان آن‌ها
  - استخراج آکوردها
  - تشخیص ساختار موسیقی
  
### Fallback System
اگر AI موفق به پردازش نشد، سیستم به صورت خودکار از الگوریتم fallback استفاده می‌کند که timing تقریبی تولید می‌کند.

---

## 📈 نمونه استفاده در Frontend

### نمایش سرود با Highlighting

```tsx
import LocalAudioPlayerWithSyncedLyrics from '@/components/LocalAudioPlayerWithSyncedLyrics';

<LocalAudioPlayerWithSyncedLyrics
  audioUrl={song.audioUrl}
  lyrics={song.lyrics.fa}
  timingData={song.timing_data}
  lang="fa"
  title={song.title.fa}
/>
```

### نمایش آکوردها

```tsx
const Chords: React.FC<{ chords: any[] }> = ({ chords }) => {
  const [currentTime, setCurrentTime] = useState(0);
  
  const currentChord = chords.find((chord, index) => {
    const nextChord = chords[index + 1];
    return currentTime >= chord.time && 
           (!nextChord || currentTime < nextChord.time);
  });
  
  return (
    <div className="chord-display">
      <h3>Chord: {currentChord?.chord || '-'}</h3>
    </div>
  );
};
```

### نمایش کتاب مقدس با Timing

```tsx
<BibleChapterWithTiming
  book="GEN"
  chapter={1}
  translation="mojdeh"
  audioUrl="/audio/bible/GEN_1_fa.mp3"
/>
```

---

## 🔐 امنیت

- **Authentication**: تمام APIها نیاز به JWT token دارند
- **Authorization**: فقط `SUPER_ADMIN` و `MANAGER` می‌توانند پردازش کنند
- **File Size Limit**: حداکثر 50MB برای هر فایل صوتی
- **File Type Validation**: فقط فایل‌های صوتی (audio/*)

---

## 🚀 To-Do List

- [ ] ✅ پردازش تمام سرودهای موجود
- [ ] ✅ پردازش تمام فصل‌های کتاب مقدس با صدا
- [ ] 🔄 تولید خودکار PowerPoint برای سرودها
- [ ] 🔄 بهبود دقت استخراج آکوردها
- [ ] 🔄 اضافه کردن امکان ویرایش دستی timing
- [ ] 🔄 Export به فرمت‌های مختلف (SRT, LRC, JSON)

---

## 📞 پشتیبانی

اگر مشکلی داشتید:
1. چک کنید که backend در حال اجراست: `pm2 status`
2. لاگ‌ها را بررسی کنید: `pm2 logs mychurch-backend`
3. مطمئن شوید GEMINI_API_KEY در `.env` تنظیم شده است

---

**تاریخ به‌روزرسانی**: 9 نوامبر 2025
**نسخه**: 1.0.0
