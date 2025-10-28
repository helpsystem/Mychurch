# 🚀 استفاده از Hugging Face API برای TTS فارسی
## راه حل ساده بدون نیاز به نصب!

این راهنما نحوه استفاده از **Demo آنلاین Coqui TTS** را توضیح می‌دهد.

---

## ✨ مزایا

- ✅ **بدون نیاز به نصب** - فقط API call
- ✅ **کیفیت عالی** - مدل Coqui VITS
- ✅ **رایگان** - Demo آنلاین
- ✅ **سریع** - آماده در 5 دقیقه

---

## 🌐 Demo های آنلاین

### گزینه 1: Hugging Face Spaces (توصیه می‌شود)
```
https://karim23657-persian-tts-sherpa.hf.space/
https://huggingface.co/spaces/Kamtera/Persian-tts-CoquiTTS
```

### گزینه 2: مدل‌های از پیش آموزش‌دیده
```
Male Voice: https://huggingface.co/Kamtera/persian-tts-male1-vits
Female Voice: https://huggingface.co/Kamtera/persian-tts-female-vits
```

---

## 💡 راه‌حل عملی: استفاده از Demo آنلاین

چون نصب محلی در Windows پیچیده است، بهترین راه استفاده از **سیستم فعلی** است:

### ✅ سیستم فعلی شما:

1. **📁 فایل‌های صوتی دانلود شده**
   - 6 فصل افسسیان از WordProject
   - کیفیت عالی، آفلاین
   - مسیر: `public/audio/bible/farsi/EPH/`

2. **🎤 Web Speech API بهبود یافته**
   - Helper هوشمند فارسی (`lib/persianTTS.ts`)
   - جستجوی خودکار بهترین صدا
   - Fallback به صدای پیش‌فرض

3. **🎵 Audio Player زیبا**
   - صفحه `/#/bible-audio-player`
   - پخش فایل‌های کامل فصل
   - کنترل‌های پیشرفته

4. **🎙️ صفحه تست TTS**
   - صفحه `/#/tts-demo`
   - تست زنده صدا
   - نمایش وضعیت سرویس‌ها

---

## 🎯 توصیه نهایی

### برای **الان** (Development):
استفاده از سیستم فعلی که **کامل کار می‌کند**:

```typescript
// در components
import { speakPersian } from '@/lib/persianTTS';

// پخش صدا
speakPersian('سلام دنیا', {
  rate: 0.9,
  pitch: 1.0,
  onEnd: () => console.log('Done!')
});
```

### برای **آینده** (Production):

اگر می‌خواهید کیفیت بهتری داشته باشید:

1. **گزینه A: Hugging Face Inference API**
   ```bash
   # رایگان تا 30,000 request/month
   # نیاز به API token
   ```

2. **گزینه B: سرور اختصاصی**
   ```bash
   # یک VPS با Ubuntu
   # نصب TTS server طبق TTS_SERVER_SETUP.md
   ```

3. **گزینه C: دانلود بیشتر فایل‌های صوتی**
   ```bash
   # دانلود همه 66 کتاب کتاب مقدس
   node scripts/download-to-public.cjs --all
   ```

---

## 📊 مقایسه گزینه‌ها

| روش | کیفیت | هزینه | پیچیدگی | آفلاین |
|-----|--------|-------|---------|--------|
| **فایل‌های صوتی** (فعلی) | ⭐⭐⭐⭐⭐ | رایگان | ساده | ✅ |
| **Web Speech API** (فعلی) | ⭐⭐⭐ | رایگان | بسیار ساده | ✅ |
| **HF Inference API** | ⭐⭐⭐⭐⭐ | محدود رایگان | متوسط | ❌ |
| **TTS Server محلی** | ⭐⭐⭐⭐⭐ | VPS | پیچیده | ✅ |

---

## 🎬 تست کنید!

### 1. صفحه Demo:
```
http://localhost:5173/#/tts-demo
```
- تست Web Speech API
- بررسی صداهای موجود
- راهنمای نصب صدای فارسی

### 2. Audio Player:
```
http://localhost:5173/#/bible-audio-player
```
- پخش فایل‌های صوتی افسسیان
- کیفیت عالی
- کنترل‌های کامل

### 3. Bible Presentation:
```
http://localhost:5173/#/bible-presentation-sample
```
- نمایش دو زبانه
- TTS آیه به آیه
- Fullscreen برای ویدئو پروژکتور

---

## 💬 نکات مهم

### ✅ چیزهایی که **الان** کار می‌کند:

- ✅ فایل‌های صوتی با کیفیت بالا (افسسیان)
- ✅ Web Speech API با تنظیمات بهینه
- ✅ Audio Player زیبا و کاربردی
- ✅ Bible Presentation تمام‌صفحه
- ✅ آماده برای استفاده در کلیسا!

### 📝 چیزهایی که **اختیاری** هستند:

- 📝 نصب Coqui TTS Server (برای production)
- 📝 دانلود بقیه کتاب‌های کتاب مقدس
- 📝 اتصال به Hugging Face API
- 📝 نصب صدای فارسی در Windows

---

## 🎉 نتیجه‌گیری

**شما الان یک سیستم کامل و کاربردی دارید!** 🚀

- برای **پخش فایل‌های صوتی**: Audio Player
- برای **خواندن آیه به آیه**: Bible Presentation با TTS
- برای **تست**: TTS Demo page

همه چیز آماده و کار می‌کند! 

اگر در آینده خواستید کیفیت را بهتر کنید، می‌توانید:
1. صدای فارسی را در Windows نصب کنید (5 دقیقه)
2. یا TTS Server را در production راه‌اندازی کنید

---

## 📞 پشتیبانی

- **GitHub Issues**: https://github.com/karim23657/Persian-tts-coqui/issues
- **Telegram**: https://t.me/persian_tts
- **Email**: alias@karim23657.anonaddy.com

---

## 🔗 لینک‌های مفید

- مدل Male: https://huggingface.co/Kamtera/persian-tts-male1-vits
- مدل Female: https://huggingface.co/Kamtera/persian-tts-female-vits
- Demo Online: https://karim23657-persian-tts-sherpa.hf.space/
- راهنمای آموزش: https://github.com/karim23657/Persian-tts-coqui

---

**✨ از سیستم فعلی لذت ببرید! همه چیز آماده است!**
