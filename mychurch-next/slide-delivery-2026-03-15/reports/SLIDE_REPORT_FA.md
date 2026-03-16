# گزارش کامل بخش اسلاید (Broadcast / Presentation)

تاریخ: 2026-03-15

## فایل‌های تجمیع‌شده
این فایل‌ها در پوشه `files` قرار گرفته‌اند:
- types.ts
- SlideBuilder.tsx
- WorshipSongSelector.tsx
- BroadcastViewerPage.tsx

## قابلیت‌های پیاده‌سازی‌شده

### 1) اسلاید آیه به‌صورت دوزبانه (فارسی/انگلیسی)
- نمایش همزمان متن فارسی و انگلیسی برای بازه آیات (مثال: پیدایش 10 تا 12)
- ذخیره اطلاعات بازه و عنوان دوزبانه برای نمایش حرفه‌ای

### 2) Popup شیشه‌ای (Glass Bubble) برای آیات
- اضافه شدن Popup حرفه‌ای با پس‌زمینه شیشه‌ای/Blur
- نمایش دو ستونه FA/EN برای بازه انتخاب‌شده
- دکمه باز/بستن Popup روی Viewer

### 3) اسلاید سرود پرستشی حرفه‌ای برای صفحه دوم (پروژکتور)
- استفاده از SmartWorshipPlayer برای مسیر حرفه‌ای (زمان‌بندی + پخش)
- ذخیره عنوان فارسی/انگلیسی سرود
- ذخیره خطوط انگلیسی (`lyricsEnLines`) برای نمایش دوزبانه

### 4) Popup شیشه‌ای (Glass Bubble) برای سرود
- در حالت سرود، Popup دوزبانه FA/EN قابل فعال‌سازی است
- در صورت وجود متن انگلیسی، روبه‌روی فارسی نمایش داده می‌شود

### 5) بهبود Slide Thumbnails در پنل اسلاید
- Thumbnail اسلاید آیه و سرود دوزبانه شده (FA + EN)
- شناسایی سریع‌تر اسلایدها در مدیریت جلسه

## تغییرات دیتامدل
در `types.ts` فیلدهای زیر اضافه شد:

### ScripturePage
- `glassPopupEnabled?: boolean`
- `popupLabelFa?: string`
- `popupLabelEn?: string`

### SlideContentLyrics
- `titleFa?: string`
- `titleEn?: string`
- `lyricsEnLines?: string[]`
- `glassPopupEnabled?: boolean`

## نتیجه فنی
- Build پروژه با موفقیت انجام شده
- خطای TypeScript/React برای فایل‌های تغییر یافته گزارش نشده

## مسیر استفاده
- پنل ادمین Broadcast: `/#/admin/broadcast`
- صفحه نمایشگر (پروژکتور): `/#/broadcast/view?session=...`

## الهام قابلیت‌ها از ریپوهای مرجع
- presenton/presenton: UX ارائه حرفه‌ای، قالب نمایش حرفه‌ای
- Office-PowerPoint-MCP-Server: ساختار ماژولار و داده‌محور برای Presentation

## یادداشت
این بسته صرفاً تجمیع فایل‌ها و گزارش برای بخش اسلاید است تا یکجا قابل بررسی، آرشیو و تحویل باشد.
