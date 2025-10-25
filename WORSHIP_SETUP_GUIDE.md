# 🚀 راهنمای سریع: استخراج و اتصال سرودها

این راهنما شما را از **مرحله صفر تا راه‌اندازی کامل** سیستم سرودها هدایت می‌کند.

---

## 📋 پیش‌نیازها

✅ Python 3.7+ نصب باشد  
✅ pip نصب باشد  
✅ دسترسی به فایل HTML آرشیو Kalameh.com  

---

## 🎯 مرحله ۱: اجرای اسکریپت استخراج

### روش A: اجرای ساده (توصیه می‌شود)

**Windows:**
```cmd
cd scripts
double-click run_extractor.bat
```

**Mac/Linux:**
```bash
cd scripts
chmod +x extract_worship_songs.py
python3 extract_worship_songs.py
```

### روش B: اجرای دستی

```bash
# 1. نصب کتابخانه‌ها
cd scripts
pip install -r requirements.txt

# 2. اجرای اسکریپت
python extract_worship_songs.py
```

---

## 📊 نتیجه مرحله ۱

بعد از اجرا، این ساختار ایجاد می‌شود:

```
public/worship/
├── audio/
│   ├── El_Shaddai.mp3
│   ├── Come_to_Me_Jesus.mp3
│   └── ... (1164 فایل!)
│
├── pptx/
│   ├── El_Shaddai.pptx
│   ├── Come_to_Me_Jesus.pptx
│   └── ... (729 فایل!)
│
├── lyrics/
│   ├── el-shaddai_fa.txt
│   ├── el-shaddai_en.txt
│   └── ...
│
└── data/
    ├── worship_songs.json  ⭐ این فایل کلیدی است!
    └── timepoints/
```

---

## 🔌 مرحله ۲: اتصال به React

### قدم 1: بررسی فایل JSON

باز کنید: `public/worship/data/worship_songs.json`

باید چیزی شبیه این ببینید:

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
    "youtubeId": "jMLhjqlVj5U",
    "audioUrl": "/worship/audio/El_Shaddai.mp3",
    "videoUrl": "https://www.youtube.com/embed/jMLhjqlVj5U",
    "presentationFileUrl": "/worship/pptx/El_Shaddai.pptx",
    "lyrics": {...},
    "tags": ["worship", "praise"]
  }
]
```

### قدم 2: آپدیت ContentContext

فایل: `context/ContentContext.tsx`

**کد فعلی:**
```typescript
// Try to load worship songs from JSON file first
let worshipSongsFromJSON = worshipSongsData;
try {
    const response = await fetch('/data/worship_songs.json');
    ...
```

**تغییر مسیر به:**
```typescript
// Try to load worship songs from JSON file first
let worshipSongsFromJSON = worshipSongsData;
try {
    const response = await fetch('/worship/data/worship_songs.json'); // ✅ مسیر جدید
    if (response.ok) {
        const jsonData = await response.json();
        worshipSongsFromJSON = jsonData;
        console.log('✅ Loaded worship songs from JSON file:', jsonData.length, 'songs');
    }
```

---

## ✅ مرحله ۳: تست و راه‌اندازی

### 1. بیلد پروژه

```bash
npm run build
```

### 2. اجرای dev server (اگر کار می‌کند)

```bash
npm run dev
```

یا بیلد شده را سرو کنید:

```bash
cd dist
python -m http.server 8080
```

### 3. باز کردن در مرورگر

```
http://localhost:8080
```

### 4. رفتن به صفحه Worship

```
http://localhost:8080/#/worship
```

---

## 🎉 انتظار چه چیزی را داریم؟

✅ تمام سرودها نمایش داده می‌شوند  
✅ عکس‌های thumbnail از YouTube  
✅ دکمه Watch on YouTube کار می‌کند  
✅ دکمه "حالت پرزنتیشن" در بالای صفحه  
✅ کلیک روی هر سرود → پخش صوت با highlight کلمات  

---

## 🐛 عیب‌یابی

### ❌ خطا: Cannot find module 'bs4'

```bash
pip install beautifulsoup4
```

### ❌ فایل‌ها کپی نشدند

مسیرها را در اسکریپت چک کنید:
```python
BASE_DIR = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.kalameh.com"
```

### ❌ JSON خالی است

HTML file را چک کنید. باید class `views-accordion-songs_and_video-page-header` داشته باشد.

### ❌ سرودها نمایش داده نمی‌شوند

1. Console browser را باز کنید (F12)
2. ببینید چه خطایی هست
3. مسیر `/worship/data/worship_songs.json` را مستقیماً باز کنید

---

## 📊 آمار انتظاری

بعد از اجرای موفق:

```
✅ استخراج با موفقیت انجام شد!

📊 تعداد کل سرودها: ~200+
📁 مسیر خروجی: public/worship/

📈 آمار:
   🎵 با فایل صوتی:    [تعداد]/[کل]
   📊 با پاورپوینت:    [تعداد]/[کل]
   🎬 با ویدیو یوتیوب: [تعداد]/[کل]
   📝 با متن:          [تعداد]/[کل]
```

---

## 🎯 چک‌لیست نهایی

- [ ] اسکریپت Python اجرا شد
- [ ] فایل `worship_songs.json` ساخته شد
- [ ] فایل‌های MP3 کپی شدند
- [ ] فایل‌های PPTX کپی شدند
- [ ] `ContentContext.tsx` آپدیت شد
- [ ] بیلد موفق بود
- [ ] صفحه Worship باز می‌شود
- [ ] سرودها نمایش داده می‌شوند
- [ ] صوت پخش می‌شود
- [ ] حالت پرزنتیشن کار می‌کند

---

## 🚀 مراحل بعدی (اختیاری)

1. **اضافه کردن timepoints** (برای highlight کلمات):
   - در `public/worship/data/timepoints/`
   - فرمت JSON با زمان‌بندی دقیق

2. **آپلود روی سرور**:
   - فایل‌های MP3 را روی CDN قرار دهید
   - فایل‌های PPTX را آپلود کنید
   - مسیرها را در JSON آپدیت کنید

3. **بهینه‌سازی**:
   - فشرده‌سازی فایل‌های صوتی
   - lazy loading برای تصاویر
   - pagination برای لیست سرودها

---

## 💡 نکات مهم

⚠️ **حجم فایل‌ها**: 1164 MP3 + 729 PPTX حجم زیادی دارند!  
⚠️ **Git**: مطمئن شوید `.gitignore` درست است  
⚠️ **CDN**: برای production از CDN استفاده کنید  
⚠️ **مجوزها**: مطمئن شوید حق استفاده از سرودها را دارید  

---

## 📞 پشتیبانی

اگر مشکلی پیش آمد:

1. لاگ اسکریپت Python را بررسی کنید
2. Console مرورگر را چک کنید
3. Network tab را در DevTools باز کنید
4. مسیر فایل‌ها را دستی تست کنید

---

**آماده برای شروع؟** 🎵  
**دستور بزن:** `cd scripts && run_extractor.bat` 🚀
