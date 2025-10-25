# 🎵 سیستم مدیریت سرودهای پرستشی با تایمینگ خودکار

## ✅ نصب کامل شد!

### 📁 فایل‌های اضافه شده:

1. **`pages/AdminWorshipManagementPage.tsx`** 
   - صفحه مدیریت سرودها برای ادمین
   - آپلود سرود جدید + متن + فایل صوتی
   - لیست تمام سرودها با وضعیت تایمینگ
   - دسترسی به timing recorder

2. **`pages/WorshipSongViewerPage.tsx`**
   - صفحه نمایش سرود با highlight خودکار
   - همگام‌سازی کلمات با صدای خواننده
   - طراحی زیبا با gradient

3. **`public/timing-recorder.html`**
   - ابزار ضبط تایمینگ کلمات
   - تمام قابلیت‌های Context Menu و keyboard shortcuts

---

## 🚀 نحوه استفاده:

### گام 1: دسترسی به بخش ادمین
```
http://localhost:5173/#/admin/worship-management
```

**دسترسی:** SUPER_ADMIN, MANAGER, WORSHIP_LEADER

### گام 2: افزودن سرود جدید
1. کلیک روی "➕ افزودن سرود جدید"
2. پر کردن فرم:
   - 🎵 نام سرود: `الشدای`
   - 🎤 خواننده: `فرشید فتحعلیان`
   - 📁 دسته‌بندی: `پرستش`
   - 📝 متن سرود: (کپی از فایل متنی)
   - 🎧 فایل صوتی: آپلود MP3/WAV
3. کلیک "✅ ذخیره سرود"

### گام 3: ضبط تایمینگ کلمات
1. در لیست سرودها، کلیک "⏱️ ضبط تایمینگ"
2. صفحه timing recorder باز می‌شود (در تب جدید)
3. موزیک را پخش کنید و با **Space** تایمینگ را ثبت کنید
4. بعد از اتمام، کلیک "💾 دریافت JSON"
5. فایل JSON ذخیره می‌شود در:
   ```
   public/worship/data/timings/song_${id}_timing.json
   ```

### گام 4: مشاهده سرود
```
http://localhost:5173/#/worship/1
```
- کلمات خودکار با صدا highlight می‌شوند
- افکت زیبای gradient و animation

---

## 🎹 کلیدهای میانبر در Timing Recorder:

| کلید | عملکرد |
|------|--------|
| **Space** | ثبت کلمه بعدی |
| **R** | تکرار یک کلمه |
| **S** | تکرار یک بخش کامل |
| **J** | پرش به بخش تکراری |
| **A** | اضافه کردن کلمات از زمان فعلی |
| **C** | کپی کلمه انتخاب شده (بعد از راست کلیک) |
| **P** | پلی/پاز |
| **← / →** | جابجایی 5 ثانیه |
| **Ctrl+Z** | برگشت (Undo) |

---

## 📦 ساختار فایل‌ها:

```
Mychurch/
├── pages/
│   ├── AdminWorshipManagementPage.tsx   ✅ صفحه مدیریت
│   └── WorshipSongViewerPage.tsx        ✅ صفحه نمایش
├── public/
│   ├── timing-recorder.html             ✅ ابزار ضبط
│   └── worship/
│       ├── audio/
│       │   └── elshaddai.mp3           (فایل صوتی)
│       └── data/
│           └── timings/
│               └── song_1_timing.json   (تایمینگ)
└── test-timing-recorder.html            (نسخه تست)
```

---

## 🔗 لینک‌های مهم:

### برای ادمین:
- **مدیریت سرودها:** http://localhost:5173/#/admin/worship-management
- **ضبط تایمینگ:** http://localhost:5173/timing-recorder.html

### برای کاربران:
- **نمایش سرود:** http://localhost:5173/#/worship/1
- **لیست سرودها:** http://localhost:5173/#/worship

---

## 🎯 مثال عملی:

### سرود: الشدای

**متن:**
```
V1
[C]الشدا[Dm]ی الشدا[G]ی ، ال الـ[C]ـیون ادونا[F]ی
نام تو[Bb] در بین ما[E7] ، هم در عـ[Am]ـالــم[B/G] اعلــی[C#/A]
```

**فایل صوتی:** `public/worship/audio/elshaddai.mp3`

**تایمینگ (JSON):**
```json
{
  "songId": 1,
  "title": "الشدای",
  "words": [
    {"word": "الشدای", "start": 10.5, "end": 11.2, "index": 0},
    {"word": "الشدای", "start": 11.5, "end": 12.1, "index": 1},
    {"word": "،", "start": 12.1, "end": 12.3, "index": 2}
  ]
}
```

---

## 🌟 ویژگی‌ها:

### برای ادمین:
- ✅ آپلود سرود + متن + صوت
- ✅ ضبط تایمینگ با Space
- ✅ Context Menu (راست کلیک)
- ✅ تکرار بخش‌های Chorus
- ✅ تشخیص Beat بعدی
- ✅ Export JSON

### برای کاربران:
- ✅ Highlight خودکار کلمات
- ✅ همگام‌سازی با صدا
- ✅ طراحی زیبا gradient
- ✅ Animation smooth

---

## 🐛 عیب‌یابی:

### سرود پخش نمی‌شود؟
1. فایل صوتی در `public/worship/audio/` وجود دارد؟
2. مسیر فایل صحیح است؟

### کلمات highlight نمی‌شوند؟
1. فایل JSON تایمینگ وجود دارد؟
2. ساختار JSON صحیح است؟
3. Console را چک کنید (F12)

### دکمه "ضبط تایمینگ" کار نمی‌کند؟
1. صفحه timing-recorder.html در public وجود دارد؟
2. Popup blocker فعال نیست؟

---

## 📊 آمار:

- **تعداد سرودها:** 1 (نمونه)
- **دارای تایمینگ:** 0
- **آماده برای:** 364 سرود دیگر! 🎉

---

## 🚀 بعدی:

1. Backend API برای ذخیره سرودها
2. Database integration
3. User roles (WORSHIP_LEADER)
4. Upload bulk songs
5. Export/Import timing data

---

**توسعه‌دهنده:** GitHub Copilot  
**تاریخ:** 25 اکتبر 2025  
**نسخه:** 1.0
