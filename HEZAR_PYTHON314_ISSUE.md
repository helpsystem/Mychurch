# ⚠️ مشکل سازگاری Hezar با Python 3.14

## خلاصه مشکل

Hezar از کتابخانه `soundfile` استفاده می‌کند که به `cffi` وابسته است.  
متأسفانه `cffi` با Python 3.14 سازگاری ندارد و خطا می‌دهد:

```
ModuleNotFoundError: No module named '_cffi_backend'
```

## نسخه Python شما

```
Python 3.14.0
```

## راه‌حل‌های ممکن

### ✅ راه‌حل 1: نصب Python 3.11 یا 3.12 (توصیه می‌شود)

```bash
# دانلود Python 3.12:
# https://www.python.org/downloads/release/python-3120/

# نصب Hezar با Python 3.12
py -3.12 -m pip install hezar scipy
py -3.12 scripts/test_hezar_simple.py
```

### ✅ راه‌حل 2: Virtual Environment

```bash
# نصب Python 3.12
# سپس ایجاد virtual environment

py -3.12 -m venv venv-py312
venv-py312\Scripts\activate
pip install hezar scipy pydub
python scripts/test_hezar_simple.py
```

### ✅ راه‌حل 3: Google Colab (رایگان، آسان)

1. برو به https://colab.research.google.com/
2. یک Notebook جدید باز کن
3. کد زیر را اجرا کن:

```python
# نصب Hezar
!pip install hezar

# آپلود bible_data.json
from google.colab import files
uploaded = files.upload()

# تولید صوت
from hezar.models import Model
import json

model = Model.load("hezarai/fastspeech2-persian-tts")

# بارگذاری داده
with open('bible_data.json', 'r', encoding='utf-8') as f:
    bible_data = json.load(f)

# تولید صوت برای یک فصل
book_code = 'EPH'
chapter = '1'
verses = bible_data['bible_text']['118'][book_code][chapter]['fa']

for verse_num, verse_text in verses.items():
    outputs = model.predict(verse_text)
    # ذخیره فایل
    import soundfile as sf
    sf.write(f'{book_code}_{chapter}_{verse_num}.wav', outputs[0], samplerate=22050)
    print(f'✓ {book_code} {chapter}:{verse_num}')

# دانلود فایل‌ها
files.download(f'{book_code}_{chapter}_1.wav')
```

### ✅ راه‌حل 4: استفاده از TTS دیگر

#### Google Text-to-Speech (رایگان تا حدی)

```python
from google.cloud import texttospeech
import os

# نیاز به Google Cloud API key
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'path/to/credentials.json'

client = texttospeech.TextToSpeechClient()

voice = texttospeech.VoiceSelectionParams(
    language_code="fa-IR",
    name="fa-IR-Standard-A"
)

audio_config = texttospeech.AudioConfig(
    audio_encoding=texttospeech.AudioEncoding.MP3
)

input_text = texttospeech.SynthesisInput(text="در آغاز کلام بود")
response = client.synthesize_speech(
    input=input_text,
    voice=voice,
    audio_config=audio_config
)

with open('output.mp3', 'wb') as out:
    out.write(response.audio_content)
```

#### Azure Cognitive Services (رایگان تا حدی)

```python
import azure.cognitiveservices.speech as speechsdk

speech_config = speechsdk.SpeechConfig(
    subscription="YOUR_KEY",
    region="YOUR_REGION"
)
speech_config.speech_synthesis_voice_name = "fa-IR-DilaraNeural"

synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config)
result = synthesizer.speak_text_async("در آغاز کلام بود").get()
```

## مقایسه راه‌حل‌ها

| راه‌حل | مزایا | معایب |
|--------|-------|-------|
| **Python 3.12** | ✓ کاملاً آفلاین<br>✓ کیفیت عالی<br>✓ رایگان | ✗ نیاز به نصب Python دیگر |
| **Colab** | ✓ آسان<br>✓ رایگان<br>✓ GPU رایگان | ✗ آنلاین<br>✗ محدودیت زمانی (12 ساعت) |
| **Google TTS** | ✓ کیفیت خوب<br>✓ زبان‌های زیاد | ✗ نیاز به API key<br>✗ محدودیت رایگان |
| **Azure TTS** | ✓ کیفیت عالی<br>✓ صداهای طبیعی | ✗ نیاز به API key<br>✗ هزینه |

## توصیه نهایی

**بهترین راه‌حل: نصب Python 3.12**

1. از https://www.python.org/downloads/ دانلود کنید
2. در هنگام نصب، "Add to PATH" را تیک بزنید
3. بعد از نصب:
   ```bash
   py -3.12 -m pip install hezar scipy
   py -3.12 scripts/hezar_tts_generator.py --book EPH --chapter 1
   ```

## اطلاعات بیشتر

- **مشکل soundfile**: https://github.com/bastibe/python-soundfile/issues/467
- **مشکل cffi**: https://github.com/python-cffi/cffi/issues/1
- **Hezar GitHub**: https://github.com/hezarai/hezar
- **Python 3.12 Download**: https://www.python.org/downloads/release/python-3120/

---

**نتیجه:**  
متأسفانه نمی‌توانید از Hezar با Python 3.14 استفاده کنید.  
لطفاً یکی از راه‌حل‌های بالا را امتحان کنید. 🙏
