# 🎤 Hugging Face Persian TTS - راهنمای استفاده

## ✅ سیستم آماده است!

سیستم TTS فارسی با استفاده از **Hugging Face API** و مدل‌های **Kamtera** راه‌اندازی شد.

---

## 🚀 دسترسی سریع

### صفحه تست:
```
http://localhost:5174/#/tts-hf
```

### Backend API:
```
http://localhost:3001/api/tts/huggingface/*
```

---

## 📚 ویژگی‌های سیستم

### ✅ مزایا:
1. **بدون نیاز به نصب Python** - همه چیز از طریق API
2. **کیفیت عالی** - بهترین مدل‌های Kamtera:
   - `persian-tts-female-vits` (صدای زن)
   - `persian-tts-male1-vits` (صدای مرد)
3. **Cache خودکار** - سرعت بالا برای متن‌های تکراری
4. **رایگان** - تا 30,000 request در ماه
5. **آسان** - فقط متن بده، صدا بگیر!

### ⚠️ محدودیت‌ها:
1. **Cold Start** - بار اول 20-30 ثانیه طول می‌کشد (بارگذاری مدل)
2. **حداکثر متن** - 1000 کاراکتر
3. **نیاز به اینترنت** - برای اولین بار

---

## 🎯 نحوه استفاده

### 1. در Component:
```typescript
import { useHuggingFaceTTS } from '@/hooks/useHuggingFaceTTS';

function MyComponent() {
  const { speak, isLoading, isPlaying } = useHuggingFaceTTS();
  
  const handleSpeak = async () => {
    await speak('سلام! این یک تست است.', { voice: 'female' });
  };
  
  return (
    <button onClick={handleSpeak} disabled={isLoading}>
      {isLoading ? 'در حال تولید...' : 'پخش صدا'}
    </button>
  );
}
```

### 2. مستقیم از API:
```javascript
// Synthesize text to speech
const response = await fetch('/api/tts/huggingface/synthesize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'سلام دنیا',
    voice: 'female' // یا 'male'
  })
});

const data = await response.json();
// data.audioUrl => URL فایل صوتی
```

---

## 📡 API Endpoints

### 1. تولید صدا
```http
POST /api/tts/huggingface/synthesize

Body:
{
  "text": "متن فارسی",
  "voice": "female", // یا "male"
  "apiToken": "hf_xxx..." // اختیاری
}

Response:
{
  "success": true,
  "audioUrl": "/api/tts/huggingface/audio/hf_female_abc123.wav",
  "cached": false,
  "voice": "female",
  "model": "Kamtera/persian-tts-female-vits"
}
```

### 2. دریافت فایل صوتی
```http
GET /api/tts/huggingface/audio/:filename
```

### 3. لیست مدل‌ها
```http
GET /api/tts/huggingface/models

Response:
{
  "success": true,
  "models": [
    {
      "id": "female",
      "name": "Kamtera/persian-tts-female-vits",
      "description": "بهترین مدل زن فارسی (VITS)"
    },
    {
      "id": "male",
      "name": "Kamtera/persian-tts-male1-vits",
      "description": "بهترین مدل مرد فارسی (VITS)"
    }
  ]
}
```

### 4. آمار Cache
```http
GET /api/tts/huggingface/cache/stats

Response:
{
  "fileCount": 12,
  "totalSize": 2485760,
  "totalSizeMB": "2.37",
  "cacheDir": "cache/tts/huggingface"
}
```

### 5. پاک کردن Cache
```http
POST /api/tts/huggingface/cache/clean

Body:
{
  "daysOld": 7 // فایل‌های قدیمی‌تر از 7 روز
}
```

### 6. Health Check
```http
GET /api/tts/huggingface/health
```

---

## 🔑 API Token (اختیاری)

برای استفاده بدون محدودیت، یک API token رایگان از Hugging Face بگیرید:

1. برو به: https://huggingface.co/settings/tokens
2. یک token جدید بساز (Read access کافی است)
3. token را به `apiToken` در request اضافه کن

**بدون Token:**
- محدودیت: Rate limiting ممکن است
- کافی برای تست و استفاده شخصی

**با Token:**
- بدون محدودیت Rate limiting
- سرعت بیشتر (priority در queue)

---

## 💾 Cache System

### چگونه کار می‌کند؟
1. متن → Hash MD5 (کلید یکتا)
2. بررسی cache: اگر وجود داشت → بازگشت فوری
3. اگر نبود → فراخوانی API → ذخیره در cache

