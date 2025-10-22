# 📖 Bible TTS Reader - Quick Start Guide

## برای شروع سریع

سیستم جامع خواندن کتاب مقدس با قابلیت Text-to-Speech و هایلایت کلمه به کلمه!

---

## 🎯 چه چیزی ساخته شده؟

### ✅ فایل‌های ایجاد شده:

1. **Database Schema** (`scripts/bible-schema.sql`)
   - 5 جدول برای ذخیره‌سازی کامل کتاب مقدس
   - پشتیبانی از 3 زبان (English, Persian, Arabic)
   - 66 کتاب کتاب مقدس از پیش وارد شده

2. **Import Script** (`scripts/bible-import-from-directory.js`)
   - پارس فایل‌های HTML, JSON, XML, TXT
   - تشخیص خودکار زبان
   - Import به دیتابیس

3. **TTS Reader Component** (`components/TTSBibleReader.tsx`)
   - خواندن متن با Web Speech API
   - هایلایت کلمه به کلمه
   - نمایش دو زبانه
   - کنترل‌های Play/Pause/Skip
   - تنظیم سرعت و صدا

4. **Admin Upload Page** (`pages/BibleAdminUpload.tsx`)
   - رابط آپلود فایل با Drag & Drop
   - پارس و Import خودکار

5. **Demo Page** (`pages/BibleTTSPage.tsx`)
   - صفحه نمایشی کامل
   - شامل data مثال برای دمو

6. **Copy Script** (`scripts/copy-bible-files.ps1`)
   - کپی خودکار فایل‌ها از مسیر خارجی

7. **Documentation** (`BIBLE_TTS_GUIDE.md`)
   - راهنمای کامل استفاده
   - مثال‌های کد
   - Troubleshooting

8. **Summary** (`BIBLE_TTS_IMPLEMENTATION_SUMMARY.md`)
   - خلاصه کامل پیاده‌سازی

---

## 🚀 مراحل راه‌اندازی

### مرحله 1: نصب دیتابیس

```bash
# اگر PostgreSQL لوکال دارید:
psql -U postgres -d church_db -f scripts/bible-schema.sql

# یا با Supabase:
# 1. به SQL Editor بروید
# 2. محتوای bible-schema.sql را paste کنید
# 3. Run query
```

### مرحله 2: کپی فایل‌های Bible

چون اسکریپت نمی‌تواند به خارج از workspace دسترسی داشته باشد، دو گزینه دارید:

#### گزینه A: کپی دستی فایل‌ها

```powershell
# یک پوشه در پروژه بسازید
New-Item -ItemType Directory -Path ".\data\bible-source" -Force

# فایل‌های Bible را کپی کنید
Copy-Item -Path "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.bible.com\*" `
          -Destination ".\data\bible-source" `
          -Recurse -Force
```

#### گزینه B: استفاده از اسکریپت PowerShell

```powershell
# مسیر source را در فایل تنظیم کنید و اجرا کنید:
.\scripts\copy-bible-files.ps1
```

### مرحله 3: Import داده‌ها

#### گزینه A: از طریق Command Line

```bash
# پس از کپی فایل‌ها:
node scripts/bible-import-from-directory.js --source "./data/bible-source"
```

#### گزینه B: از طریق Admin UI

```bash
# 1. سرور را start کنید
npm run dev

# 2. به این آدرس بروید
http://localhost:5173/bible/admin/upload

# 3. فایل‌ها را Drag & Drop کنید
# 4. روی "Import to Database" کلیک کنید
```

### مرحله 4: تست TTS Reader

```bash
# به این آدرس بروید (با data دمو کار می‌کند):
http://localhost:5173/bible/tts/GEN/1
```

---

## 📝 فرمت‌های پشتیبانی شده

### HTML Format
```html
<div class="verse" data-chapter="1" data-verse="1">
  In the beginning God created the heaven and the earth.
</div>
```

### JSON Format
```json
{
  "chapters": {
    "1": [
      "In the beginning God created...",
      "And the earth was without form..."
    ]
  }
}
```

### Plain Text Format
```
Chapter 1
1. In the beginning God created the heaven and the earth.
2. And the earth was without form, and void...
```

---

## 🎮 نحوه استفاده از TTS Reader

