# 📁 Worship Files Structure

این پوشه شامل تمام فایل‌های مربوط به سرودهای عبادت است.

## 📂 ساختار پوشه‌ها:

### `/audio/` - فایل‌های صوتی
- فرمت: MP3, WAV, M4A
- نام‌گذاری: `SongName.mp3`
- مثال: `ElShaddai.mp3`, `EyJesusNazdamBia.mp3`

### `/pptx/` - فایل‌های پاورپوینت
- فرمت: PPTX
- نام‌گذاری: `SongName.pptx`
- مثال: `ELSHADDAI.pptx`

### `/videos/` - فایل‌های ویدیو
- فرمت: MP4, WebM
- نام‌گذاری: `SongName.mp4`
- استفاده: برای کپی محلی ویدیوهای یوتیوب

### `/lyrics/` - متن سرودها
- فرمت: TXT
- نام‌گذاری: `SongName_fa.txt`, `SongName_en.txt`
- مثال: `ElShaddai_fa.txt`, `ElShaddai_en.txt`

### `/data/` - داده‌های JSON
- `worship_songs.json` - اطلاعات اصلی سرودها
- `/timepoints/` - فایل‌های زمان‌بندی کلمات
  - نام‌گذاری: `SongName.json`
  - مثال: `ElShaddai.json`

## 🔗 استفاده در کد:

```javascript
// Audio file
audioUrl: "/worship/audio/ElShaddai.mp3"

// PowerPoint file
presentationFileUrl: "/worship/pptx/ELSHADDAI.pptx"

// Video file (local)
videoUrl: "/worship/videos/RealLove.mp4"

// Lyrics
fetch("/worship/lyrics/ElShaddai_fa.txt")

// Timepoints
fetch("/worship/data/timepoints/ElShaddai.json")
```

## 📝 نکات مهم:

1. **نام فایل‌ها**: از حروف انگلیسی و بدون فاصله استفاده کنید
2. **حجم فایل**: فایل‌های صوتی را کمپرس کنید (توصیه: زیر 10MB)
3. **کیفیت صدا**: حداقل 128kbps برای MP3
4. **دسترسی**: مطمئن شوید مجوزهای پوشه درست است (755)

## 🎵 اضافه کردن سرود جدید:

1. فایل صوتی را در `/audio/` قرار دهید
2. متن فارسی و انگلیسی را در `/lyrics/` ذخیره کنید
3. اگر timepoints دارید، در `/data/timepoints/` قرار دهید
4. اطلاعات سرود را در `data/worship_songs.json` اضافه کنید

---

**Created**: 2025-01-24
**Last Updated**: 2025-01-24
