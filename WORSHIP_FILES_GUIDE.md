# راهنمای آپلود فایل‌های سرودهای پرستشی

## ✅ قابلیت‌های اضافه شده

### 1. فیلدهای جدید در دیتابیس
- `presentation_file_url` - برای فایل‌های PowerPoint (PPTX/PPT)
- `pdf_file_url` - برای فایل‌های PDF (متن سرود، نت، و...)
- `sheet_music_url` - برای نت موسیقی (تصویر یا PDF)

### 2. API Endpoints جدید

#### آپلود فایل:
```
POST /api/worship-songs/upload-file
Headers: Authorization: Bearer <token>
Body: multipart/form-data
  - file: (فایل PPTX, PDF, یا تصویر)

Response:
{
  "success": true,
  "fileUrl": "/worship-files/1697123456789-987654321.pptx",
  "filename": "original-filename.pptx",
  "size": 2048576
}
```

#### حذف فایل:
```
DELETE /api/worship-songs/delete-file
Headers: Authorization: Bearer <token>
Body: {
  "fileUrl": "/worship-files/1697123456789-987654321.pptx"
}
```

#### ایجاد/ویرایش سرود با فایل‌ها:
```
POST /api/worship-songs
PUT /api/worship-songs/:id
Headers: Authorization: Bearer <token>
Body: {
  "title": {"fa": "...", "en": "..."},
  "artist": "...",
  "youtubeId": "...",
  "presentationFileUrl": "/worship-files/...",
  "pdfFileUrl": "/worship-files/...",
  "sheetMusicUrl": "/worship-files/..."
}
```

### 3. نمایش فایل‌ها در Frontend

فایل‌های آپلود شده به صورت خودکار در کارت‌های سرود نمایش داده می‌شوند:

**Grid View:**
- دکمه‌های دانلود در پایین هر کارت
- آیکون‌های رنگی برای هر نوع فایل:
  - 🟧 PowerPoint (نارنجی)
  - 🟪 PDF (بنفش)
  - 🟩 Sheet Music (سبز)

**List View:**
- دکمه Download با منوی dropdown
- کلیک روی هر فایل برای دانلود

## 📝 نحوه استفاده

### روش 1: استفاده از Postman

1. ابتدا یک فایل PowerPoint یا PDF آماده کنید
2. در Postman:
   ```
   POST http://localhost:3001/api/worship-songs/upload-file
   Authorization: Bearer YOUR_ADMIN_TOKEN
   Body → form-data:
     key: file
     value: [انتخاب فایل]
   ```

3. fileUrl دریافتی را کپی کنید

4. سرود را ایجاد/ویرایش کنید:
   ```
   POST http://localhost:3001/api/worship-songs
   Body: {
     "title": {"fa": "عیسی تو پادشاهی", "en": "Jesus You Are King"},
     "artist": "گروه کلمه",
     "youtubeId": "abc123",
     "presentationFileUrl": "/worship-files/1697123456789-987654321.pptx"
   }
   ```

### روش 2: آپلود مستقیم از پنل ادمین (نیاز به توسعه)

برای ایجاد رابط کاربری کامل در پنل ادمین، می‌توانید کامپوننت زیر را بسازید:

```tsx
// components/AdminWorshipSongForm.tsx
import React, { useState } from 'react';

const AdminWorshipSongForm = () => {
  const [presentationFile, setPresentationFile] = useState<File | null>(null);
  
  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/worship-songs/upload-file', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    const data = await response.json();
    return data.fileUrl;
  };
  
  // ... بقیه فرم
};
```

## 🔄 Migration فایل‌های موجود

اگر فایل‌های PowerPoint یا PDF از قبل دارید:

1. فایل‌ها را در `backend/public/worship-files/` قرار دهید
2. URL آن‌ها را در دیتابیس ثبت کنید:

```sql
UPDATE worship_songs 
SET presentation_file_url = '/worship-files/my-song.pptx'
WHERE id = 1;
```

## 🎯 مثال کامل

```bash
# 1. آپلود فایل PowerPoint
curl -X POST http://localhost:3001/api/worship-songs/upload-file \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@عیسی-تو-پادشاهی.pptx"

# Response: {"fileUrl": "/worship-files/1697123456789-987654321.pptx"}

# 2. ایجاد سرود با فایل
curl -X POST http://localhost:3001/api/worship-songs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": {"fa": "عیسی تو پادشاهی", "en": "Jesus You Are King"},
    "artist": "گروه کلمه",
    "youtubeId": "abc123",
    "presentationFileUrl": "/worship-files/1697123456789-987654321.pptx",
    "pdfFileUrl": "/worship-files/1697123456789-123456789.pdf"
  }'
```

## 📋 محدودیت‌ها

- حداکثر حجم فایل: **50MB**
- فرمت‌های مجاز:
  - PowerPoint: `.ppt`, `.pptx`
  - PDF: `.pdf`
  - تصاویر: `.jpg`, `.jpeg`, `.png`, `.gif`

## 🔐 امنیت

- فقط کاربران با نقش SUPER_ADMIN یا MANAGER می‌توانند فایل آپلود کنند
- فایل‌ها با نام یکتا (timestamp + random) ذخیره می‌شوند
- فیلتر نوع فایل برای جلوگیری از آپلود فایل‌های مخرب

## ✅ تست

برای تست کامل سیستم:

1. سرور را راه‌اندازی کنید: `cd backend && npm start`
2. فرانت‌اند را اجرا کنید: `npm run dev`
3. به صفحه سرودها بروید: `http://localhost:5173/worship-songs`
4. سرودهایی که فایل دارند دکمه‌های دانلود نمایش می‌دهند
5. کلیک روی هر دکمه برای دانلود فایل

