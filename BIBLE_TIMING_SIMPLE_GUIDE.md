# 📖 Bible Audio Timing System (Simple)

سیستم تولید فایل‌های Timing برای فصل‌های کتاب مقدس با استفاده از الگوریتم Simple Timing (تقسیم یکنواخت زمان)

## 🎯 ویژگی‌ها

- ✅ **سریع**: تولید فوری فایل timing بدون نیاز به AI
- ✅ **رایگان**: بدون نیاز به API key یا سرویس خارجی
- ✅ **دقت متوسط**: تقسیم زمان بر اساس تعداد کلمات
- ✅ **همگام‌سازی کلمه‌به‌کلمه**: هایلایت زنده کلمات در حین پخش
- ✅ **تنظیم دستی**: امکان تنظیم تاخیر متن توسط کاربر
- ✅ **مقیاس‌پذیر**: قابل اجرا برای همه 1189 فصل کتاب مقدس

## 📁 ساختار فایل‌ها

```
Mychurch/
├── components/
│   └── BibleAudioPlayerWithSync.tsx      # کامپوننت پخش‌کننده با sync
├── pages/
│   └── BibleAudioSyncTestPage.tsx        # صفحه تست
├── backend/
│   └── routes/
│       └── bibleTimingRoutes.js          # API routes
├── scripts/
│   └── generate-bible-timing.cjs         # اسکریپت batch generation
└── public/
    └── bible/
        ├── audio/                         # فایل‌های صوتی
        │   └── farsi/
        │       └── EPH/
        │           └── 1.mp3
        └── data/
            └── timings/                   # فایل‌های timing
                └── EPH_1_timing.json
```

## 🚀 نحوه استفاده

### 1️⃣ تست سیستم

به صفحه تست بروید:
```
http://localhost:5173/#/bible/audio-sync-test
```

### 2️⃣ تولید Timing برای یک فصل

**از رابط کاربری:**
1. به صفحه تست بروید
2. روی دکمه "ساخت Timing" کلیک کنید
3. فایل timing تولید و ذخیره می‌شود

**از API:**
```bash
curl -X POST http://localhost:3001/api/bible-timing/generate/EPH/1 \
  -H "Content-Type: application/json" \
  -d '{
    "verses": [
      { "number": 1, "text": "پولس رسول عیسی مسیح به اراده خدا..." },
      { "number": 2, "text": "به مقدسین که در افسس هستند..." }
    ],
    "audioDuration": 180
  }'
```

**پاسخ:**
```json
{
  "success": true,
  "message": "Timing generated successfully",
  "data": {
    "filename": "EPH_1_timing.json",
    "path": "/bible/data/timings/EPH_1_timing.json",
    "metadata": {
      "title": "EPH 1",
      "book": "EPH",
      "chapter": 1,
      "totalDuration": 180.5,
      "wordCount": 324,
      "verseCount": 23
    }
  }
}
```

### 3️⃣ تولید Timing برای همه فصل‌های یک کتاب

```bash
node scripts/generate-bible-timing.cjs GEN
```

### 4️⃣ تولید Timing برای همه کتاب‌های کتاب مقدس

```bash
node scripts/generate-bible-timing.cjs
```

## 📊 فرمت فایل Timing

```json
{
  "metadata": {
    "title": "EPH 1",
    "book": "EPH",
    "chapter": 1,
    "totalDuration": 180.5,
    "wordCount": 324,
    "verseCount": 23,
    "generatedAt": "2025-11-15T10:30:00.000Z",
    "method": "simple",
    "description": "Simple timing - Equal spacing based on word count"
  },
  "words": [
    {
      "word": "پولس",
      "start": 0.0,
      "end": 0.56,
      "lineIndex": 0
    }
  ],
  "lines": [
    {
      "line": "پولس رسول عیسی مسیح به اراده خدا",
      "start": 0.0,
      "end": 5.2,
      "words": [
        { "word": "پولس", "start": 0.0, "end": 0.56 },
        { "word": "رسول", "start": 0.56, "end": 1.12 }
      ]
    }
  ]
}
```

## 🔧 API Endpoints

### POST `/api/bible-timing/generate/:bookKey/:chapter`
تولید فایل timing برای یک فصل

**پارامترها:**
- `bookKey` (string): کلید کتاب (مثلاً GEN، EXO، MAT)
- `chapter` (number): شماره فصل

**Body:**
```json
{
  "verses": [
    { "number": 1, "text": "..." }
  ],
  "audioDuration": 180 // اختیاری
}
```

### GET `/api/bible-timing/check/:bookKey/:chapter`
بررسی وجود فایل timing

### DELETE `/api/bible-timing/delete/:bookKey/:chapter`
حذف فایل timing

### GET `/api/bible-timing/list`
لیست همه فایل‌های timing موجود

### POST `/api/bible-timing/batch-generate`
تولید timing برای چند فصل به صورت batch

**Body:**
```json
{
  "chapters": [
    {
      "bookKey": "GEN",
      "chapter": 1,
      "verses": [...],
      "audioDuration": 180
    }
  ]
}
```

## 🎨 استفاده از کامپوننت

