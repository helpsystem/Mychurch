# 🎤 وضعیت Text-to-Speech (TTS)

## ❓ سوال: آیا الان حالت روخوانی کتاب فارسی و انگلیسی نیز کار می‌کنه؟

## پاسخ کوتاه:
**⚠️ نیمه‌کاره است - UI آماده است اما Backend نیاز به تکمیل دارد**

---

## ✅ چه چیزی آماده است؟

### 1️⃣ Frontend Components (100% کامل)
- ✅ دکمه Play/Pause در همه حالت‌ها
- ✅ Hook `useTTS.ts` با تمام قابلیت‌های لازم
- ✅ Word-level highlighting آماده است
- ✅ Progress tracking
- ✅ Animation و UI effects

### 2️⃣ State Management (100% کامل)
```typescript
// hooks/useTTS.ts
- isPlaying ✅
- currentVerse ✅
- currentWordIndex ✅
- audioProgress ✅
- playVerse() ✅
- togglePlayPause() ✅
```

### 3️⃣ UI Integration (100% کامل)
- ✅ BibleSimple: Word highlighting با gradients
- ✅ BibleFlipbookUnified: Word highlighting
- ✅ Play/Pause button در Toolbar
- ✅ Play/Pause در Floating Menu

---

## ❌ چه چیزی کامل نیست؟

### 1️⃣ Backend API (0% - نیاز به Setup)

**فایل**: `backend/routes/bibleUnified.js` - خط 250-300

```typescript
// API Endpoint وجود دارد اما نیاز به Implementation دارد:
router.post('/tts', async (req, res) => {
  // TODO: Implement Google Cloud TTS
  // 1. دریافت متن و زبان
  // 2. فراخوانی Google Cloud TTS API
  // 3. دریافت Audio + Word Timings
  // 4. Return کردن به Frontend
});
```

**نیازمندی‌ها**:
- ❌ Google Cloud Service Account setup
- ❌ API Key configuration
- ❌ Audio generation implementation
- ❌ Word timing extraction

### 2️⃣ Google Cloud Setup (0%)

**چیزهایی که باید انجام شود**:

1. **ایجاد Google Cloud Project**
   - به https://console.cloud.google.com برو
   - پروژه جدید بساز
   - Text-to-Speech API را فعال کن

2. **ساخت Service Account**
   ```bash
   # در Google Cloud Console:
   IAM & Admin → Service Accounts → Create Service Account
   # نقش: Cloud Text-to-Speech Client
   # دانلود JSON key file
   ```

3. **تنظیم Environment Variables**
   ```env
   # backend/.env
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account.json
   ```

4. **نصب Google Cloud SDK**
   ```powershell
   npm install @google-cloud/text-to-speech
   ```

### 3️⃣ Implementation Code (0%)

**باید این کد را بنویسیم**:

```typescript
// backend/routes/bibleUnified.js

const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();

router.post('/tts', async (req, res) => {
  try {
    const { text, language } = req.body;
    
    // تنظیمات صدا بر اساس زبان
    const voiceConfig = language === 'fa' 
      ? {
          languageCode: 'fa-IR',
          name: 'fa-IR-Wavenet-D', // Female voice
          ssmlGender: 'FEMALE'
        }
      : {
          languageCode: 'en-US',
          name: 'en-US-Neural2-F', // Female voice
          ssmlGender: 'FEMALE'
        };

    // درخواست به Google Cloud TTS
    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: voiceConfig,
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.9, // کمی آهسته‌تر برای وضوح
        pitch: 0.0,
        volumeGainDb: 0.0,
        // فعال کردن Word Timings
        enableTimePointing: ['TIMEPOINT_TYPE_SSML_MARK']
      }
    });

    // استخراج Word Timings از response
    const timings = extractWordTimings(response.timepoints, text);

    // تبدیل audio به base64
    const audioBase64 = response.audioContent.toString('base64');
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

    res.json({
      success: true,
      audioUrl,
      timings,
      language
    });

  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// تابع کمکی برای استخراج Word Timings
function extractWordTimings(timepoints, text) {
  const words = text.split(/\s+/);
  return words.map((word, index) => ({
    word,
    index,
    startTime: timepoints[index]?.timeSeconds * 1000 || 0,
    endTime: timepoints[index + 1]?.timeSeconds * 1000 || 0,
    duration: (timepoints[index + 1]?.timeSeconds - timepoints[index]?.timeSeconds) * 1000 || 0
  }));
}
```

