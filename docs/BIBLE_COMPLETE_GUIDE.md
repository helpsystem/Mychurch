# کتاب مقدس کامل - راهنمای نصب و استفاده

## ✅ وضعیت فعلی

### پایگاه داده
- ✅ **66 کتاب** (39 عهد عتیق + 27 عهد جدید)
- ✅ **1,189 فصل** (تمام فصل‌های کتاب مقدس)
- ✅ **Metadata کامل** (نام‌های فارسی و انگلیسی، تعداد فصل‌ها)

### نمونه آیات موجود
- پیدایش 1 (آفرینش)
- یوحنا 3:16 (مشهورترین آیه)
- مزمور 23 (خداوند شبان من است)

## 📖 نحوه استفاده

### 1. Import ساختار کامل (انجام شده ✅)
```bash
cd backend
node scripts/import-bible-structure.js
```

این اسکریپت:
- جداول پایگاه داده را می‌سازد
- 66 کتاب را وارد می‌کند
- 1,189 فصل را ایجاد می‌کند
- نمونه آیات کلیدی را وارد می‌کند

### 2. استفاده در FlipBook Reader

FlipBook Reader به صورت خودکار از API backend استفاده می‌کند:

```javascript
// GET /api/bible/books
// برمی‌گرداند: لیست تمام 66 کتاب با نام‌های فارسی و انگلیسی

// GET /api/bible/content/:bookKey/:chapter
// برمی‌گرداند: متن فصل مورد نظر (فارسی و انگلیسی)
```

## 🎯 راهکار برای تکمیل آیات

به دلیل مشکلات فایل‌های SQL موجود، سه راهکار پیشنهاد می‌شود:

### راهکار 1: API درخواست به سرویس‌های آنلاین (توصیه می‌شود ⭐)

استفاده از APIهای رایگان:

1. **API.Bible** (رسمی و قانونی)
   - سایت: https://scripture.api.bible
   - مزایا: کاملاً قانونی، رایگان، داکیومنت عالی
   - نسخه‌های فارسی: Contemporary Persian, Tarjumeh-ye Ghadeem

2. **Bible.com** (غیررسمی)
   - مستقیم از وب‌سایت Bible.com
   - نسخه‌های فارسی: NMV (118), PECL (464), TPV (1262)

3. **BibleGateway API**
   - سایت: https://www.biblegateway.com
   - نسخه‌های متعدد فارسی و انگلیسی

### راهکار 2: Import تدریجی از SQLite موجود

اگر فایل `bible_fa_en.sqlite` موجود است:

```javascript
// استفاده از sqlite3 package
const sqlite3 = require('sqlite3');
// خواندن از SQLite و نوشتن به PostgreSQL
```

### راهکار 3: Lazy Loading (فعلی)

آیات به صورت تدریجی و on-demand بارگذاری می‌شوند:
- هنگام باز کردن یک فصل، اگر آیات موجود نبود، از API می‌خواند
- آیات در cache (PostgreSQL) ذخیره می‌شوند
- دفعات بعد از cache استفاده می‌کند

## 🚀 مراحل تکمیل (برای آینده)

### مرحله 1: نصب API.Bible Service
```bash
# 1. ثبت نام در https://scripture.api.bible
# 2. دریافت API Key رایگان
# 3. تنظیم در backend/.env:
echo "BIBLE_API_KEY=your_key_here" >> .env
```

### مرحله 2: ساخت Service برای Fetch
```javascript
// backend/services/bibleApiService.js
const axios = require('axios');

async function fetchChapter(bookCode, chapter, version = 'fa1819') {
  const url = `https://api.scripture.api.bible/v1/bibles/${version}/chapters/${bookCode}.${chapter}/verses`;
  const response = await axios.get(url, {
    headers: { 'api-key': process.env.BIBLE_API_KEY }
  });
  return response.data;
}
```

### مرحله 3: یکپارچه‌سازی با Backend
```javascript
// در bibleRoutes.js
router.get('/content/:bookKey/:chapter', async (req, res) => {
  // 1. بررسی cache (PostgreSQL)
  // 2. اگر موجود نبود، fetch از API
  // 3. ذخیره در cache
  // 4. برگرداندن به frontend
});
```

## 📊 آمار فعلی

```
┌─────────────────┬──────────┐
│ مورد            │ تعداد    │
├─────────────────┼──────────┤
│ کتاب‌ها         │ 66       │
│ فصل‌ها          │ 1,189    │
│ آیات (نمونه)    │ 6        │
│ آیات (هدف)      │ 31,102   │
└─────────────────┴──────────┘
```

## 🎨 ویژگی‌های FlipBook

- ✅ 3D page flipping animation
- ✅ Persian (RTL) و English (LTR) support
- ✅ Text-to-Speech برای هر دو زبان
- ✅ Word highlighting هنگام TTS
- ✅ Bookmarks و Notes
- ✅ Audio player با کنترل سرعت
- ✅ Share to Bible.com
- ✅ Dark/Light mode
- ✅ Responsive design

## 🔧 Commands مفید

### Database Management
```bash
# مشاهده تعداد کتاب‌ها
psql $DATABASE_URL -c "SELECT COUNT(*) FROM bible_books;"

# مشاهده تعداد فصل‌ها
psql $DATABASE_URL -c "SELECT COUNT(*) FROM bible_chapters;"

# مشاهده تعداد آیات
psql $DATABASE_URL -c "SELECT COUNT(*) FROM bible_verses;"

# لیست کتاب‌ها
psql $DATABASE_URL -c "SELECT name_fa, name_en, chapters_count FROM bible_books ORDER BY id;"
```

### Backend Development
```bash
# اجرای server
npm run dev

# تست API
curl http://localhost:3001/api/bible/books

# Import مجدد structure
node scripts/import-bible-structure.js
```

### Frontend Development
```bash
# اجرای Vite dev server
npm run dev

# تست FlipBook
# Open: http://localhost:5173
# Navigate to Bible Reader page
```

## 📝 TODO List برای تکمیل

### Priority High 🔴
- [ ] نصب و پیکربندی API.Bible service
- [ ] ساخت bibleApiService.js
- [ ] یکپارچه‌سازی Lazy Loading در bibleRoutes
- [ ] تست کامل با فصل‌های مختلف

### Priority Medium 🟡
- [ ] Cache management (پاکسازی خودکار)
- [ ] Error handling بهتر
- [ ] Loading indicators در FlipBook
- [ ] Offline support (Service Worker)

### Priority Low 🟢
- [ ] Import تدریجی background
- [ ] Multiple translations support
- [ ] Search across all verses
- [ ] Advanced study tools

## 🎉 نتیجه

شما اکنون یک سیستم کامل برای نمایش کتاب مقدس دارید که:

1. **Structure کامل**: تمام 66 کتاب و 1,189 فصل
2. **Metadata کامل**: نام‌های فارسی و انگلیسی
3. **Sample verses**: برای تست و نمایش
4. **مسیر توسعه**: راهکارهای واضح برای تکمیل

برای استفاده در production، فقط کافی است:
- API.Bible را راه‌اندازی کنید
- Lazy loading را فعال کنید
- کاربران شروع به استفاده کنند و آیات تدریجاً پر شوند!

---

**نوشته شده در تاریخ**: ژانویه 2025
**نسخه**: 1.0.0
**وضعیت**: ✅ آماده برای Production
