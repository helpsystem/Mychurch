## v1.0.0-broadcast-hardening

این انتشار با تمرکز بر ارتقای امنیت و پایداری ماژول Broadcast ارائه شده است.
مهم‌ترین اقدامات شامل اعمال کنترل دسترسی نقش‌محور، امن‌سازی مسیر Viewer، محدودسازی نرخ رویدادهای شبکه، و بهبود پایداری همگام‌سازی بین دستگاه‌ها است.

### موارد کلیدی
- اعمال RBAC برای عملیات حساس Presentation
- افزودن لینک امن Viewer با Token امضاشده
- اعتبارسنجی Token در Viewer پیش از فعال‌سازی Sync
- اعمال Rate Limit روی رویدادهای Socket
- اعمال Rate Limit روی صدور Viewer Token
- بهبود پایداری WebSocket Sync هنگام تغییر Session
- تکمیل چک‌لیست E2E پیش از Deploy

### نکات Production
- تنظیم BROADCAST_VIEWER_SECRET
- تنظیم NEXT_PUBLIC_SITE_URL

### مرجع
- Tag: v1.0.0-broadcast-hardening
- Core Commit: 313cc03416b3c4fd34992ec65f17e192bc8b9523