---

## 🔧 مراحل تکمیل TTS

### مرحله 1: Setup Google Cloud (30 دقیقه)
```powershell
# 1. ساخت پروژه در Google Cloud
# https://console.cloud.google.com

# 2. فعال کردن Text-to-Speech API
# APIs & Services → Enable APIs → Cloud Text-to-Speech API

# 3. ساخت Service Account و دانلود Key
# IAM & Admin → Service Accounts → Create

# 4. جایگذاری Key در پروژه
cd "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\backend"
# کپی کردن service-account-key.json به اینجا
```

### مرحله 2: نصب Dependencies (5 دقیقه)
```powershell
cd backend
npm install @google-cloud/text-to-speech
```

### مرحله 3: تنظیم Environment Variables (2 دقیقه)
```env
# backend/.env
GOOGLE_CLOUD_PROJECT_ID=mychurch-12345
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

### مرحله 4: Implementation کد (20 دقیقه)
- کپی کردن کد بالا در `backend/routes/bibleUnified.js`
- تست endpoint با Postman

### مرحله 5: Frontend Integration (5 دقیقه)
```typescript
// pages/BibleViewer.tsx - قبلاً آماده شده
// فقط باید API endpoint درست باشد
```

### مرحله 6: Testing (10 دقیقه)
```powershell
# Test با curl
curl -X POST http://localhost:3001/api/bible-unified/tts `
  -H "Content-Type: application/json" `
  -d '{"text":"In the beginning God created","language":"en"}'

# Test در Browser
# به /bible-viewer برو
# روی Play کلیک کن
```

---

## 📊 درصد آمادگی

| بخش | وضعیت | درصد |
|-----|-------|------|
| UI Components | ✅ کامل | 100% |
| Frontend Hooks | ✅ کامل | 100% |
| State Management | ✅ کامل | 100% |
| Backend API Endpoint | ⚠️ موجود اما خالی | 10% |
| Google Cloud Setup | ❌ نشده | 0% |
| Audio Generation | ❌ نشده | 0% |
| Word Timing Extraction | ❌ نشده | 0% |
| **مجموع** | **⚠️ نیمه‌کاره** | **35%** |

---

## ✅ Test سریع بدون Google Cloud

برای تست سریع می‌توانیم از **Mock Audio** استفاده کنیم:

```typescript
// backend/routes/bibleUnified.js
router.post('/tts', async (req, res) => {
  const { text, language } = req.body;
  
  // Mock Response برای تست
  const words = text.split(/\s+/);
  const mockTimings = words.map((word, index) => ({
    word,
    index,
    startTime: index * 500,
    endTime: (index + 1) * 500,
    duration: 500
  }));

  // استفاده از Browser Speech API (برای تست)
  res.json({
    success: true,
    useBrowserTTS: true, // Flag برای Frontend
    text,
    language,
    timings: mockTimings
  });
});
```

سپس در Frontend:

```typescript
// hooks/useTTS.ts
if (response.useBrowserTTS) {
  // استفاده از window.speechSynthesis
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'fa' ? 'fa-IR' : 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}
```

---

## 🎯 توصیه

**برای الان**: UI کامل است و دکمه‌های Play نمایش داده می‌شوند اما وقتی کلیک می‌کنید هیچ اتفاقی نمی‌افتد.

**برای استفاده واقعی**: باید Google Cloud TTS را Setup کنید (حدود 1 ساعت کار).

**یا**: برای Demo سریع می‌توانید از Browser Speech API استفاده کنید (کیفیت پایین‌تر اما رایگان).

---

**آیا می‌خواهید الان Google Cloud TTS را Setup کنیم؟** 🤔
