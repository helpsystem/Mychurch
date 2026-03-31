# Release Notes

## v1.0.0-broadcast-hardening
Date: 2026-03-31
Tag: v1.0.0-broadcast-hardening
Commit: 313cc03416b3c4fd34992ec65f17e192bc8b9523

### Summary
این نسخه تمرکز کامل روی سخت‌سازی ماژول Broadcast دارد: کنترل دسترسی، لینک امن Viewer، محدودسازی رویدادهای Socket، و پایداری Sync.

### Changes
- RBAC برای عملیات Presentation اضافه شد.
- صدور لینک امن Viewer با Token امضاشده اضافه شد.
- اعتبارسنجی Token در صفحه Viewer قبل از فعال شدن Sync اضافه شد.
- Rate limit برای رویدادهای Socket اضافه شد.
- Rate limit سبک برای صدور Token Viewer اضافه شد.
- پایداری WebSocket Sync در تغییر Session بهبود داده شد.
- چند بهبود Builder و Slide flow اعمال شد.
- چک‌لیست E2E برای تست پیش از Deploy اضافه شد.

### Files
- src/actions/presentations.ts
- src/app/api/broadcast/viewer-token/route.ts
- src/app/broadcast/builder/page.tsx
- src/app/broadcast/view/page.tsx
- src/components/broadcast/LiveConsole.tsx
- src/components/broadcast/SlideBuilder.tsx
- src/components/broadcast/hooks/useWebSocketSync.ts
- src/pages/api/socket.ts
- tests/broadcast-e2e-checklist.md

### Notes
- برای امنیت بهتر در Production مقدار `BROADCAST_VIEWER_SECRET` را تنظیم کنید.
- برای لینک‌های صحیح Viewer مقدار `NEXT_PUBLIC_SITE_URL` را تنظیم کنید.
