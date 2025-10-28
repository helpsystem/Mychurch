# 🎤 Persian TTS Integration Guide
## استفاده از Coqui TTS فارسی

این راهنما نحوه استفاده از سیستم TTS فارسی با کیفیت بالا را توضیح می‌دهد.

## 📚 منابع

- **GitHub**: https://github.com/karim23657/Persian-tts-coqui
- **Demo Online**: https://karim23657-persian-tts-sherpa.hf.space/
- **Hugging Face**: https://huggingface.co/Kamtera/persian-tts-male1-vits

## 🎯 راه‌حل‌های پیاده‌سازی

### ✅ راه‌حل 1: استفاده از فایل‌های صوتی از پیش ضبط شده (فعلی)

**مزایا:**
- ✅ بدون نیاز به اینترنت
- ✅ کیفیت عالی
- ✅ سرعت بالا

**معایب:**
- ❌ نیاز به دانلود از قبل
- ❌ فضای دیسک (6 فصل = ~6 MB)

**وضعیت:** ✅ **فعال** - فایل‌های افسسیان فصل 1-6 دانلود شده

```bash
# دانلود سایر کتاب‌ها
node scripts/download-to-public.cjs --book=GEN
node scripts/download-to-public.cjs --book=MAT

# دانلود همه
node scripts/download-to-public.cjs --all
```

---

### 🔄 راه‌حل 2: استفاده از Web Speech API بهبود یافته (فعلی)

**مزایا:**
- ✅ رایگان و built-in
- ✅ بدون نیاز به سرور
- ✅ کار می‌کند در همه مرورگرها

**معایب:**
- ❌ کیفیت متوسط
- ❌ نیاز به نصب صدای فارسی در سیستم

**وضعیت:** ✅ **فعال** - `lib/persianTTS.ts`

**نحوه استفاده:**

```typescript
import { speakPersian, isPersianTTSAvailable } from '@/lib/persianTTS';

// بررسی دسترسی
if (isPersianTTSAvailable()) {
  speakPersian('سلام دنیا', {
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
    onEnd: () => console.log('Done!'),
    onError: (err) => console.error(err)
  });
}
```

**نصب صدای فارسی:**

**Windows:**
1. Settings > Time & Language > Language
2. Add Persian (Farsi)
3. Options > Download Text-to-speech

**macOS:**
1. System Preferences > Accessibility > Speech
2. System Voice > Customize
3. انتخاب Siri Female/Male (Persian)

**Android:**
1. Settings > Language & Input > Text-to-speech
2. Google Text-to-speech Settings
3. Install voice data > Persian

---

### 🚀 راه‌حل 3: Hugging Face Inference API (پیشنهادی برای آینده)

**مزایا:**
- ✅ کیفیت بسیار بالا (Coqui VITS)
- ✅ بدون نیاز به نصب
- ✅ تولید آنی

**معایب:**
- ❌ نیاز به اینترنت
- ❌ محدودیت rate limit
- ❌ ممکن است هزینه داشته باشد

**نحوه پیاده‌سازی:**

```javascript
// backend/services/coquiTTS.js
const axios = require('axios');

async function generatePersianTTS(text) {
  const response = await axios.post(
    'https://api-inference.huggingface.co/models/Kamtera/persian-tts-male1-vits',
    { inputs: text },
    {
      headers: {
        'Authorization': `Bearer ${process.env.HUGGING_FACE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    }
  );

  return Buffer.from(response.data);
}
```

**استفاده:**

```typescript
// Frontend
const response = await fetch('/api/tts/persian-coqui', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'سلام دنیا' })
});

const audioBlob = await response.blob();
const audio = new Audio(URL.createObjectURL(audioBlob));
audio.play();
```

---

### 🐍 راه‌حل 4: نصب محلی Coqui TTS (برای production)

**مزایا:**
- ✅ کیفیت بسیار بالا
- ✅ بدون محدودیت
- ✅ کنترل کامل

**معایب:**
- ❌ نیاز به Python و dependencies
- ❌ پیچیدگی بالا
- ❌ نیاز به منابع سرور

**نصب:**

```bash
# 1. نصب TTS
pip install TTS

# 2. نصب espeak (برای phoneme conversion)
# Ubuntu/Debian:
sudo apt-get install espeak-ng

# Windows:
# دانلود از: http://espeak.sourceforge.net/

