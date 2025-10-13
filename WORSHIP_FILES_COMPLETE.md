# ✅ قابلیت آپلود فایل‌های PowerPoint و PDF برای سرودهای پرستشی

## 📋 خلاصه تغییرات

### 🗄️ تغییرات دیتابیس
✅ **جدول `worship_songs` به‌روزرسانی شد:**
- `presentation_file_url` - لینک فایل PowerPoint
- `pdf_file_url` - لینک فایل PDF  
- `sheet_music_url` - لینک نت موسیقی

### 🔧 تغییرات Backend

#### 1. فایل‌های تغییر یافته:
- ✅ `backend/initDB-postgres.js` - Schema جدید
- ✅ `backend/routes/worshipRoutes.js` - Multer برای آپلود فایل
- ✅ `backend/public/worship-files/` - پوشه ذخیره فایل‌ها

#### 2. API Endpoints جدید:
```javascript
POST   /api/worship-songs/upload-file          // آپلود فایل
DELETE /api/worship-songs/delete-file          // حذف فایل
GET    /api/worship-songs                      // شامل فیلدهای جدید
POST   /api/worship-songs                      // با فیلدهای فایل
PUT    /api/worship-songs/:id                  // با فیلدهای فایل
DELETE /api/worship-songs/:id                  // حذف سرود + فایل‌ها
```

### 🎨 تغییرات Frontend

#### 1. فایل‌های تغییر یافته:
- ✅ `components/EnhancedWorshipSongs.tsx` - دکمه‌های دانلود
- ✅ `types.ts` - فیلدهای جدید در interface

#### 2. قابلیت‌های جدید UI:
- **Grid View:**
  - بخش "فایل‌های قابل دانلود" در پایین هر کارت
  - دکمه‌های رنگی برای PowerPoint (نارنجی)، PDF (بنفش)، نت (سبز)

- **List View:**
  - دکمه Download با dropdown menu
  - نمایش فقط برای سرودهایی که فایل دارند

### 📁 فایل‌های جدید ایجاد شده:

1. ✅ `backend/scripts/migrate-worship-files.js` - Migration script
2. ✅ `backend/public/worship-files/README.txt` - راهنمای پوشه
3. ✅ `WORSHIP_FILES_GUIDE.md` - مستندات کامل

## 🚀 نحوه استفاده

### روش 1: آپلود از طریق API (Postman)

```bash
# 1. آپلود فایل
POST http://localhost:3001/api/worship-songs/upload-file
Authorization: Bearer YOUR_ADMIN_TOKEN
Body: form-data
  key: file
  value: [Select File]

# Response:
{
  "success": true,
  "fileUrl": "/worship-files/1697123456789-987654321.pptx",
  "filename": "original-filename.pptx",
  "size": 2048576
}

# 2. ایجاد سرود با فایل
POST http://localhost:3001/api/worship-songs
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "title": {"fa": "عیسی تو پادشاهی", "en": "Jesus You Are King"},
  "artist": "گروه کلمه",
  "youtubeId": "abc123",
  "presentationFileUrl": "/worship-files/1697123456789-987654321.pptx",
  "pdfFileUrl": "/worship-files/1697123456789-123456789.pdf"
}
```

### روش 2: آپلود دستی فایل‌ها

1. فایل‌های PPTX یا PDF را در `backend/public/worship-files/` قرار دهید
2. سرود را ویرایش کنید و URL فایل را اضافه کنید:

```sql
UPDATE worship_songs 
SET 
  presentation_file_url = '/worship-files/my-song.pptx',
  pdf_file_url = '/worship-files/my-song.pdf'
WHERE id = 1;
```

## 🎯 مثال عملی

### مرحله 1: آپلود فایل PowerPoint
```bash
curl -X POST http://localhost:3001/api/worship-songs/upload-file \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@C:/path/to/song-presentation.pptx"
```

**Response:**
```json
{
  "success": true,
  "fileUrl": "/worship-files/1728814321456-789012345.pptx",
  "filename": "song-presentation.pptx",
  "size": 1024000
}
```

