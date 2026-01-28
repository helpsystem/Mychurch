# 🎬 Broadcast Console Pro - Setup Steps

## وضعیت فعلی

### ✅ آماده:
1. **Frontend components** - کامل و build شده
2. **Backend routes** - `broadcastSessionRoutes.js` و `broadcastAiRoutes.js` registered در server.js
3. **Migration file** - `migrations/broadcast_sessions.sql` آماده
4. **API services** - `sessionStorage.ts` و `geminiService.ts` به endpoints متصل

### ❌ نیاز به اجرا:
1. Database migration
2. Git push برای تغییرات
3. Backend restart روی سرور

---

## 🔧 دستورات اجرایی

### قدم 1: Migration لوکال (به Supabase متصل می‌شود)

```powershell
cd "d:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch"
node run-broadcast-migration.js
```

خروجی مورد انتظار:
```
Running broadcast_sessions migration...
✅ Migration successful! Rows: 2
Sessions: [{ id: ..., name: 'جلسه پرستشی یکشنبه', is_template: true }, ...]
```

### قدم 2: Git Push

```powershell
git add .
git commit -m "Add broadcast migration helper"
git push origin main
```

### قدم 3: Update سرور

```bash
ssh root@samanabyar.online
cd /var/www/Mychurch
git pull origin main
pm2 restart all
exit
```

### قدم 4: تست API

```powershell
# Get sessions
curl https://samanabyar.online/api/broadcast-sessions

# خروجی باید این باشد:
# {"sessions":[{"id":"...","name":"جلسه پرستشی یکشنبه",...}],"total":2}
```

---

## 📱 تست در مرورگر

1. برو به: `https://samanabyar.online/#/admin/broadcast`
2. مطمئن شو Console خطا نداره (F12 → Console)
3. قابلیت‌هایی که باید کار کنند:
   - ✅ اضافه کردن slides (Scripture, Lyrics, Media)
   - ✅ جستجوی آیات با AI
   - ✅ ترجمه خودکار FA ↔ EN
   - ✅ ذخیره و بازیابی sessions
   - ✅ Lower Thirds
   - ✅ Settings panel

---

## 🐛 Troubleshooting

### خطای "Table does not exist"
```powershell
# Migration را اجرا کن
node run-broadcast-migration.js
```

### خطای "API not found"
```bash
# Backend restart
ssh root@samanabyar.online "cd /var/www/Mychurch && pm2 restart all"
```

### خطای CORS
Backend باید درست configure باشد - فایل `server.js` را چک کن.

### خطای AI
GEMINI_API_KEY باید در `.env` سرور باشد.

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/broadcast-sessions` | لیست sessions |
| GET | `/api/broadcast-sessions/:id` | یک session |
| POST | `/api/broadcast-sessions` | ذخیره session |
| PATCH | `/api/broadcast-sessions/:id` | ویرایش session |
| DELETE | `/api/broadcast-sessions/:id` | حذف session |
| POST | `/api/broadcast-ai/translate` | ترجمه با AI |
| POST | `/api/broadcast-ai/scripture-search` | جستجوی آیات |
| POST | `/api/broadcast-ai/scripture-suggest` | پیشنهاد آیه |