### مسیر Cache:
```
cache/tts/huggingface/
  ├── hf_female_abc123def456.wav
  ├── hf_male_xyz789.wav
  └── ...
```

### مدیریت:
- **خودکار**: فایل‌های قدیمی‌تر از 7 روز پاک می‌شوند
- **دستی**: از endpoint `/cache/clean` استفاده کنید

---

## 🎨 یکپارچه‌سازی با صفحات موجود

### Bible Audio Player:
```typescript
// در BibleAudioPlayer.tsx
import { useHuggingFaceTTS } from '@/hooks/useHuggingFaceTTS';

const { speak } = useHuggingFaceTTS();

// برای خواندن آیه:
const readVerse = async (text: string) => {
  await speak(text, { voice: 'female' });
};
```

### Bible Presentation:
```typescript
// در BilingualBiblePresentation.tsx
import { useHuggingFaceTTS } from '@/hooks/useHuggingFaceTTS';

const { speak, isPlaying } = useHuggingFaceTTS();

// جایگزین Web Speech API:
const speakVerse = async (persianText: string) => {
  await speak(persianText, { voice: 'female' });
};
```

---

## 🐛 عیب‌یابی

### مشکل 1: "Model is loading" error
**علت:** مدل برای اولین بار در حال بارگذاری است  
**راه‌حل:** 20-30 ثانیه صبر کنید و دوباره امتحان کنید

### مشکل 2: خطای شبکه
**علت:** اینترنت قطع یا Hugging Face در دسترس نیست  
**راه‌حل:** اتصال اینترنت را بررسی کنید

### مشکل 3: صدا پخش نمی‌شود
**علت:** مسدود شدن autoplay در مرورگر  
**راه‌حل:** کاربر باید دکمه play را کلیک کند

### مشکل 4: Cache پر شده
**راه‌حل:** از endpoint `/cache/clean` استفاده کنید

---

## 📊 مقایسه با روش‌های دیگر

| ویژگی | Hugging Face | Web Speech API | Coqui Local |
|-------|-------------|----------------|-------------|
| **کیفیت** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **سرعت** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **آفلاین** | ❌ | ✅ | ✅ |
| **نصب** | ساده | بسیار ساده | پیچیده |
| **محدودیت** | 30K req/month | بستگی به OS | بدون |
| **هزینه** | رایگان | رایگان | VPS |

---

## 🎯 توصیه برای Production

### استراتژی ترکیبی:
1. **اولویت 1**: فایل‌های صوتی از پیش ضبط شده (کتاب مقدس)
2. **اولویت 2**: Hugging Face TTS (برای محتوای پویا)
3. **Fallback**: Web Speech API (اگر HF در دسترس نبود)

### پیاده‌سازی:
```typescript
async function speakPersian(text: string) {
  try {
    // ابتدا Hugging Face را امتحان کن
    await useHuggingFaceTTS().speak(text);
  } catch (error) {
    // اگر شکست خورد، از Web Speech API استفاده کن
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fa-IR';
    speechSynthesis.speak(utterance);
  }
}
```

---

## 📝 مثال کامل

```typescript
import React, { useState } from 'react';
import { useHuggingFaceTTS } from '@/hooks/useHuggingFaceTTS';

export default function MyTTSComponent() {
  const [text, setText] = useState('');
  const { speak, isLoading, isPlaying, error, stop } = useHuggingFaceTTS();

  const handleSpeak = async () => {
    try {
      await speak(text, { voice: 'female' });
    } catch (err) {
      console.error('TTS failed:', err);
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="متن فارسی..."
        maxLength={1000}
      />
      
      <div>
        <button onClick={handleSpeak} disabled={isLoading || !text}>
          {isLoading ? '⏳ در حال تولید...' : '▶️ پخش'}
        </button>
        
        <button onClick={stop} disabled={!isPlaying}>
          ⏹️ توقف
        </button>
      </div>
      
      {error && <div className="error">{error}</div>}
      {isPlaying && <div>🔊 در حال پخش...</div>}
    </div>
  );
}
```

---

## 🎉 خلاصه

✅ **سیستم آماده است!**

- صفحه تست: http://localhost:5174/#/tts-hf
- Backend: http://localhost:3001/api/tts/huggingface/*
- کیفیت: ⭐⭐⭐⭐⭐ (بهترین مدل‌های فارسی)
- استفاده: بسیار ساده با React Hook
- Cache: خودکار برای سرعت بالا

**استفاده کنید و لذت ببرید!** 🚀✨

---

**تاریخ:** 27 اکتبر 2025  
**نسخه:** 1.0  
**وضعیت:** ✅ آماده برای استفاده
