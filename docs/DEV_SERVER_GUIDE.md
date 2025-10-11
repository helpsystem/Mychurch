# 🚀 Development Server Guide

## استفاده سریع

### 1. استارت Dev Server
```bash
cd backend
npm run dev
```

سرور روی `http://localhost:3001` اجرا میشه بدون initialization دیتابیس.

### 2. استارت Frontend
```bash
npm run dev
```

Frontend روی `http://localhost:5173` اجرا میشه.

### 3. باز کردن در Browser
```
http://localhost:5173
```

## تفاوت Dev Server با Production Server

| ویژگی | Dev Server | Production Server |
|------|-----------|-------------------|
| **استارت** | `npm run dev` | `npm start` |
| **DB Init** | ❌ خیر | ✅ بله |
| **سرعت** | ⚡ سریع | 🐌 کند |
| **استفاده** | Development | Production |
| **CORS** | 🔓 همه origins | 🔒 محدود |

## API Endpoints

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Bible Books
```bash
curl http://localhost:3001/api/bible/books
```

### Daily Verse
```bash
curl http://localhost:3001/api/ai-chat/daily-verse?language=fa
```

### AI Chat
```bash
curl -X POST http://localhost:3001/api/ai-chat/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "چگونه می‌توانم آرامش پیدا کنم؟", "language": "fa"}'
```

## Testing

### Run All Tests
```bash
cd backend
npm test
```

### Manual Tests
```bash
# Test health
curl http://localhost:3001/api/health

# Test daily verse
curl http://localhost:3001/api/ai-chat/daily-verse?language=fa

# Test AI chat
curl -X POST http://localhost:3001/api/ai-chat/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "test", "language": "fa"}'
```

## ویژگی‌های جدید Widget

### ✅ فیچرهای پیاده‌سازی شده

1. **🗑️ Chat History**
   - ذخیره خودکار در localStorage
   - دکمه پاک کردن تاریخچه
   - بارگذاری خودکار هنگام باز کردن

2. **💾 Client Cache**
   - کش آیه روزانه (24 ساعت)
   - کش نتایج جستجو
   - بهینه‌سازی سرعت

3. **🌙 Dark Mode**
   - toggle button در header
   - ذخیره preference در localStorage
   - تم کامل dark/light

4. **🔊 TTS (Text-to-Speech)**
   - پخش صدای آیات
   - دکمه speaker برای هر آیه
   - پشتیبانی فارسی و انگلیسی

5. **📤 Share & Copy**
   - کپی آیه به clipboard
   - اشتراک‌گذاری با Web Share API
   - دکمه‌های اختصاصی برای هر آیه

6. **❌ Error Handling**
   - نمایش خطاهای مفصل
   - پیام‌های خطای فارسی/انگلیسی
   - timeout handling

## Keyboard Shortcuts

- **Enter** - ارسال پیام
- **Shift+Enter** - خط جدید (در آینده)

## Browser Console Commands

```javascript
// Clear cache
localStorage.clear();

// Get chat history
JSON.parse(localStorage.getItem('chatHistory'));

// Toggle dark mode
document.querySelector('[title*="Toggle theme"]').click();
```

## Troubleshooting

### سرور متوقف میشه
```bash
# Kill all node processes
Stop-Process -Name node -Force

# Start dev server
cd backend
npm run dev
```

### خطای CORS
- Dev server همه origins رو قبول می‌کنه
- مطمئن شوید سرور در حال اجراست

### خطای Database
- Dev server نیاز به DB initialization نداره
- برای production از `npm start` استفاده کنید

### Cache مشکل داره
```javascript
// در browser console:
localStorage.clear();
location.reload();
```

## Production Deployment

```bash
# 1. Build frontend
npm run build

# 2. Copy files to server
# dist/
# backend/

# 3. Start production server
cd backend
npm start

# 4. Setup PM2 (optional)
pm2 start server.js --name church-api
pm2 save
pm2 startup
```

## Environment Variables

```env
# Required
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Optional
PORT=3001
NODE_ENV=development
VITE_API_URL=http://localhost:3001
```

## Performance Tips

1. **Cache**: آیه روزانه و جستجوها کش میشن
2. **History**: فقط 50 پیام آخر ذخیره میشه
3. **Lazy Load**: آیات به صورت lazy load میشن
4. **Debounce**: جستجو با تأخیر 300ms

## Future Features

- [ ] Voice Input (Speech Recognition)
- [ ] Export Chat History
- [ ] Bookmarks
- [ ] Notes on Verses
- [ ] Study Plans
- [ ] Community Questions

---

**آماده برای Development! 🎉**

```bash
# Quick Start
cd backend && npm run dev
```

سوالی بود؟ نگاه کن به `docs/TEST_RESULTS_AND_SUGGESTIONS.md`