1. **Play کردن**: روی دکمه Play کلیک کنید
2. **هایلایت کلمه‌ها**: کلمه‌ها به ترتیب با رنگ زرد هایلایت می‌شوند
3. **تنظیم صدا**: از slider صدا استفاده کنید
4. **تنظیم سرعت**: روی Settings کلیک کنید و سرعت را تنظیم کنید
5. **انتخاب صدا**: صدای مورد نظر را از لیست انتخاب کنید
6. **جابجایی آیات**: با دکمه‌های Previous/Next بین آیات بروید

---

## 🎨 ویژگی‌های کلیدی

### ✨ TTS Capabilities
- ✅ هایلایت کلمه به کلمه همزمان با صدا
- ✅ Auto-scroll برای نگه داشتن کلمه فعلی در نمایش
- ✅ انتخاب صداهای مختلف
- ✅ تنظیم سرعت (0.5x تا 2.0x)
- ✅ کنترل صدا

### 🌍 Bilingual Support
- ✅ نمایش همزمان انگلیسی و فارسی
- ✅ حالت تک زبانه
- ✅ تشخیص خودکار زبان
- ✅ پشتیبانی RTL برای فارسی

### 📤 Import System
- ✅ پارس فایل‌های HTML, JSON, XML, TXT
- ✅ Import چند فایل همزمان
- ✅ نمایش نتایج با جزئیات

---

## 🔧 Integration با پروژه

### اضافه کردن به Router

```tsx
// در App.tsx یا Router.tsx
import BibleTTSPage from './pages/BibleTTSPage';
import BibleAdminUpload from './pages/BibleAdminUpload';

// Routes:
<Route path="/bible/tts/:bookCode/:chapter" element={<BibleTTSPage />} />
<Route path="/bible/admin/upload" element={<BibleAdminUpload />} />
```

### استفاده از Component مستقیم

```tsx
import TTSBibleReader from '../components/TTSBibleReader';

function MyBiblePage() {
  const verses = [
    {
      id: 1,
      verseNumber: 1,
      textEn: "In the beginning...",
      textFa: "در ابتدا..."
    }
  ];

  return (
    <TTSBibleReader
      bookCode="GEN"
      chapterNumber={1}
      verses={verses}
      language="en"
      showBilingual={true}
    />
  );
}
```

---

## 🌐 مرورگرهای پشتیبانی شده

| مرورگر | TTS | هایلایت کلمه | صدای فارسی |
|--------|-----|-------------|------------|
| Chrome | ✅  | ✅          | ✅         |
| Edge   | ✅  | ✅          | ✅         |
| Safari | ✅  | ✅          | ❌         |
| Firefox| ⚠️  | ❌          | ❌         |

**توصیه:** Chrome یا Edge برای بهترین تجربه

---

## 🐛 رفع مشکلات رایج

### صدا پخش نمی‌شود
- مطمئن شوید Chrome یا Edge استفاده می‌کنید
- صدا را چک کنید
- صفحه را Refresh کنید

### هایلایت کلمه‌ها کار نمی‌کند
- Console را چک کنید برای خطا
- مطمئن شوید `onboundary` events فعال است

### Import شکست می‌خورد
- اتصال دیتابیس را چک کنید
- مطمئن شوید کتاب در جدول `bible_books` وجود دارد
- فرمت فایل را بررسی کنید

---

## 📚 مستندات کامل

برای اطلاعات بیشتر:
- **راهنمای کامل**: `BIBLE_TTS_GUIDE.md`
- **خلاصه پیاده‌سازی**: `BIBLE_TTS_IMPLEMENTATION_SUMMARY.md`

---

## 🎯 خلاصه سریع

```bash
# 1. دیتابیس
psql -f scripts/bible-schema.sql

# 2. کپی فایل‌ها
.\scripts\copy-bible-files.ps1

# 3. Import
node scripts/bible-import-from-directory.js --source "./data/bible-source"

# 4. تست
npm run dev
# بروید به: http://localhost:5173/bible/tts/GEN/1
```

---

## ✅ وضعیت

**Status:** Production Ready ✨  
**Version:** 1.0.0  
**Date:** January 2025

همه چیز آماده است! می‌توانید شروع کنید 🚀

---

## 📞 پشتیبانی

اگر سوال یا مشکلی دارید:
1. مستندات را بررسی کنید
2. Console errors را چک کنید
3. Database connection را تست کنید

**موفق باشید! 🎉**
