# 🎤 راهنمای سریع تولید صوت با Hezar

## گام 1: نصب

### Windows
```bash
# فقط یک بار اجرا کنید
install-hezar.bat
```

### Linux/Mac
```bash
pip install hezar soundfile librosa pydub
```

## گام 2: تست

```bash
python scripts/test_hezar.py
```

اگر پیام "✅ همه تست‌ها موفق!" دیدید، آماده هستید!

## گام 3: تولید صوت

### یک فصل
```bash
python scripts/hezar_tts_generator.py --book EPH --chapter 1
```

### یک فصل + ترکیب آیات
```bash
python scripts/hezar_tts_generator.py --book EPH --chapter 1 --combine
```

### کل کتاب مقدس
```bash
# این کار چندین ساعت طول می‌کشد!
python scripts/generate_all_bible_audio.py
```

### از یک کتاب خاص شروع کن
```bash
python scripts/generate_all_bible_audio.py --start-from MAT
```

### فقط چند کتاب
```bash
python scripts/generate_all_bible_audio.py --books GEN EXO MAT JHN
```

## فایل‌های خروجی

```
public/audio/bible/hezar/
├── EPH/
│   ├── 1.mp3          # فصل کامل
│   ├── 2.mp3
│   └── 1/             # آیات جداگانه
│       ├── 1.wav
│       ├── 2.wav
│       └── ...
├── MAT/
└── ...
```

## گزینه‌های پیشرفته

### تعیین مسیر خروجی
```bash
python hezar_tts_generator.py --book EPH --chapter 1 --output-dir "D:/MyAudio"
```

### تولید مجدد فایل‌های موجود
```bash
python generate_all_bible_audio.py --no-skip
```

### استفاده از GPU (سریع‌تر)
```python
# در hezar_tts_generator.py خط 41 را تغییر دهید:
model = Model.load("hezarai/fastspeech2-persian-tts", device="cuda")
```

## زمان تولید (تخمینی)

| آیتم | تعداد | زمان (CPU) | زمان (GPU) |
|------|-------|-----------|-----------|
| یک آیه | 1 | ~2 ثانیه | ~0.5 ثانیه |
| یک فصل | ~25 آیه | ~1 دقیقه | ~15 ثانیه |
| یک کتاب | ~150 فصل | ~2.5 ساعت | ~40 دقیقه |
| کل کتاب مقدس | 1189 فصل | ~20 ساعت | ~5 ساعت |

## عیب‌یابی

### خطا: "hezar not found"
```bash
pip install hezar
```

### خطا: "soundfile not found"
```bash
pip install soundfile
```

### خطا: "ffmpeg not found"
```bash
# Windows
choco install ffmpeg

# یا دانلود دستی از: https://ffmpeg.org/
```

### خطا: "CUDA out of memory"
```python
# از CPU استفاده کنید به جای GPU
# device="cpu" در hezar_tts_generator.py
```

### صوت تولید نمی‌شود
1. بررسی کنید Python 3.8+ نصب است
2. بررسی کنید `bible_data.json` موجود است
3. مجوز نوشتن در پوشه `public/audio` را چک کنید

## یادداشت‌های مهم

⚠️ **اولین بار**: دانلود مدل (~500MB) چند دقیقه طول می‌کشد

💡 **نکته**: می‌توانید فرآیند را با Ctrl+C متوقف کنید و بعداً ادامه دهید (با `--skip-existing`)

🚀 **سرعت**: استفاده از GPU تولید را 4 برابر سریع‌تر می‌کند

📦 **حجم**: هر فصل حدود 1-3 مگابایت است (کل کتاب مقدس: ~3GB)

## استفاده در سایت

بعد از تولید، فایل‌ها خودکار قابل استفاده در `BibleKaraokeReader` هستند:

```typescript
// فقط کتاب‌های با صوت را نمایش بده
const booksWithAudio = ['EPH', 'MAT', 'JHN', ...];
```

## مشارکت

اگر مشکلی پیدا کردید یا پیشنهادی دارید:
1. Issue باز کنید
2. یا Pull Request ارسال کنید

---

**سؤال دارید؟**
- مستندات: `HEZAR_TTS_GUIDE.md`
- مثال‌ها: `scripts/test_hezar.py`
- GitHub: https://github.com/hezarai/hezar
