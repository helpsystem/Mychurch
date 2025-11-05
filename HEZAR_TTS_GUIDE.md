# استفاده از Hezar برای تولید صوت کتاب مقدس

## نصب کتابخانه‌ها

```bash
# نصب Hezar
pip install hezar

# نصب کتابخانه‌های صوتی
pip install librosa soundfile

# نصب ffmpeg (برای ترکیب فایل‌ها)
# Windows: دانلود از https://ffmpeg.org/
# یا از طریق chocolatey:
choco install ffmpeg

pip install pydub
```

## استفاده

### 1. تولید صوت برای یک فصل

```bash
cd scripts
python hezar_tts_generator.py --book EPH --chapter 1
```

### 2. تولید و ترکیب آیات

```bash
python hezar_tts_generator.py --book EPH --chapter 1 --combine
```

### 3. تعیین مسیر خروجی

```bash
python hezar_tts_generator.py --book EPH --chapter 1 --output-dir "../public/audio/bible/hezar"
```

## مدل‌های موجود Hezar

### Text-to-Speech (TTS)
- `hezarai/fastspeech2-persian-tts` ✅ پیشنهادی
- `hezarai/tacotron2-persian-tts`

### Speech Recognition (ASR)
- `hezarai/whisper-small-fa` - برای تبدیل صوت به متن
- `hezarai/wav2vec2-large-fa` - برای تشخیص گفتار فارسی

## مثال کامل

```python
from hezar.models import Model

# بارگذاری مدل TTS
tts_model = Model.load("hezarai/fastspeech2-persian-tts")

# تولید صوت
text = "در آغاز کلام بود و کلام نزد خدا بود و کلام خدا بود"
outputs = tts_model.predict(text)

# ذخیره فایل
import soundfile as sf
sf.write("output.wav", outputs[0], samplerate=22050)
```

## تولید Timing Files خودکار

برای تولید فایل‌های timing (برای karaoke):

```python
# استفاده از Montreal Forced Aligner یا
# استفاده از Hezar ASR + timestamp extraction

from hezar.models import Model

# بارگذاری مدل ASR با timestamp
asr_model = Model.load("hezarai/whisper-small-fa")

# تبدیل صوت به متن با timestamp
result = asr_model.predict("audio.mp3", return_timestamps=True)

# ذخیره timing
timing_data = {
    "words": [
        {
            "word": word["text"],
            "start": word["start"],
            "end": word["end"]
        }
        for word in result["words"]
    ]
}
```

## استفاده در سایت

بعد از تولید فایل‌ها، آن‌ها را در مسیر صحیح قرار دهید:

```
public/
├── audio/
│   └── bible/
│       └── hezar/
│           └── EPH/
│               ├── 1.mp3
│               ├── 2.mp3
│               └── ...
└── bible-timings/
    ├── bible_EPH_1_timing.json
    └── ...
```

## مزایای استفاده از Hezar

✅ **کیفیت بالا**: صدای طبیعی فارسی  
✅ **رایگان**: بدون نیاز به API key  
✅ **آفلاین**: اجرا روی سرور شما  
✅ **سفارشی‌سازی**: کنترل کامل روی خروجی  
✅ **تولید انبوه**: می‌توان تمام کتاب مقدس را تولید کرد

## محدودیت‌ها

⚠️ **سرعت**: تولید صوت کمی زمان‌بر است (حدود 1-2 ثانیه به ازای هر آیه)  
⚠️ **حجم**: مدل‌ها حدود 500MB-1GB فضا می‌گیرند  
⚠️ **Python**: نیاز به Python 3.8+ و کتابخانه‌های صوتی

## تولید کل کتاب مقدس

برای تولید صوت تمام کتاب مقدس:

```bash
# اسکریپت خودکار برای تمام کتاب‌ها
for book in GEN EXO LEV NUM DEU ...; do
    for chapter in $(seq 1 50); do
        python hezar_tts_generator.py --book $book --chapter $chapter --combine
    done
done
```

## بهینه‌سازی

### استفاده از GPU
```python
# برای سرعت بیشتر از GPU استفاده کنید
model = Model.load("hezarai/fastspeech2-persian-tts", device="cuda")
```

### تولید موازی
```python
from concurrent.futures import ThreadPoolExecutor

def generate_verse(verse_text, output_path):
    # تولید صوت
    pass

with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(generate_verse, v, p) for v, p in verses]
```

## پشتیبانی

- مستندات Hezar: https://github.com/hezarai/hezar
- Issues: https://github.com/hezarai/hezar/issues
- مثال‌ها: https://github.com/hezarai/hezar/tree/main/examples
