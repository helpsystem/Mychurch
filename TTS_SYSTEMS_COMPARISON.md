# 🎤 مقایسه سیستم‌های TTS فارسی

## خلاصه سه سیستم موجود

---

## 1️⃣ **Hugging Face API** (پیاده‌سازی شده ✅)

### 🎯 مشخصات:
- **مدل**: Kamtera/persian-tts-female-vits & male1-vits
- **روش**: API call به Hugging Face
- **نصب**: ❌ نیاز نیست
- **کیفیت**: ⭐⭐⭐⭐⭐ (عالی)
- **سرعت**: ⭐⭐⭐⭐ (اولین بار کند، بعد سریع)

### ✅ مزایا:
- بدون نیاز به نصب Python
- بسیار ساده (یک API call)
- Cache خودکار
- دو صدا (زن و مرد)
- رایگان تا 30K request/month

### ⚠️ معایب:
- نیاز به اینترنت
- Cold start 20-30 ثانیه
- محدودیت 1000 کاراکتر
- محدودیت rate limit

### 📍 وضعیت:
```
✅ پیاده‌سازی شده
✅ Backend: /api/tts/huggingface/*
✅ Frontend: useHuggingFaceTTS hook
✅ صفحه تست: /#/tts-hf
```

---

## 2️⃣ **ManaTTS Tacotron2** (لینک جدید شما)

### 🎯 مشخصات:
- **مدل**: Tacotron2 trained on ManaTTS (114 hours)
- **روش**: Local inference با Python
- **نصب**: ⚠️ پیچیده (چند مرحله)
- **کیفیت**: ⭐⭐⭐⭐⭐ (بسیار عالی)
- **سرعت**: ⭐⭐⭐⭐ (بعد از بارگذاری)

### ✅ مزایا:
- **بالاترین کیفیت** (114 ساعت data)
- بدون محدودیت
- کنترل کامل
- آفلاین کامل
- Multi-speaker support

### ⚠️ معایب:
- نصب بسیار پیچیده:
  1. کلون `Persian-MultiSpeaker-Tacotron2`
  2. دانلود مدل از Hugging Face
  3. نصب HiFiGAN vocoder
  4. نصب scipy==1.12.0
  5. نصب parallel-wavegan
- حجم زیاد (چند گیگابایت)
- نیاز به GPU برای سرعت بالا
- پیچیدگی اجرا

### 📍 وضعیت:
```
❌ پیاده‌سازی نشده
📚 Repository بررسی شد
⚠️ نصب در Windows پیچیده
💡 توصیه: برای production روی Linux
```

---

## 3️⃣ **Coqui TTS** (تلاش قبلی)

### 🎯 مشخصات:
- **مدل**: Kamtera persian-tts-coqui
- **روش**: Python TTS server
- **نصب**: ⚠️ مشکل‌دار در Windows
- **کیفیت**: ⭐⭐⭐⭐⭐ (عالی)
- **سرعت**: ⭐⭐⭐⭐

### ✅ مزایا:
- کیفیت عالی
- آفلاین
- بدون محدودیت
- API ساده

### ⚠️ معایب:
- نیاز به Python 3.8-3.11 (شما 3.14 دارید)
- مشکل path resolution در Windows
- نیاز به espeak-ng
- پیچیدگی نصب

### 📍 وضعیت:
```
⏸️ متوقف شده
❌ Python path issues
📝 کد آماده اما اجرا نمی‌شود
```

---

## 4️⃣ **Web Speech API** (Fallback)

### 🎯 مشخصات:
- **مدل**: Browser built-in
- **روش**: JavaScript API
- **نصب**: ❌ نیاز نیست
- **کیفیت**: ⭐⭐⭐ (متوسط)
- **سرعت**: ⭐⭐⭐⭐⭐ (فوری)

### ✅ مزایا:
- بدون نصب
- بسیار ساده
- سریع
- آفلاین (با نصب voice)

### ⚠️ معایب:
- کیفیت متوسط
- صدای فارسی محدود
- وابسته به سیستم عامل

### 📍 وضعیت:
```
✅ پیاده‌سازی شده
✅ Helper: lib/persianTTS.ts
✅ استفاده در BilingualPresentation
```

---

## 📊 مقایسه جامع

| ویژگی | HuggingFace | ManaTTS | Coqui | Web Speech |
|-------|-------------|---------|-------|------------|
| **کیفیت** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **سرعت** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **نصب** | ساده | بسیار پیچیده | پیچیده | بدون نیاز |
| **آفلاین** | ❌ | ✅ | ✅ | ✅* |
| **هزینه** | رایگان* | رایگان | رایگان | رایگان |
| **محدودیت** | 30K/month | بدون | بدون | وابسته به OS |
| **Windows** | ✅ | ⚠️ | ❌ | ✅ |
| **Production** | ✅ | ✅ | ⚠️ | ⚠️ |
| **پیاده‌سازی** | ✅ تمام | ❌ | ⏸️ | ✅ تمام |

