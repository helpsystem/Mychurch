# ⏱️ Timepoints Data

این پوشه شامل فایل‌های JSON زمان‌بندی کلمات (word-level synchronization) است.

## 📝 فرمت فایل:

```json
{
  "songId": 1,
  "title": "Song Name",
  "language": "fa",
  "duration": 245,
  "timepoints": [
    { "time": 0.0, "word": "" },
    { "time": 12.5, "word": "کلمه" },
    { "time": 14.2, "word": "بعدی" }
  ],
  "metadata": {
    "createdBy": "Manual|Auto",
    "createdAt": "2025-01-24",
    "notes": "توضیحات"
  }
}
```

## 🎯 استفاده:

```javascript
fetch('/worship/data/timepoints/SongName.json')
  .then(res => res.json())
  .then(data => {
    // data.timepoints contains word timing
  });
```

## 🛠️ ساخت Timepoints:

### روش دستی:
1. صوت را پخش کنید
2. زمان هر کلمه را یادداشت کنید
3. در فرمت JSON ذخیره کنید

### روش خودکار (در آینده):
- استفاده از Speech-to-Text API
- Forced alignment tools
- Manual editor tool

## 📐 دقت زمان:
- زمان‌ها به ثانیه هستند
- دقت: 0.1 ثانیه (یک رقم اعشار)
- کلمه خالی در ابتدا برای پیش‌درآمد موسیقی

---

**توجه**: این فایل‌ها اختیاری هستند. اگر وجود نداشته باشند، فقط متن کامل نمایش داده می‌شود.
