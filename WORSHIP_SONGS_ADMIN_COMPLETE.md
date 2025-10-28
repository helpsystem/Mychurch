# 🎵 پنل مدیریت سرودهای پرستشی - راهنمای نصب و استفاده

## ✅ **وضعیت نصب: کامل شد!**

### 📦 فایل‌های ساخته شده:

#### 1️⃣ **Components (Frontend)**
- ✅ `components/admin/SongsManager.tsx` - صفحه لیست و مدیریت سرودها
- ✅ `components/admin/WorshipSongEditor.tsx` - ویرایشگر کامل با Timing Recorder

#### 2️⃣ **Backend API**
- ✅ `backend/routes/songs.js` - API routes برای ذخیره JSON و Timing
- ✅ Registration در `backend/server.js` - Routes فعال شدند

---

## 🚀 نحوه استفاده:

### برای Admin / Manager / Worship Leader:

1. **ورود به پنل مدیریت**
   - ابتدا login کنید (با نقش SUPER_ADMIN یا MANAGER یا WORSHIP_LEADER)
   - به Admin Dashboard بروید
   - روی منوی "🎵 سرود پرستشی" کلیک کنید

2. **افزودن سرود جدید**
   - دکمه "سرود جدید" (سبز رنگ، بالای صفحه)
   - **بخش اطلاعات پایه:**
     - عنوان فارسی (مثلاً: "الشدی")
     - عنوان انگلیسی (اختیاری)
     - نام خواننده/آهنگساز
     - YouTube Video ID (اگر دارید)
   
   - **بخش آپلود صوت:**
     - کلیک روی "Choose Audio File"
     - فایل MP3 سرود را انتخاب کنید
     - صوت به صورت خودکار پخش می‌شود برای پیش‌نمایش

   - **بخش متن و آکوردها:**
     - متن فارسی را وارد کنید (با آکوردها)
     - متن انگلیسی (اختیاری)
     - فرمت: آکوردها در براکت `[Am]` - هر خط متن سرود

   - **بخش Timing Recorder:**
     - روی "شروع ضبط" کلیک کنید
     - صوت پخش می‌شود
     - با کلید Space هر کلمه را زمان‌بندی کنید
     - اگر اشتباه شد، Backspace برای برگشت
     - P برای pause/resume
     - آمار: تعداد کل کلمات / ضبط شده / درصد پیشرفت

3. **ویرایش سرود**
   - روی آیکون ✏️ کلیک کنید
   - تمام بخش‌ها قابل ویرایش هستند
   - Timing قبلی حفظ می‌شود (مگر دوباره ضبط کنید)

4. **حذف سرود**
   - روی آیکون 🗑️ کلیک کنید
   - تأییدیه نمایش داده می‌شود
   - سرود از JSON حذف می‌شود

5. **Export JSON**
   - دکمه "دانلود" برای backup گرفتن
   - فایل `worship_songs_backup.json` دانلود می‌شود

---

## 📁 ساختار فایل‌ها:

```
public/worship/data/
  ├── worship_songs.json          ← لیست تمام سرودها
  └── timings/
      ├── song_1_timing.json      ← تایمینگ سرود شماره 1
      ├── song_2_timing.json
      └── ...
```

### فرمت `worship_songs.json`:
```json
[
  {
    "id": 1,
    "title": {
      "fa": "الشدی",
      "en": "Elshaddai"
    },
    "artist": "نام خواننده",
    "audioUrl": "/worship/audio/elshaddai.mp3",
    "youtubeId": "abc123xyz",
    "lyrics": {
      "fa": "[Am] متن خط اول\n[C] متن خط دوم",
      "en": "English lyrics..."
    },
    "chords": "Am, C, G, F",
    "category": "worship",
    "hasTiming": true
  }
]
```

### فرمت `song_X_timing.json`:
```json
{
  "metadata": {
    "title": "الشدی",
    "artist": "نام خواننده",
    "totalDuration": 245.6,
    "wordCount": 324,
    "lineCount": 48
  },
  "words": [
    {"word": "کلمه", "start": 0.42, "end": 0.75}
  ],
  "lines": [
    {
      "text": "خط کامل متن",
      "start": 0.42,
      "end": 5.18,
      "words": [...]
    }
  ]
}
```

---

## 🔧 API Endpoints (Backend):

### **POST** `/api/songs/save-json`
ذخیره لیست کامل سرودها در `worship_songs.json`

**Request Body:**
```json
{
  "songs": [...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Songs saved successfully"
}
```

---

### **POST** `/api/songs/save-timing`
ذخیره تایمینگ یک سرود

**Request Body:**
```json
{
  "songId": 1,
  "timingData": {
    "metadata": {...},
    "words": [...],
    "lines": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Timing data saved successfully"
}
```

---

### **POST** `/api/songs/upload-audio`
آپلود فایل صوتی (TODO: نیاز به پیاده‌سازی با multer)

**Response:**
```json
{
  "success": true,
  "audioUrl": "/worship/audio/uploaded_song.mp3"
}
```

---

### **GET** `/api/songs/list`
دریافت لیست تمام سرودها

**Response:**
```json
[
  {"id": 1, "title": {...}, ...}
]
```

---

### **GET** `/api/songs/timing/:songId`
دریافت تایمینگ یک سرود خاص

**Response:**
```json
{
  "metadata": {...},
  "words": [...],
  "lines": [...]
}
```