\* آفلاین با نصب صدا

---

## 🎯 توصیه نهایی

### برای **الان** (Development):
```
1️⃣ Hugging Face API (پیاده‌سازی شده ✅)
   - سریع و ساده
   - کیفیت عالی
   - آماده استفاده

2️⃣ Web Speech API (Fallback)
   - برای زمانی که HF در دسترس نیست
```

### برای **آینده** (Production):

#### گزینه A: استفاده از HuggingFace API ⭐⭐⭐⭐⭐
**مزایا:**
- ساده‌ترین راه
- کیفیت عالی
- نگهداری آسان
- مقیاس‌پذیر

**معایب:**
- هزینه (برای بیش از 30K request)
- وابستگی به سرویس خارجی

**توصیه:** برای شروع و تا 30K request/month

---

#### گزینه B: ManaTTS روی Linux Server ⭐⭐⭐⭐
**مزایا:**
- **بالاترین کیفیت**
- بدون محدودیت
- کنترل کامل
- هزینه ثابت (VPS)

**معایب:**
- نصب پیچیده
- نیاز به Linux server
- نیاز به GPU (اختیاری)
- نگهداری سخت‌تر

**توصیه:** برای production با traffic بالا

**مراحل نصب:**
```bash
# 1. Linux Server (Ubuntu 20.04+)
# 2. Clone repository
git clone https://github.com/MahtaFetrat/Persian-MultiSpeaker-Tacotron2.git
git clone https://huggingface.co/MahtaFetrat/Persian-Tacotron2-on-ManaTTS

# 3. Install dependencies
pip install scipy==1.12.0
pip install parallel-wavegan

# 4. Download vocoder
python -c "from parallel_wavegan.utils import download_pretrained_model; download_pretrained_model('vctk_hifigan.v1', '.')"

# 5. Setup paths & run inference
python3 inference.py --vocoder "HiFiGAN" --text "متن فارسی" --ref_wav_path "sample.wav"

# 6. Create API server (Flask/FastAPI)
# 7. Deploy with Docker
```

---

#### گزینه C: ترکیبی (Hybrid) ⭐⭐⭐⭐⭐
**استراتژی:**
```
1. فایل‌های صوتی از پیش ضبط شده (کتاب مقدس) → بالاترین کیفیت
2. Hugging Face API (محتوای پویا) → کیفیت عالی + راحت
3. Web Speech API (Fallback) → همیشه کار می‌کند
```

**پیاده‌سازی:**
```typescript
async function speakPersian(text: string) {
  // 1. Check if pre-recorded audio exists
  const audioFile = await getPreRecordedAudio(text);
  if (audioFile) {
    return playAudio(audioFile);
  }
  
  // 2. Try Hugging Face API
  try {
    const { speak } = useHuggingFaceTTS();
    return await speak(text);
  } catch (error) {
    console.warn('HF failed, fallback to Web Speech', error);
  }
  
  // 3. Fallback to Web Speech API
  return speakWithWebSpeech(text);
}
```

**توصیه:** بهترین راه برای production ⭐

---

## 🚀 نتیجه‌گیری

### سیستم فعلی شما:
```
✅ Hugging Face TTS (کار می‌کند)
✅ Web Speech API (Fallback)
✅ فایل‌های صوتی افسسیان (6 فصل)
```

### قدم بعدی پیشنهادی:

#### اگر می‌خواهید الان استفاده کنید:
```
✅ از سیستم فعلی استفاده کنید
   - HuggingFace API برای محتوای پویا
   - Web Speech برای Fallback
   - کیفیت عالی، کار می‌کند
```

#### اگر می‌خواهید بهترین کیفیت:
```
💡 ManaTTS را روی یک Linux VPS نصب کنید
   - Ubuntu 20.04+
   - پیروی از inference.ipynb
   - ساخت API با Flask/FastAPI
   - استفاده از Docker
```

#### اگر می‌خواهید ساده و کاربردی:
```
⭐ از همین سیستم HuggingFace استفاده کنید
   - تا 30K request رایگان
   - بعد از آن با token استفاده کنید
   - یا اگر traffic بالا رفت → ManaTTS
```

---

## 📝 خلاصه توصیه

**برای سایت کلیسا:**

1. **الان**: HuggingFace API ✅
2. **کتاب مقدس**: فایل‌های از پیش ضبط شده ✅
3. **Fallback**: Web Speech API ✅
4. **آینده** (اگر traffic بالا رفت): ManaTTS روی Linux

**این استراتژی:**
- ✅ کیفیت عالی
- ✅ قابل اطمینان
- ✅ مقیاس‌پذیر
- ✅ هزینه کم
- ✅ ساده

---

**🎉 سیستم فعلی شما برای شروع عالی است!**

صفحه تست: http://localhost:5175/#/tts-hf

---

**تاریخ:** 27 اکتبر 2025  
**وضعیت:** ✅ آماده برای استفاده