# 3. دانلود مدل
# مدل‌ها از https://huggingface.co/Kamtera
```

**استفاده از Python:**

```python
from TTS.api import TTS

tts = TTS(
    model_path="https://huggingface.co/Kamtera/persian-tts-male1-vits/resolve/main/checkpoint_88000.pth",
    config_path="https://huggingface.co/Kamtera/persian-tts-male1-vits/resolve/main/config.json"
)

tts.tts_to_file(
    text="زندگی فقط یک بار است؛ از آن به خوبی استفاده کن",
    file_path='output.wav'
)
```

**سرویس Node.js:**

```javascript
// backend/services/pythonTTS.js
const { spawn } = require('child_process');

async function generateWithPython(text) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [
      'scripts/tts_generate.py',
      '--text', text,
      '--output', '/tmp/output.wav'
    ]);

    python.on('close', (code) => {
      if (code === 0) {
        resolve('/tmp/output.wav');
      } else {
        reject(new Error('TTS generation failed'));
      }
    });
  });
}
```

---

## 🎯 توصیه برای این پروژه

### مرحله فعلی: ✅ راه‌حل 1 + 2 (ترکیبی)

```typescript
// در BilingualBiblePresentation
async function playVerse(verse: Verse) {
  // اولویت 1: فایل صوتی از پیش ضبط شده
  if (verse.audio_fa) {
    await playAudioFile(verse.audio_fa);
  }
  // اولویت 2: Web Speech API بهبود یافته
  else {
    await speakPersian(`${verse.verseNumber}. ${verse.text_fa}`);
  }
}
```

### مرحله بعدی: ⏳ راه‌حل 3 (Hugging Face API)

- برای آیاتی که فایل صوتی ندارند
- Cache شدن در سرور
- Fallback به Web Speech API

### آینده: 🚀 راه‌حل 4 (Production)

- نصب Coqui TTS در production server
- تولید آنی با کیفیت بالا
- بدون وابستگی به سرویس خارجی

---

## 📊 مقایسه راه‌حل‌ها

| ویژگی | فایل‌های ضبط شده | Web Speech | Hugging Face API | نصب محلی |
|-------|-----------------|------------|------------------|----------|
| کیفیت | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| سرعت | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| هزینه | رایگان | رایگان | محدود رایگان | هزینه سرور |
| آفلاین | ✅ | ✅ | ❌ | ✅ |
| پیچیدگی | ساده | بسیار ساده | متوسط | پیچیده |

---

## 🔧 کد‌های موجود

### ✅ پیاده‌سازی شده:

- `lib/persianTTS.ts` - Helper برای Web Speech API
- `components/BilingualBiblePresentation.tsx` - استفاده از TTS
- `scripts/download-to-public.cjs` - دانلود فایل‌های صوتی
- `backend/routes/tts.js` - API endpoint (آماده برای توسعه)

### ⏳ نیاز به توسعه:

- `backend/services/coquiTTS.js` - سرویس Hugging Face
- `scripts/tts_generate.py` - اسکریپت Python برای تولید
- `backend/services/pythonTTS.js` - اتصال Node.js به Python

---

## 🎤 تست TTS

### بازکردن صفحات:

1. **Audio Player**: http://localhost:5173/#/bible-audio-player
   - پخش فایل‌های صوتی ضبط شده

2. **Bible Presentation**: http://localhost:5173/#/bible-presentation-sample
   - TTS آیه به آیه با Web Speech API

3. **Test Page**: http://localhost:5173/test-audio.html
   - تست مستقیم فایل‌های صوتی

---

## 📞 پشتیبانی

برای سوالات درباره Coqui TTS:
- GitHub Issues: https://github.com/karim23657/Persian-tts-coqui/issues
- Telegram: https://t.me/persian_tts
- Email: alias@karim23657.anonaddy.com

---

## 🎯 نتیجه‌گیری

**الان داریم:**
- ✅ فایل‌های صوتی با کیفیت (WordProject) - افسسیان 1-6
- ✅ Web Speech API بهبود یافته برای سایر آیات
- ✅ صفحه Audio Player زیبا و کاربردی

**قدم بعدی:**
- 🔄 دانلود بقیه کتاب‌های کتاب مقدس
- 🔄 پیاده‌سازی Hugging Face API برای تولید آنی
- 🔄 Cache کردن TTS تولید شده در سرور
