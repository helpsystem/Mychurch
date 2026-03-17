# گزارش معماری سیستم MyChurch

این سند، تصویر کلی معماری پروژه MyChurch را برای تیم توسعه و نگهداری ثبت می‌کند.

## ۱) فرانت‌اِند (Frontend)

### بخش اصلی (Next.js 14)
- مسئول: صفحات لایو، مدیریت محتوای جدید، و جریان اصلی تجربه کاربری.
- آدرس لایو: https://samanabyar.online
- تکنولوژی‌ها: React 18, Next.js 14, Tailwind CSS, TypeScript
- مسیر محلی: `d:\...\Git\Mychurch\mychurch-next`

### بخش قدیمی (Legacy Vite)
- کاربرد: پنل‌ها/ماژول‌های قدیمی یا خاص (Legacy).
- تکنولوژی‌ها: Vite, React, Tailwind CSS
- مسیر محلی: `d:\...\Git\Mychurch\frontend`

## ۲) بک‌اِند (Backend)

معماری بک‌اِند به‌صورت **توزیع‌شده** پیاده‌سازی شده است:

### سرور رابط (Next.js API Routes & Server Actions)
- محل اجرای بخش مهمی از منطق کسب‌وکار.
- احراز هویت و تعامل مستقیم با دیتابیس.
- ارائه endpointهای اپلیکیشن از داخل Next.js.

### همگام‌سازی لحظه‌ای (Realtime)
- WebSocket مبتنی بر Socket.IO برای همگام‌سازی اسلایدها.
- مسیر: `/api/socket`

### سرور سرویس‌های داده (Express.js)
- کاربرد: پردازش‌های سنگین‌تر مانند دیتای کتاب‌مقدس و سرویس‌های TTS.
- مسیر محلی: `d:\...\Git\Mychurch\backend`
- فایل اصلی: `server.js`

## ۳) پایگاه‌داده (Database)

### دیتابیس اصلی (Supabase / PostgreSQL)
- نقش: ذخیره‌سازی اطلاعات کاربران، سرودها، اسلایدها و تنظیمات کلیسا.
- URL پروژه: https://xjliwbfdzmxncyebblxw.supabase.co
- نوع: PostgreSQL (Cloud Hosted)

### دیتابیس محلی (SQLite)
- نقش: کش و نگهداری دیتای حجیم کتاب‌مقدس روی سرور اختصاصی.
- فایل: `church.db` (در پوشه backend)

## ۴) سرویس‌های خارجی و API

| سرویس | کاربرد | آدرس/جزئیات |
|---|---|---|
| Supabase | دیتابیس و مدیریت فایل | supabase.com |
| Gemini AI | هوش مصنوعی و پردازش متن | Google AI Studio |
| Resend | ارسال ایمیل‌های سیستمی | resend.com |
| Gmail SMTP | بک‌آپ ارسال ایمیل | iranianchurchdc.us@gmail.com |
| Replicate | تولید تصاویر AI | replicate.com |

## ۵) مسیرهای مهم سیستمی (Endpoints)

- مدیریت پخش (Live Console): `/broadcast`
- نمایشگر هوشمند (Projector View): `/broadcast/view`
- مدیریت اسناد (Documents): `/documents`
- گالری تصاویر: `/gallery`
- کتاب‌مقدس: `/bible`

## ۶) ساختار مخزن و تمرکز توسعه

- تمام کدهای پروژه در مخزن اصلی `Git\Mychurch` متمرکز هستند.
- برای تغییرات فرانت‌اِند، تمرکز اصلی روی پوشه `mychurch-next` است.

---

## یادداشت نگهداری

این سند به‌عنوان مرجع معماری عمل می‌کند و باید در صورت تغییر سرویس‌ها، endpointها یا توپولوژی استقرار به‌روزرسانی شود.