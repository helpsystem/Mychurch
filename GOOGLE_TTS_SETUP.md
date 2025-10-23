# 🎙️ راهنمای نصب و استفاده از Google Cloud Text-to-Speech

## 📋 فهرست مطالب
1. [دریافت API Key](#دریافت-api-key)
2. [تنظیمات Backend](#تنظیمات-backend)
3. [نصب Dependencies](#نصب-dependencies)
4. [راه‌اندازی Service](#راه‌اندازی-service)
5. [استفاده در React](#استفاده-در-react)
6. [تست API](#تست-api)
7. [عیب‌یابی](#عیب‌یابی)

---

## 🔑 دریافت API Key

### مرحله 1: ساخت پروژه در Google Cloud

1. برو به: https://console.cloud.google.com
2. کلیک روی **Create Project** یا انتخاب پروژه موجود
3. نام پروژه را وارد کن (مثلاً: `Bible-TTS`)
4. کلیک روی **Create**

### مرحله 2: فعال‌سازی Text-to-Speech API

1. برو به: https://console.cloud.google.com/apis/library
2. جستجو کن: `Cloud Text-to-Speech API`
3. کلیک روی API
4. کلیک روی **Enable**

### مرحله 3: ساخت API Key

1. برو به: https://console.cloud.google.com/apis/credentials
2. کلیک روی **+ CREATE CREDENTIALS**
3. انتخاب کن: **API Key**
4. API Key ساخته می‌شود (مثلاً: `AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
5. کپی کن و در جای امن نگهداری کن

### مرحله 4: محدودسازی API Key (توصیه می‌شود)

1. کلیک روی API Key که ساخته شد
2. در بخش **API restrictions**:
   - انتخاب کن: **Restrict key**
   - انتخاب کن: **Cloud Text-to-Speech API**
3. در بخش **Application restrictions** (اختیاری):
   - می‌تونی دامنه خودت رو محدود کنی
4. کلیک روی **Save**

---

## ⚙️ تنظیمات Backend

### 1. اضافه کردن API Key به .env

```bash
cd backend
nano .env
```

اضافه کن:
```env
# Google Cloud Text-to-Speech
GOOGLE_TTS_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. اضافه کردن route به server.js

باز کن: `backend/server.js` یا `backend/dev-server.js`

اضافه کن:
```javascript
const googleTTSRoutes = require('./routes/googleTTS');

// Routes
app.use('/api/google-tts', googleTTSRoutes);
```

---

## 📦 نصب Dependencies

### 1. Dependencies اصلی

```bash
cd backend
npm install axios
```

بررسی کن که `axios` در `package.json` باشه.

### 2. ساخت دایرکتوری Cache

```bash
mkdir -p backend/cache/audio
```

یا اجازه بده که به‌صورت خودکار ساخته بشه.

---

## 🚀 راه‌اندازی Service

### 1. تست Service

```bash
cd backend
node services/googleTTS.js
```

خروجی باید شبیه این باشه:
```
=== Google Cloud TTS Test ===

📝 Testing Persian synthesis...
🎙️ Synthesizing speech (fa): در ابتدا خدا آسمان و زمین را آفرید...
✅ Speech synthesized successfully
   - Audio size: 15234 bytes (base64)
   - Word timings: 8 words
✅ Persian synthesis successful
   Words: 8
   First 3 word timings: [
     { word: 'در', startTime: 0, endTime: 200, duration: 200 },
     ...
   ]

📝 Testing English synthesis...
✅ English synthesis successful
   Words: 12

📊 Cache statistics: { totalFiles: 2, languages: { fa: 1, en: 1 }, totalSizeKB: 45 }
```

### 2. راه‌اندازی Server

```bash
npm run dev:full
```

یا:
```bash
cd backend
npm run dev
```

### 3. بررسی API

```bash
# تست ساده
curl "http://localhost:3001/api/google-tts/test?text=سلام دنیا&language=fa"
```

---

## ⚛️ استفاده در React

### 1. استفاده از کامپوننت Google TTS

#### مثال 1: کامپوننت پایه

```tsx
import BibleFlipbookGoogleTTS from '../components/BibleFlipbookGoogleTTS';

function MyPage() {
  const verses = [
    {
      id: 1,
      verseNumber: 1,
      textEn: "In the beginning God created the heaven and the earth.",
      textFa: "در ابتدا خدا آسمان و زمین را آفرید."
    },
    // ...
  ];

  return (
    <BibleFlipbookGoogleTTS
      bookCode="GEN"
      bookNameEn="Genesis"
      bookNameFa="پیدایش"
      chapterNumber={1}
      verses={verses}
    />
  );
}
```

#### مثال 2: با صفحه کامل

```tsx
import { useState, useEffect } from 'react';
import BibleFlipbookGoogleTTS from '../components/BibleFlipbookGoogleTTS';

function BiblePage() {
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch verses from API
    fetch('/api/bible/content/GEN/1')
      .then(res => res.json())
      .then(data => {
        setVerses(data.versesData);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <BibleFlipbookGoogleTTS
      bookCode="GEN"
      bookNameEn="Genesis"
      bookNameFa="پیدایش"
      chapterNumber={1}
      verses={verses}
    />
  );
}
```

### 2. اضافه کردن Route

در `App.tsx`:

```tsx
import BibleFlipbookGoogleTTS from './components/BibleFlipbookGoogleTTS';

// در Routes:
<Route path="/bible-tts/:bookCode/:chapter" element={<BibleFlipbookGoogleTTS />} />
```

---

## 🧪 تست API

### 1. تست Synthesis ساده

```bash
curl -X POST http://localhost:3001/api/google-tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "در ابتدا خدا آسمان و زمین را آفرید",
    "language": "fa"
  }'
```

Response:
```json
{
  "success": true,
  "audio": "//NExAAR...", // base64 audio
  "wordTimings": [
    {
      "word": "در",
      "startTime": 0,
      "endTime": 200,
      "duration": 200,
      "markName": "word_0"
    },
    ...
  ],
  "language": "fa",
  "metadata": {
    "textLength": 42,
    "wordCount": 8,
    "totalDuration": 3500,
    "timestamp": "2025-10-23T12:34:56.789Z"
  }
}
```

### 2. تست Verse Synthesis

```bash
curl -X POST http://localhost:3001/api/google-tts/synthesize-verse \
  -H "Content-Type: application/json" \
  -d '{
    "textEn": "In the beginning God created the heaven and the earth.",
    "textFa": "در ابتدا خدا آسمان و زمین را آفرید.",
    "verseNumber": 1,
    "bookCode": "GEN",
    "chapter": 1
  }'
```

### 3. بررسی Cache

```bash
curl http://localhost:3001/api/google-tts/cache-stats
```

Response:
```json
{
  "success": true,
  "cache": {
    "totalFiles": 10,
    "languages": {
      "fa": 5,
      "en": 5
    },
    "totalSizeKB": 234,
    "cacheDir": "/path/to/backend/cache/audio"
  }
}
```

### 4. پاک کردن Cache

```bash
curl -X DELETE http://localhost:3001/api/google-tts/clear-cache
```

---

## 🐛 عیب‌یابی

### مشکل 1: API Key کار نمی‌کند

**علائم:**
```
❌ Google TTS API Error: API key not valid
```

**راه حل:**
1. بررسی کن API Key صحیح است:
```bash
echo $GOOGLE_TTS_API_KEY
```

2. بررسی کن API فعال است:
   - برو به: https://console.cloud.google.com/apis/library
   - جستجو: `Cloud Text-to-Speech API`
   - باید `Enabled` باشه

3. بررسی کن محدودیت‌های API Key:
   - برو به: https://console.cloud.google.com/apis/credentials
   - API Key رو باز کن
   - بررسی کن `Cloud Text-to-Speech API` در لیست مجازها باشه

### مشکل 2: صدای فارسی تولید نمی‌شود

**علائم:**
```
❌ TTS synthesis failed: Voice not found
```

**راه حل:**
1. بررسی کن `modelName` درست است:
```javascript
// در googleTTS.js
fa: {
  languageCode: 'fa-IR',
  modelName: 'gemini-2.5-flash-tts', // باید دقیقاً همین باشه
  name: 'Achernar'
}
```

2. لیست صداهای موجود:
```bash
curl "https://texttospeech.googleapis.com/v1beta1/voices?key=YOUR_API_KEY" | jq
```

3. اگر Gemini TTS در دسترس نیست، از صدای استاندارد استفاده کن:
```javascript
fa: {
  languageCode: 'fa-IR',
  name: 'fa-IR-Standard-A',
  ssmlGender: 'FEMALE'
}
```

### مشکل 3: Word Timings نادرست است

**علائم:**
- کلمات همزمان با صدا هایلایت نمی‌شوند
- زمان‌بندی جا افتاده است

**راه حل:**
1. بررسی کن `enableTimePointing` فعال است:
```javascript
const requestBody = {
  // ...
  enableTimePointing: ['WORD'] // باید حتماً باشه
};
```

2. لاگ کن timepoints دریافتی:
```javascript
console.log('Timepoints:', result.timepoints);
```

3. اگر timepoints خالی است، fallback فعال می‌شه:
```javascript
// Fallback: تخمین زمان‌بندی
estimateWordTimings(text) {
  const avgWordDuration = 400; // تنظیم کن
  // ...
}
```

### مشکل 4: Cache بزرگ شده

**علائم:**
```
📊 Cache statistics: { totalSizeKB: 5000, ... }
```

**راه حل:**
```bash
# پاک کردن cache
curl -X DELETE http://localhost:3001/api/google-tts/clear-cache

# یا به‌صورت دستی
rm -rf backend/cache/audio/*
```

### مشکل 5: Rate Limiting

**علائم:**
```
❌ Google TTS API Error: 429 Too Many Requests
```

**راه حل:**
1. کاهش تعداد درخواست‌ها:
```javascript
// در synthesizeChapter
await new Promise(resolve => setTimeout(resolve, 200)); // افزایش به 200ms
```

2. استفاده از cache بیشتر
3. خرید Quota بیشتر از Google Cloud

### مشکل 6: Audio پخش نمی‌شود

**علائم:**
- دکمه play کار نمی‌کند
- خطای `Audio playback error`

**راه حل:**
1. بررسی console:
```javascript
audio.onerror = (e) => {
  console.error('Audio error:', e);
  console.error('Audio src:', audio.src);
};
```

2. بررسی base64 معتبر است:
```javascript
// تست
const audioBlob = base64ToBlob(audioContent, 'audio/mp3');
console.log('Blob size:', audioBlob.size);
```

3. تست مستقیم audio:
```javascript
const audio = new Audio('data:audio/mp3;base64,' + audioContent);
audio.play();
```

---

## 📊 مقایسه صداها

| ویژگی | Web Speech API | Google Cloud TTS (Standard) | Google Cloud TTS (Gemini) |
|-------|----------------|----------------------------|---------------------------|
| **کیفیت فارسی** | ⭐⭐ (معمولی) | ⭐⭐⭐ (خوب) | ⭐⭐⭐⭐⭐ (عالی) |
| **کیفیت انگلیسی** | ⭐⭐⭐ (خوب) | ⭐⭐⭐⭐ (خیلی خوب) | ⭐⭐⭐⭐⭐ (عالی) |
| **Word Timings** | ❌ نامشخص | ✅ دقیق | ✅ خیلی دقیق |
| **سرعت** | ⚡ آنی | 🐢 کند (API call) | 🐢 کند (API call) |
| **هزینه** | 🆓 رایگان | 💰 $4 per 1M chars | 💰 $16 per 1M chars |
| **Offline** | ✅ بله | ❌ خیر | ❌ خیر |
| **Cache** | ❌ خیر | ✅ بله | ✅ بله |
| **Browser Support** | ✅ همه | ✅ همه | ✅ همه |

---

## 💰 قیمت‌گذاری Google Cloud TTS

### Standard Voices
- اولین 1 میلیون کاراکتر/ماه: **رایگان**
- بعد از آن: **$4 per 1M characters**

### WaveNet Voices (کیفیت بالا)
- اولین 1 میلیون کاراکتر/ماه: **رایگان**
- بعد از آن: **$16 per 1M characters**

### Gemini Flash TTS (جدید - طبیعی‌ترین)
- قیمت: حدود **$16 per 1M characters**
- کیفیت: بهترین صدای موجود

### محاسبه هزینه

برای کتاب مقدس (حدود 4 میلیون کاراکتر):
- **Standard:** $16 یکبار (بعد cache می‌شه)
- **Gemini:** $64 یکبار (بعد cache می‌شه)

**توصیه:** با استفاده از cache، هزینه فقط یکبار است.

---

## 🎯 بهینه‌سازی

### 1. استفاده بهینه از Cache

```javascript
// Pre-generate audio for entire Bible
async function pregenerateAllAudio() {
  const books = await loadBooksFromDB();
  
  for (const book of books) {
    for (let chapter = 1; chapter <= book.total_chapters; chapter++) {
      const verses = await loadChapterVerses(book.code, chapter);
      await googleTTSService.synthesizeChapter(verses);
    }
  }
  
  console.log('✅ All audio pre-generated');
}
```

### 2. Lazy Loading

```javascript
// فقط وقتی کاربر می‌خواد بخونه، audio رو بارگذاری کن
const loadVerseAudio = useCallback(async (verse) => {
  if (audioCache.has(verse.id)) return audioCache.get(verse.id);
  
  const audio = await fetchAudio(verse);
  setAudioCache(prev => new Map(prev).set(verse.id, audio));
  return audio;
}, [audioCache]);
```

### 3. Compression

```javascript
// استفاده از MP3 به جای LINEAR16 (کوچک‌تر)
audioConfig: {
  audioEncoding: 'MP3', // به جای LINEAR16
  pitch: 0,
  speakingRate: 0.9
}
```

---

## ✅ Checklist راه‌اندازی

- [ ] پروژه Google Cloud ساخته شده
- [ ] Text-to-Speech API فعال شده
- [ ] API Key دریافت شده
- [ ] API Key در .env اضافه شده
- [ ] axios نصب شده
- [ ] دایرکتوری cache ساخته شده
- [ ] Service تست شده (`node services/googleTTS.js`)
- [ ] Route به server.js اضافه شده
- [ ] API تست شده (`/api/google-tts/test`)
- [ ] کامپوننت React تست شده
- [ ] Audio پخش می‌شود
- [ ] Word highlighting کار می‌کند
- [ ] Cache عملکرد صحیح دارد

---

## 🎉 نتیجه

با این سیستم شما:
- ✅ صدای طبیعی فارسی و انگلیسی دارید
- ✅ هایلایت دقیق کلمه به کلمه
- ✅ Cache برای عملکرد سریع
- ✅ Bilingual با صدای همزمان
- ✅ ادغام کامل با 3D Flipbook

**موفق باشید! 🚀**
