# Release Notes

## v1.0.0-broadcast-hardening
Published: 2026-03-31
Tag: v1.0.0-broadcast-hardening
Core Commit: 313cc03416b3c4fd34992ec65f17e192bc8b9523

### خلاصه انتشار
این نسخه با هدف افزایش امنیت، پایداری و آمادگی عملیاتی ماژول Broadcast منتشر شده است. محور اصلی تغییرات شامل سخت گیری دسترسی ها، امن سازی لینک Viewer، کنترل نرخ رویدادهای شبکه، و بهبود ثبات همگام سازی در سناریوهای چند دستگاهی است.

### تغییرات کلیدی
- اعمال کنترل دسترسی نقش محور (RBAC) برای عملیات حساس Presentation.
- افزودن مکانیزم تولید لینک امن Viewer بر پایه Token امضاشده.
- اعتبارسنجی Token در صفحه Viewer پیش از فعال شدن مسیر Sync.
- افزودن Rate Limit برای رویدادهای Socket به منظور جلوگیری از Flood.
- افزودن Rate Limit سبک برای Endpoint صدور Viewer Token.
- بهبود پایداری WebSocket Sync هنگام تغییر Session.
- اصلاح چند مورد در Builder و Slide Flow برای رفتار قابل پیش بینی تر.
- اضافه شدن چک لیست E2E جهت آماده سازی پیش از Deploy.

### فایل های اصلی تغییر کرده
- src/actions/presentations.ts
- src/app/api/broadcast/viewer-token/route.ts
- src/app/broadcast/builder/page.tsx
- src/app/broadcast/view/page.tsx
- src/components/broadcast/LiveConsole.tsx
- src/components/broadcast/SlideBuilder.tsx
- src/components/broadcast/hooks/useWebSocketSync.ts
- src/pages/api/socket.ts
- tests/broadcast-e2e-checklist.md

### الزامات محیط Production
- مقدار BROADCAST_VIEWER_SECRET باید به صورت امن تنظیم شود.
- مقدار NEXT_PUBLIC_SITE_URL باید روی دامنه نهایی سرویس تنظیم شود.

### یادداشت عملیاتی
پس از استقرار، اجرای کامل چک لیست موجود در tests/broadcast-e2e-checklist.md برای تایید نهایی توصیه می شود.
