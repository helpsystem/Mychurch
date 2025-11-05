# 🚀 راهنمای سریع راه‌اندازی n8n

## ✅ وضعیت فعلی
- ✅ n8n نصب شده (نسخه 1.118.1)
- ✅ کد پنل ادمین آماده است
- ✅ فایل `.env` تنظیم شده
- ⏳ منتظر API Key از n8n

---

## 📝 مراحل راه‌اندازی (5 دقیقه)

### گام 1️⃣: راه‌اندازی n8n
```bash
# در یک terminal جدید:
n8n start
```
**نتیجه:** n8n روی `http://localhost:5678` اجرا می‌شود

---

### گام 2️⃣: ساخت اکانت n8n
1. باز کردن در مرورگر: **http://localhost:5678**
2. **اولین بار:** ساخت Owner Account
   - ایمیل: `admin@example.com` (یا هر ایمیل دلخواه)
   - رمز عبور قوی انتخاب کنید
   - ✅ این اطلاعات را یادداشت کنید!

3. **بار دوم:** فقط لاگین کنید

---

### گام 3️⃣: دریافت API Key
1. در n8n، کلیک روی **Settings** (⚙️) در نوار بالا
2. انتخاب **API** از منوی سمت چپ
3. کلیک روی **Create API Key**
4. نام: `Church Website Integration`
5. **⚠️ مهم:** API Key را **فوراً کپی کنید** (فقط یک بار نمایش داده می‌شود!)

---

### گام 4️⃣: قرار دادن API Key در پروژه
1. باز کردن فایل: `.env`
2. پیدا کردن این خط:
   ```env
   VITE_N8N_API_KEY=eyJhbGci...
   ```
3. **جایگزین کردن** با API Key جدید:
   ```env
   VITE_N8N_API_KEY=<paste_your_new_api_key_here>
   ```
4. **ذخیره** فایل (Ctrl+S)

---

### گام 5️⃣: ری‌استارت سرور React
1. در terminal سرور React (که روی port **5174** یا **5173** است):
   - فشار دادن **Ctrl+C** (متوقف کردن)
   - اجرای: `npm run dev` (شروع مجدد)

2. منتظر بمانید تا سرور آماده شود:
   ```
   ➜  Local:   http://localhost:5173/
   ```

---

### گام 6️⃣: تست پنل ادمین n8n 🎉
1. باز کردن: **http://localhost:5173/#/admin** (یا 5174)
2. **لاگین** با حساب SUPER_ADMIN
3. کلیک روی **"اتوماسیون n8n"** در بخش "مدیریت سایت"
4. یا مستقیم: **http://localhost:5173/#/admin/automations**

---

## 🎯 چیزهایی که باید ببینید

### در پنل ادمین n8n:
- ✅ **وضعیت سرور:** 🟢 سالم (با نمایش latency مثلاً: 45ms)
- ✅ **لیست Workflows:** خالی در ابتدا (می‌توانید workflow بسازید)
- ✅ **دکمه‌های اجرا:** برای اجرای workflows
- ✅ **تاریخچه Executions:** لیست اجراهای اخیر
- ✅ **دوزبانه:** تبدیل خودکار بین فارسی/انگلیسی

---

## 🔧 ساخت اولین Workflow

### نمونه ساده: Daily Website Check

1. در n8n (http://localhost:5678):
   - کلیک روی **+ New workflow**
   - نام: `Daily Website Health Check`

2. اضافه کردن **Schedule Trigger:**
   - Node: Schedule Trigger
   - تنظیم: هر روز ساعت 9 صبح

3. اضافه کردن **HTTP Request:**
   - Node: HTTP Request
   - Method: GET
   - URL: `http://localhost:5173`
   - نام: Check Website Status

4. اضافه کردن **If Node:**
   - Condition: `{{ $json.statusCode }} === 200`

5. **True Branch:** ارسال پیام موفقیت
6. **False Branch:** ارسال هشدار

7. **Save** و **Activate** workflow

8. بازگشت به پنل ادمین وبسایت → باید workflow جدید را ببینید!

---

## 🐛 عیب‌یابی

### مشکل 1: "Cannot connect to n8n server"
**راه حل:**
```bash
# بررسی n8n اجرا شده یا نه:
curl http://localhost:5678/healthz

# اگر خطا داد، n8n را راه‌اندازی کنید:
n8n start
```

---

### مشکل 2: "Invalid API Key"
**راه حل:**
1. بررسی فایل `.env` → `VITE_N8N_API_KEY` باید API Key جدید باشد
2. ری‌استارت سرور React (Ctrl+C → npm run dev)
3. اگر همچنان خطا داد، API Key جدید بگیرید از n8n

---

### مشکل 3: صفحه 404 یا خالی است
**راه حل:**
1. بررسی لاگین کرده‌اید یا نه
2. بررسی نقش کاربری: باید **SUPER_ADMIN** باشید
3. بررسی URL: باید `/#/admin/automations` باشد (با #)

---

### مشکل 4: Workflows نمایش داده نمی‌شوند
**راه حل:**
1. در n8n: حداقل یک workflow بسازید و **Save** کنید
2. در پنل ادمین: دکمه **Refresh** (یا F5) بزنید
3. بررسی Console در DevTools (F12) برای خطاها

---

## 📊 معماری

```
┌─────────────────┐
│  React Frontend │ (Port 5173/5174)
│  Admin Panel    │
└────────┬────────┘
         │ VITE_N8N_API_KEY
         │ HTTP Requests
         ▼
┌─────────────────┐
│   n8n Server    │ (Port 5678)
│  Automation     │
└─────────────────┘
```

---

## 📚 فایل‌های مرتبط

- **کد سرویس:** `services/n8nService.ts`
- **کامپوننت UI:** `pages/AdminN8NAutomationPage.tsx`
- **تنظیمات:** `.env` (VITE_N8N_URL, VITE_N8N_API_KEY)
- **راهنمای کامل:** `N8N_SETUP_GUIDE.md`

---

## ✨ امکانات آینده

- [ ] ساخت workflow از داخل پنل ادمین
- [ ] گزارش‌گیری و آمار اجراها
- [ ] نمونه workflows آماده برای کلیسا
- [ ] یادآوری خودکار رویدادها
- [ ] ارسال خودکار خبرنامه

---

## 🎉 تبریک!

اگر تا اینجا آمدید، پنل n8n شما آماده است! 

**لذت ببرید از اتوماسیون کارهای تکراری! 🚀**