### مرحله 2: ثبت سرود با فایل
```bash
curl -X POST http://localhost:3001/api/worship-songs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": {"fa": "عیسی تو پادشاهی", "en": "Jesus You Are King"},
    "artist": "گروه کلمه",
    "youtubeId": "dQw4w9WgXcQ",
    "lyrics": {"fa": "عیسی تو پادشاهی...", "en": "Jesus you are King..."},
    "presentationFileUrl": "/worship-files/1728814321456-789012345.pptx"
  }'
```

### مرحله 3: مشاهده در سایت
1. به `http://localhost:5173/worship-songs` بروید
2. سرود را پیدا کنید
3. دکمه‌های دانلود (PowerPoint/PDF/Sheet Music) را ببینید
4. کلیک کنید و فایل دانلود می‌شود! 🎉

## 📱 نمایش در UI

### Grid View (حالت کارت):
```
┌─────────────────────────────────┐
│  عیسی تو پادشاهی               │
│  گروه کلمه                      │
│  [▶ Play]  [YouTube]           │
│  ─────────────────────────      │
│  فایل‌های قابل دانلود:         │
│  [📊 PowerPoint] [📄 PDF]      │
└─────────────────────────────────┘
```

### List View:
```
┌────────────────────────────────────────────┐
│ 🎵  عیسی تو پادشاهی - گروه کلمه          │
│     [▶]  [YouTube]  [⬇ Download ▼]       │
│                      ├─ 📊 PowerPoint     │
│                      ├─ 📄 PDF            │
│                      └─ 🎼 Sheet Music    │
└────────────────────────────────────────────┘
```

## 🔒 امنیت

- ✅ فقط SUPER_ADMIN و MANAGER می‌توانند فایل آپلود کنند
- ✅ فیلتر نوع فایل (فقط PPTX, PDF, تصاویر)
- ✅ محدودیت حجم: 50MB
- ✅ نام‌گذاری یکتا با timestamp + random number
- ✅ حذف خودکار فایل‌ها هنگام حذف سرود

## 📊 آمار و اطلاعات

### فیلدهای Database:
| فیلد | نوع | توضیحات |
|------|-----|---------|
| `presentation_file_url` | VARCHAR(500) | مسیر فایل PowerPoint |
| `pdf_file_url` | VARCHAR(500) | مسیر فایل PDF |
| `sheet_music_url` | VARCHAR(500) | مسیر نت موسیقی |

### فرمت‌های مجاز:
- 📊 PowerPoint: `.ppt`, `.pptx`
- 📄 PDF: `.pdf`
- 🖼️ Images: `.jpg`, `.jpeg`, `.png`, `.gif`

### حداکثر حجم:
- 50 MB per file

## ✅ تست سیستم

1. ✅ Migration اجرا شد و فیلدها به database اضافه شدند
2. ✅ پوشه `worship-files` ایجاد شد
3. ✅ API endpoints برای آپلود و حذف آماده است
4. ✅ Frontend دکمه‌های دانلود را نمایش می‌دهد
5. ✅ Server با تغییرات جدید راه‌اندازی شد

## 🎉 وضعیت نهایی

### ✅ کامل شده:
- [x] به‌روزرسانی Schema دیتابیس
- [x] Migration فیلدهای جدید
- [x] ایجاد پوشه ذخیره‌سازی
- [x] API routes برای آپلود فایل
- [x] دکمه‌های دانلود در Frontend
- [x] به‌روزرسانی TypeScript types
- [x] مستندات کامل
- [x] اسکریپت Migration

### 🔄 نیاز به توسعه بیشتر (اختیاری):
- [ ] رابط کاربری ادمین برای آپلود آسان
- [ ] Progress bar برای آپلود
- [ ] پیش‌نمایش فایل‌ها قبل از دانلود
- [ ] فشرده‌سازی خودکار فایل‌های بزرگ
- [ ] آپلود چند فایل همزمان

## 📞 راهنمای سریع

**برای اضافه کردن فایل به سرود موجود:**
```sql
UPDATE worship_songs 
SET presentation_file_url = '/worship-files/your-file.pptx'
WHERE id = YOUR_SONG_ID;
```

**برای دانلود فایل از browser:**
```
http://localhost:3001/worship-files/filename.pptx
```

**برای مشاهده همه فایل‌های آپلود شده:**
```bash
dir "backend\public\worship-files"
```

---

🎊 **تمام! سیستم آپلود و دانلود فایل‌های سرودهای پرستشی آماده است!**
