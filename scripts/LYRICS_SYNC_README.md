# 🎵 سیستم هماهنگ‌سازی خودکار متن با صدا

این سیستم با استفاده از **Whisper API** از OpenAI، به‌صورت خودکار زمان‌بندی دقیق کلمات را از فایل‌های صوتی استخراج می‌کند.

---

## 📦 نصب

### 1. نصب پکیج‌های Python

```bash
cd scripts
pip install -r requirements-whisper.txt
```

### 2. دریافت API Key از OpenAI

1. برو به: https://platform.openai.com/api-keys
2. یک API Key جدید بساز
3. کپی کن (مثلاً: `sk-proj-abc123...`)

### 3. تنظیم API Key

دو راه داری:

**راه ۱: فایل .env (توصیه میشه)**
```bash
cd scripts
cp .env.example .env
# حالا فایل .env رو باز کن و API key خودت رو بذار:
# OPENAI_API_KEY=sk-proj-abc123...
```

**راه ۲: مستقیم در command line**
```bash
python generate_lyrics_timing.py --audio song.mp3 --api-key sk-proj-abc123...
```

---

## 🚀 استفاده

### حالت ۱: پردازش یک سرود

```bash
cd scripts

# فقط فایل صوتی (Whisper خودش متن رو تشخیص میده)
python generate_lyrics_timing.py --audio path/to/song.mp3

# با متن اصلی (برای دقت بیشتر)
python generate_lyrics_timing.py \
    --audio path/to/song.mp3 \
    --lyrics path/to/lyrics.txt \
    --language fa

# تعیین مسیر خروجی
python generate_lyrics_timing.py \
    --audio song.mp3 \
    --output my_output/song_timing
```

### حالت ۲: پردازش دسته‌ای همه سرودها

```bash
cd scripts

# پردازش همه سرودها (فقط اونهایی که MP3 دارند)
python batch_process_worship_songs.py

# فقط 10 تا اول (برای تست)
python batch_process_worship_songs.py --max-songs 10

# اجبار به پردازش دوباره (حتی اگه قبلاً پردازش شدن)
python batch_process_worship_songs.py --skip-existing False

# پردازش + آپدیت worship_songs.json
python batch_process_worship_songs.py --update-json
```

---

## 📤 خروجی‌ها

برای هر سرود، سه فایل تولید میشه:

### 1. JSON (برای React)
```json
{
  "metadata": {
    "title": "الشدای",
    "artist": "...",
    "audioUrl": "https://...",
    "totalDuration": 245.6,
    "wordCount": 324,
    "lineCount": 42
  },
  "words": [
    {
      "word": "در",
      "start": 0.42,
      "end": 0.75
    },
    {
      "word": "جلال",
      "start": 0.76,
      "end": 1.35
    }
  ],
  "lines": [
    {
      "line": "در جلال آسمان ، نور رویت درخشان",
      "start": 0.42,
      "end": 5.2,
      "words": [...]
    }
  ]
}
```

### 2. WebVTT (برای video player)
```
WEBVTT

1
00:00:00.420 --> 00:00:05.200
در جلال آسمان ، نور رویت درخشان

2
00:00:05.300 --> 00:00:10.100
مهر و قوت از توست
```

### 3. SRT (فرمت استاندارد subtitle)
```
1
00:00:00,420 --> 00:00:05,200
در جلال آسمان ، نور رویت درخشان

2
00:00:05,300 --> 00:00:10,100
مهر و قوت از توست
```

---

## 🔧 استفاده در React

### گام ۱: بارگذاری JSON

```typescript
import React from 'react';
import timingData from '/worship/data/timings/song_1_timing.json';

// یا بارگذاری پویا:
const [timingData, setTimingData] = useState(null);

useEffect(() => {
  fetch('/worship/data/timings/song_1_timing.json')
    .then(res => res.json())
    .then(data => setTimingData(data));
}, []);
```

### گام ۲: استفاده با کامپوننت موجود

```tsx
<LocalAudioPlayerWithSyncedLyrics
  audioUrl={song.audioUrl}
  lyrics={song.lyrics?.fa}
  lyricLines={timingData?.lines}  // 👈 پاس دادن timing دقیق
  lang="fa"
  title={song.title?.fa}
  artist={song.artist}
/>
```

**توجه:** اگر `lyricLines` پاس بدی، از timing دقیق Whisper استفاده میشه. اگه نده، از تخمین استفاده میشه.

---

## 💰 هزینه

Whisper API از OpenAI:
- قیمت: **$0.006 per minute** (۶ هزارم دلار به ازای هر دقیقه صوت)
- مثال: سرود 4 دقیقه‌ای = $0.024 (حدود 2.4 سنت)
- 364 سرود × 4 دقیقه میانگین = **حدود $8.74 کل هزینه**

---

## 🎯 ویژگی‌ها

✅ **دقت بالا**: Whisper یکی از بهترین مدل‌های ASR دنیاست  
✅ **پشتیبانی فارسی**: کاملاً با فارسی کار می‌کنه  
✅ **Word-level timestamps**: زمان دقیق هر کلمه  
✅ **Batch processing**: پردازش خودکار صدها سرود  
✅ **فرمت‌های مختلف**: JSON, WebVTT, SRT  
✅ **هماهنگ با React**: مستقیم در کامپوننت استفاده میشه  

---

## 🐛 عیب‌یابی

### خطا: "OpenAI API Key پیدا نشد"
```bash
# مطمئن شو فایل .env وجود داره و API key درست تنظیم شده:
cat scripts/.env
# باید ببینی: OPENAI_API_KEY=sk-...
```

### خطا: "Module 'openai' not found"
```bash
pip install -r scripts/requirements-whisper.txt
```

### خطا: "Rate limit exceeded"
```bash
# اگر خیلی سرود داری، با --max-songs محدودش کن:
python batch_process_worship_songs.py --max-songs 50
# یا تاخیر بین هر سرود رو افزایش بده (در کد: time.sleep(2))
```

### دقت پایین برای بعضی سرودها
```bash
# اگر صوت خیلی نویزی یا کیفیت پایین داره:
# 1. فایل صوتی رو بهبود بده (noise reduction)
# 2. متن اصلی رو هم پاس بده:
python generate_lyrics_timing.py --audio song.mp3 --lyrics song.txt
```

---

## 📚 منابع بیشتر

- [OpenAI Whisper API Docs](https://platform.openai.com/docs/guides/speech-to-text)
- [Whisper Model Paper](https://arxiv.org/abs/2212.04356)
- [WebVTT Format Spec](https://www.w3.org/TR/webvtt1/)

---

## 🤝 کمک

اگه مشکلی داشتی یا سوالی بود، بپرس! 🎵
