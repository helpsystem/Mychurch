# 🚀 راهنمای سریع توسعه (Development Guide)

## ⚡ شروع سریع (Quick Start)

### روش 1: استفاده از فایل Batch (ساده‌ترین روش)

دوبار کلیک روی فایل:
```
start-dev.bat
```

این فایل به صورت خودکار:
- ✅ تمام سرورهای قبلی رو متوقف می‌کنه
- ✅ Backend و Frontend رو باهم اجرا می‌کنه
- ✅ لینک‌های دسترسی رو نمایش می‌ده

### روش 2: استفاده از PowerShell

```powershell
.\start-dev.ps1
```

### روش 3: استفاده از npm (دستی)

```bash
npm run dev:full
```

این دستور هر دو سرور (Backend + Frontend) رو باهم اجرا می‌کنه.

## 🌐 آدرس‌های دسترسی

بعد از اجرای سرورها:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Bible Reader**: http://localhost:5173/bible-reader
- **Health Check**: http://localhost:3001/api/health

## 🛑 توقف سرورها

برای توقف سرورها:
- در ترمینال/CMD: `Ctrl + C`
- یا ببندید پنجره ترمینال رو

## 📝 اسکریپت‌های موجود

```json
{
  "dev": "فقط Frontend (Vite)",
  "backend": "فقط Backend (Node.js)",
  "dev:all": "Frontend + Backend (با kill on fail)",
  "dev:full": "Frontend + Backend (با رنگ‌بندی و نام)"
}
```

## 🔧 عیب‌یابی (Troubleshooting)

### مشکل: صفحه سیاه است
**راه‌حل**: سرورها متوقف شدن. دوباره `start-dev.bat` رو اجرا کنید.

### مشکل: پورت اشغال است
**راه‌حل**: 
```bash
# متوقف کردن تمام Node processes
taskkill /F /IM node.exe

# یا در PowerShell
Stop-Process -Name node -Force
```

### مشکل: تغییرات اعمال نمی‌شه
**راه‌حل**: 
1. Ctrl+C برای توقف
2. `start-dev.bat` رو دوباره اجرا کنید
3. در مرورگر Hard Refresh کنید (Ctrl+Shift+R)

## 💡 نکات مهم

1. **همیشه از `start-dev.bat` استفاده کنید** - این ساده‌ترین راه است
2. **برای توقف**: فقط `Ctrl+C` بزنید
3. **اگر مشکلی پیش اومد**: ترمینال رو ببندید و دوباره `start-dev.bat` رو اجرا کنید

## 📚 مستندات بیشتر

- [راهنمای کامل دیپلوی](./READY_TO_DEPLOY.md)
- [مستندات Production](./docs/DEPLOYMENT_PRODUCTION.md)
- [راهنمای Image Generation](./docs/IMAGE_GENERATION_GUIDE.md)
- [راهنمای Bible AI Chat](./docs/BIBLE_AI_CHAT.md)