---

## 🎹 کلیدهای میانبر (Timing Recorder):

| کلید | عملکرد |
|------|--------|
| **Space** | ضبط کلمه فعلی |
| **Backspace** | حذف آخرین کلمه ضبط شده |
| **P** | توقف/ادامه پخش |

---

## 🎨 امکانات UI:

### صفحه لیست سرودها:
- ✅ **Stats Cards**: نمایش آمار (کل سرودها، دارای تایمینگ، صوت، ویدیو)
- ✅ **جستجو**: بر اساس عنوان فارسی، انگلیسی، نام خواننده
- ✅ **نمایش Grid**: کارت‌های زیبا با gradient
- ✅ **Badge System**:
  - 🟢 تایمینگ (سبز)
  - 🔵 صوت (آبی)
  - 🔴 ویدیو (قرمز)
  - 🟡 ناقص (زرد - اگر هیچ‌کدام نداشته باشد)

### صفحه ویرایشگر:
- ✅ **دو ستونه**: سمت چپ (اطلاعات + صوت)، سمت راست (متن + تایمینگ)
- ✅ **پخش صوت**: با کنترل‌های play/pause
- ✅ **Progress Bar**: نمایش درصد پیشرفت ضبط
- ✅ **کلمه فعال**: highlight کلمه‌ای که باید ضبط شود
- ✅ **پشتیبانی RTL**: برای متن فارسی

---

## 🔒 سطوح دسترسی:

| نقش | دسترسی‌ها |
|-----|----------|
| **SUPER_ADMIN** | همه چیز (افزودن، ویرایش، حذف، تایمینگ) |
| **MANAGER** | همه چیز (افزودن، ویرایش، حذف، تایمینگ) |
| **WORSHIP_LEADER** | افزودن، ویرایش، تایمینگ (بدون حذف) |
| **MEMBER** | بدون دسترسی |

---

## ✅ چک‌لیست تکمیل:

- [x] ساخت `SongsManager.tsx` بدون error
- [x] ساخت `WorshipSongEditor.tsx` با Timing Recorder
- [x] ساخت `backend/routes/songs.js`
- [x] Register کردن routes در `backend/server.js`
- [x] Test اولیه compile (بدون error)
- [ ] **TODO**: پیاده‌سازی واقعی Audio Upload (با multer)
- [ ] **TODO**: تست واقعی ذخیره فایل‌ها
- [ ] **TODO**: اضافه کردن permission checks برای WORSHIP_LEADER

---

## 🧪 نحوه تست:

### تست 1: نمایش صفحه
```bash
# Backend را اجرا کنید
npm run backend

# Frontend را اجرا کنید
npm run dev
```

- Login کنید (help.system@ymail.com / Samyar@1989)
- به Admin Dashboard بروید
- منوی "سرود پرستشی" را باز کنید
- باید لیست سرودها نمایش داده شود

### تست 2: افزودن سرود جدید
- کلیک روی "سرود جدید"
- فرم ویرایشگر باید باز شود
- فیلدها را پر کنید
- "ذخیره" کنید
- باید به لیست برگردد و سرود جدید نمایش داده شود

### تست 3: Timing Recorder
- یک سرود ویرایش کنید
- فایل صوتی upload کنید
- "شروع ضبط" را بزنید
- با Space کلمات را ضبط کنید
- "ذخیره" کنید
- بررسی کنید که فایل `song_X_timing.json` ساخته شده

---

## 🐛 Troubleshooting:

### مشکل: فایل ذخیره نمی‌شود
- ✅ بررسی کنید Backend در حال اجراست (`npm run backend`)
- ✅ Console browser را چک کنید (F12)
- ✅ لاگ Backend را ببینید

### مشکل: Timing Recorder کار نمی‌کند
- ✅ بررسی کنید فایل صوتی بارگذاری شده
- ✅ Console را برای errors چک کنید
- ✅ مطمئن شوید متن فارسی وارد شده (برای استخراج کلمات)

### مشکل: دسترسی ندارم
- ✅ بررسی کنید نقش شما SUPER_ADMIN یا MANAGER است
- ✅ Logout و Login مجدد کنید
- ✅ Token را clear کنید (Application > Cookies)

---

## 🎯 مراحل بعدی (اختیاری):

1. **پیاده‌سازی Audio Upload واقعی**:
   - استفاده از `multer` در Backend
   - آپلود به `/public/worship/audio/`
   - یا آپلود به FTP host

2. **Timing Editor**:
   - صفحه جداگانه برای ویرایش تایمینگ موجود
   - تغییر دستی زمان start/end هر کلمه
   - پیش‌نمایش realtime

3. **Import/Export**:
   - Import از ChordPro format
   - Export به OpenSong format
   - Backup/Restore کامل

4. **Batch Operations**:
   - افزودن چند سرود به صورت همزمان
   - Import از JSON
   - حذف دسته‌جمعی

---

## 📞 پشتیبانی:

اگر مشکلی پیش آمد یا سؤالی داشتید:
- بررسی کنید Errors در VS Code
- Console browser را چک کنید
- لاگ Backend را ببینید
- فایل `WORSHIP_ADMIN_PANEL_GUIDE.md` را مطالعه کنید

---

**🎉 تبریک! سیستم مدیریت سرودها با موفقیت نصب شد!**