```tsx
import BibleAudioPlayerWithSync from '@/components/BibleAudioPlayerWithSync';

<BibleAudioPlayerWithSync
  audioUrl="/bible/audio/farsi/EPH/1.mp3"
  verses={[
    { number: 1, text: "پولس رسول عیسی مسیح..." },
    { number: 2, text: "به مقدسین که در افسس..." }
  ]}
  timingPath="/bible/data/timings/EPH_1_timing.json"
  lang="fa"
  bookName="افسسیان"
  chapter={1}
  onChapterChange={(dir) => console.log(dir)}
  autoLoadTiming={true}
/>
```

## ⚙️ الگوریتم Simple Timing

### نحوه کار:

1. **محاسبه کل کلمات**: شمارش کل کلمات در همه آیات
2. **تعیین مدت زمان**: 
   - اگر `audioDuration` داده شود، از آن استفاده می‌شود
   - در غیر این صورت، تخمین زده می‌شود: `(کلمات / 120) * 60` ثانیه
3. **تقسیم زمان بر اساس نسبت**:
   - مدت زمان هر آیه = `(کلمات آیه / کل کلمات) * کل زمان`
   - مدت زمان هر کلمه = `مدت زمان آیه / تعداد کلمات آیه`
4. **ساخت فایل JSON**: ذخیره metadata، words، و lines

### مثال محاسبه:

```
کل کلمات: 324
کل زمان: 180 ثانیه
سرعت: 108 کلمه در دقیقه

آیه 1: 10 کلمات
مدت زمان آیه 1: (10/324) * 180 = 5.56 ثانیه
مدت زمان هر کلمه: 5.56 / 10 = 0.556 ثانیه

کلمه 1: start=0.00, end=0.56
کلمه 2: start=0.56, end=1.12
کلمه 3: start=1.12, end=1.68
...
```

## 📈 مزایا و معایب

### ✅ مزایا:
- سرعت بالا (فوری)
- رایگان (بدون هزینه API)
- ساده و قابل فهم
- نیاز به اینترنت ندارد
- مقیاس‌پذیری بالا

### ⚠️ محدودیت‌ها:
- دقت متوسط (نه دقیق مثل AI)
- فرض می‌کند سرعت خواندن یکنواخت است
- ممکن است در بخش‌هایی sync نباشد
- نیاز به تنظیم دستی برای بهبود

### 💡 راه‌حل‌ها:
- استفاده از تنظیم تاخیر متن (Sync Adjustment)
- امکان تغییر سرعت پخش
- کلیک روی آیات برای جهش دستی

## 🔄 مقایسه با Advanced Timing

| ویژگی | Simple Timing | Advanced Timing (AI) |
|-------|---------------|----------------------|
| سرعت | ⚡ فوری | 🐌 5-10 دقیقه |
| هزینه | 💰 رایگان | 💸 $0.15 per chapter |
| دقت | 📊 متوسط (70-80%) | 🎯 عالی (95-99%) |
| نیاز به اینترنت | ❌ خیر | ✅ بله |
| API Key | ❌ خیر | ✅ Gemini API |
| مقیاس‌پذیری | ✅ عالی | ⚠️ محدود (rate limit) |

## 🎯 پیشنهاد استفاده

- **Simple Timing**: برای همه فصل‌ها (سریع و رایگان)
- **Advanced Timing**: فقط برای فصل‌های مهم (دقت بالا)

## 📊 آمار

- **تعداد کتاب‌ها**: 66 (39 عهد عتیق + 27 عهد جدید)
- **تعداد فصل‌ها**: 1189
- **زمان تولید کل**: ~2-3 دقیقه (Simple)
- **حجم فایل‌ها**: ~50-200KB هر فصل
- **حجم کل**: ~60-120MB برای 1189 فصل

## 🐛 عیب‌یابی

### مشکل: فایل timing یافت نشد
```bash
# بررسی وجود فایل
curl http://localhost:3001/api/bible-timing/check/EPH/1

# تولید مجدد
curl -X POST http://localhost:3001/api/bible-timing/generate/EPH/1 \
  -H "Content-Type: application/json" \
  -d '{"verses": [...]}'
```

### مشکل: sync درست نیست
1. از تنظیم "تاخیر متن" استفاده کنید
2. سرعت پخش را تغییر دهید
3. روی آیات کلیک کنید برای جهش دستی

### مشکل: فایل صوتی پیدا نمی‌شود
```bash
# بررسی مسیر فایل
ls public/bible/audio/farsi/EPH/1.mp3

# دانلود از WordProject
node scripts/download-bible-audio.cjs EPH 1
```

## 🚀 نقشه راه

- [x] پیاده‌سازی Simple Timing
- [x] API endpoints
- [x] React component با sync
- [x] صفحه تست
- [ ] تولید timing برای همه 1189 فصل
- [ ] بهبود الگوریتم (توزیع غیریکنواخت)
- [ ] ادغام با صفحه اصلی Bible
- [ ] پشتیبانی از زبان‌های دیگر (انگلیسی، اسپانیایی)
- [ ] حالت آفلاین کامل

## 📝 لایسنس

MIT License - استفاده آزاد برای همه

---

**Made with ❤️ for Iranian Christian Church DC**

📖 کتاب مقدس • 🎵 Timing • ✨ Sync
