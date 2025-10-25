# 🎵 Worship Songs Extractor

اسکریپت Python برای استخراج خودکار سرودها از آرشیو Kalameh.com

---

## 📋 قابلیت‌ها

✅ استخراج تمام سرودها از فایل HTML  
✅ کپی خودکار فایل‌های MP3  
✅ کپی خودکار فایل‌های PPTX  
✅ استخراج لینک‌های YouTube  
✅ استخراج متن سرودها (Lyrics)  
✅ ساخت فایل JSON کامل با تمام اطلاعات  
✅ نام‌گذاری هوشمند فایل‌ها  
✅ ساخت slug برای URL ها  

---

## 🛠️ نصب

### 1. نصب Python

مطمئن شوید Python 3.7+ نصب است:

```bash
python --version
```

### 2. نصب کتابخانه‌ها

```bash
cd scripts
pip install -r requirements.txt
```

یا به صورت دستی:

```bash
pip install beautifulsoup4 lxml
```

---

## 🚀 استفاده

### روش 1: اجرا با تنظیمات پیش‌فرض

```bash
cd scripts
python extract_worship_songs.py
```

### روش 2: تغییر مسیرها

فایل `extract_worship_songs.py` را باز کنید و این خطوط را ویرایش کنید:

```python
# مسیر فایل HTML
BASE_DIR = r"D:\Path\To\Your\Kalameh\Folder"
HTML_FILE = os.path.join(BASE_DIR, "song-archive00ed.html")

# مسیر پروژه React
PROJECT_DIR = r"D:\Path\To\Your\Project"
```

---

## 📂 ساختار خروجی

بعد از اجرای اسکریپت، این ساختار ایجاد می‌شود:

```
public/worship/
├── audio/
│   ├── El_Shaddai.mp3
│   ├── Come_to_Me_Jesus.mp3
│   └── ...
│
├── pptx/
│   ├── El_Shaddai.pptx
│   ├── Come_to_Me_Jesus.pptx
│   └── ...
│
├── lyrics/
│   ├── el-shaddai_fa.txt
│   ├── el-shaddai_en.txt
│   └── ...
│
└── data/
    ├── worship_songs.json  ⭐ فایل اصلی
    └── timepoints/
```

---

## 📄 فرمت JSON خروجی

```json
[
  {
    "id": 1,
    "slug": "el-shaddai",
    "title": {
      "fa": "الشدای",
      "en": "El Shaddai",
      "es": "El Shaddai"
    },
    "artist": "Michael Card",
    "composer": "Michael Card",
    "youtubeId": "jMLhjqlVj5U",
    "audioUrl": "/worship/audio/El_Shaddai.mp3",
    "videoUrl": "https://www.youtube.com/embed/jMLhjqlVj5U",
    "presentationFileUrl": "/worship/pptx/El_Shaddai.pptx",
    "lyricsFiles": {
      "fa": "/worship/lyrics/el-shaddai_fa.txt",
      "en": "/worship/lyrics/el-shaddai_en.txt"
    },
    "lyrics": {
      "fa": "الشدای، الشدای...",
      "en": "El Shaddai, El Shaddai...",
      "es": "El Shaddai, El Shaddai..."
    },
    "chord": "D",
    "mode": "Minor",
    "duration": 0,
    "tags": ["worship", "persian", "minor"],
    "language": "fa",
    "dateAdded": "2025-01-24"
  }
]
```

---

## 📊 آمار نمونه

```
✅ استخراج با موفقیت انجام شد!

📊 تعداد کل سرودها: 156
📁 مسیر خروجی: D:\...\public\worship

📂 پوشه‌های ایجاد شده:
   🎵 صوت‌ها:        public/worship/audio
   📊 پاورپوینت‌ها:   public/worship/pptx
   📝 متن سرودها:    public/worship/lyrics
   💾 داده‌ها:       public/worship/data

📈 آمار:
   🎵 با فایل صوتی:    142/156
   📊 با پاورپوینت:    138/156
   🎬 با ویدیو یوتیوب: 89/156
   📝 با متن:          156/156
```

---

## 🔧 سفارشی‌سازی

### تغییر فرمت نام فایل‌ها

در تابع `safe_filename()`:

```python
def safe_filename(name):
    # فرمت دلخواه خود را اینجا بنویسید
    name = name.lower()
    name = name.replace(' ', '-')
    return name
```

### اضافه کردن فیلدهای جدید

```python
song["custom_field"] = "value"
```

### فیلتر کردن سرودها

```python
# فقط سرودهایی که فایل صوتی دارند
if not audio_link:
    continue
```

---

## ⚠️ نکات مهم

1. **حجم فایل‌ها**: فایل‌های MP3 و PPTX ممکن است حجم زیادی داشته باشند
2. **Git Ignore**: مطمئن شوید فایل‌های بزرگ در `.gitignore` هستند
3. **مجوزها**: مطمئن شوید مجوز کپی فایل‌ها را دارید
4. **Backup**: قبل از اجرا، از فایل‌های اصلی backup بگیرید

---

## 🐛 عیب‌یابی

### خطا: `FileNotFoundError`

```bash
❌ فایل HTML یافت نشد
```

**راه‌حل**: مسیر `BASE_DIR` و `HTML_FILE` را بررسی کنید

### خطا: `Import Error: bs4`

```bash
pip install beautifulsoup4
```

### خطا: `PermissionError`

اسکریپت را با دسترسی Administrator اجرا کنید

### فایل‌ها کپی نمی‌شوند

مسیرهای نسبی در HTML را بررسی کنید. ممکن است نیاز به تنظیم دستی باشد.

---

## 📝 مراحل بعدی

1. ✅ اجرای اسکریپت و استخراج داده‌ها
2. ⏳ بررسی فایل `worship_songs.json`
3. ⏳ آپلود فایل‌ها روی سرور/CDN
4. ⏳ اضافه کردن timepoints (دستی یا خودکار)
5. ⏳ تست در حالت پرزنتیشن
6. ⏳ انتشار نهایی

---

## 🤝 مشارکت

اگر بهبودی داشتید:
- Issue باز کنید
- Pull Request ارسال کنید

---

## 📄 لایسنس

این اسکریپت برای استفاده داخلی کلیسا نوشته شده است.

---

**نویسنده**: GitHub Copilot  
**تاریخ**: 2025-01-24  
**نسخه**: 1.0.0
