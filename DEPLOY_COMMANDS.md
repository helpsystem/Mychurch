# 🚀 دستورات Deploy روی سرور

## ✅ گام‌های انجام شده:
1. ✅ فایل‌ها commit شدند
2. ✅ Push به GitHub انجام شد
3. ⏳ باید روی سرور اجرا شود

---

## 📋 دستورات Deploy (به ترتیب اجرا کنید):

### 1️⃣ اتصال به سرور:
```bash
ssh root@samyar
```

---

### 2️⃣ رفتن به دایرکتوری پروژه:
```bash
cd ~/Mychurch
```

---

### 3️⃣ بررسی وضعیت Git (اختیاری):
```bash
git status
```

**اگر .env در Untracked Files بود:**
```bash
git stash
```

---

### 4️⃣ دریافت آخرین تغییرات:
```bash
git pull origin main
```

---

### 5️⃣ نصب Dependencies جدید:
```bash
# نصب dependencies اصلی
npm install

# نصب dependencies برای backend
cd backend
npm install
cd ..
```

---

### 6️⃣ Build پروژه:
```bash
npm run build
```

---

### 7️⃣ راه‌اندازی مجدد Backend با PM2:
```bash
pm2 restart mychurch-backend
# یا اگر نام دیگری دارد:
pm2 restart all
```

---

### 8️⃣ بررسی وضعیت PM2:
```bash
pm2 status
pm2 logs mychurch-backend --lines 50
```

---

### 9️⃣ راه‌اندازی مجدد Nginx:
```bash
sudo systemctl restart nginx
```

---

### 🔟 بررسی نهایی:
```bash
# بررسی Nginx
sudo systemctl status nginx

# تست API
curl http://localhost:3001/api/health

# بررسی لاگ‌ها
pm2 logs --lines 100
```

---

## 🌐 آدرس‌های دسترسی:

### روی سرور:
- **Frontend:** https://samanabyar.online
- **3D Flipbook:** https://samanabyar.online/bible-flipbook/GEN/1
- **API:** https://samanabyar.online/api/bible/books

### مثال‌های Flipbook:
- پیدایش فصل 1: `/bible-flipbook/GEN/1`
- مزامیر 23: `/bible-flipbook/PSA/23`
- یوحنا فصل 3: `/bible-flipbook/JHN/3`
- متی فصل 5: `/bible-flipbook/MAT/5`

---

## 🐛 عیب‌یابی (اگر مشکلی پیش آمد):

### مشکل 1: Git Conflict
```bash
cd ~/Mychurch
git stash
git pull origin main
git stash pop
# اگر conflict داشت، فایل .env را دستی ویرایش کنید
```

### مشکل 2: PM2 کار نمی‌کند
```bash
pm2 list
pm2 delete mychurch-backend
cd ~/Mychurch/backend
pm2 start server.js --name mychurch-backend
pm2 save
```

### مشکل 3: Nginx Error
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
sudo systemctl restart nginx
```

### مشکل 4: Build Error
```bash
cd ~/Mychurch
rm -rf node_modules package-lock.json
npm install
npm run build
```

### مشکل 5: Port در حال استفاده است
```bash
# بررسی port 3001
sudo lsof -i :3001
# Kill process
sudo kill -9 <PID>
# راه‌اندازی مجدد
pm2 restart mychurch-backend
```

---

## 📝 بعد از Deploy:

### تست Flipbook:
1. باز کنید: https://samanabyar.online/bible-flipbook/GEN/1
2. چک کنید:
   - ✅ صفحه بارگذاری می‌شود
   - ✅ Flipbook نمایش داده می‌شود
   - ✅ متن‌های انگلیسی (چپ) و فارسی (راست) نمایش داده می‌شوند
   - ✅ دکمه پخش (▶️) کار می‌کند
   - ✅ هایلایت کلمه به کلمه کار می‌کند
   - ✅ دکمه‌های verse-level play کار می‌کنند
   - ✅ Fullscreen toggle کار می‌کند

### تست API:
```bash
# روی سرور
curl http://localhost:3001/api/bible/books | jq
curl http://localhost:3001/api/bible/book/GEN | jq
curl http://localhost:3001/api/bible/content/GEN/1 | jq

# از خارج
curl https://samanabyar.online/api/bible/books
```

---

## ✅ Checklist نهایی:

- [ ] اتصال به سرور (ssh root@samyar)
- [ ] git pull origin main
- [ ] npm install (root و backend)
- [ ] npm run build
- [ ] pm2 restart mychurch-backend
- [ ] sudo systemctl restart nginx
- [ ] تست https://samanabyar.online/bible-flipbook/GEN/1
- [ ] بررسی API: /api/bible/books
- [ ] بررسی لاگ‌ها: pm2 logs

---

## 📊 تغییرات این Release:

### فایل‌های جدید (17 فایل):
1. `components/BibleFlipbook3D.tsx` - کامپوننت اصلی 3D flipbook
2. `pages/BibleFlipbook3DPage.tsx` - صفحه wrapper با data fetching
3. `backend/routes/bible.js` - API routes برای Bible
4. `backend/loadBibleFromDB.js` - Database loader
5. `types/bible.ts` - Type definitions
6. `styles/flipbook.css` - استایل‌های 3D book
7. `public/bible-tts-demo.html` - HTML demo
8. `BIBLE_3D_FLIPBOOK_IMPLEMENTATION.md` - مستندات کامل

### فایل‌های تغییر یافته:
1. `App.tsx` - اضافه شدن route جدید
2. `package.json` - Dependencies جدید (react-pageflip, howler, styled-components)

### امکانات جدید:
- ✅ 3D page flipping با react-pageflip
- ✅ Bilingual display (EN/FA)
- ✅ Word-by-word TTS highlighting
- ✅ Individual verse controls
- ✅ Fullscreen mode
- ✅ Persian RTL support
- ✅ Responsive design
- ✅ 66 Bible books support

---

## 🎉 موفق باشید!

تمام فایل‌ها آماده‌اند و منتظر deploy روی سرور هستند.

**Commit Hash:** c2af5fc
**GitHub:** https://github.com/helpsystem/Mychurch
**Branch:** main
