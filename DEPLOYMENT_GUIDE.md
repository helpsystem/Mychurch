# 🚀 دستورالعمل کامل Deploy کردن سایت

## روش اول: استفاده از اسکریپت خودکار (ساده‌ترین روش)

### Windows:
```powershell
.\deploy-simple.ps1
```
این اسکریپت تمام دستورات رو کپی می‌کنه. فقط باید:
1. به سرور وصل شی با PuTTY یا Windows Terminal
2. دستورات رو Paste کنی

### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## روش دوم: دستی (Step by Step)

### 1️⃣ اتصال به سرور

**با PuTTY:**
- Host: `ssh.samanabyar.online`
- Port: `22`
- Username: `root`
- Password: `jIVeuzsrkoWPkhUY`

**با Terminal:**
```bash
ssh root@ssh.samanabyar.online
# Password: jIVeuzsrkoWPkhUY
```

### 2️⃣ رفتن به پوشه پروژه
```bash
cd /root/Mychurch
```

### 3️⃣ دریافت آخرین کدها از GitHub
```bash
git pull origin main
```

### 4️⃣ نصب Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

### 5️⃣ Build کردن Frontend
```bash
npm run build
```

این دستور فولدر `dist` رو می‌سازه که شامل فایل‌های بهینه شده است.

### 6️⃣ کپی فایل‌ها به Nginx
```bash
rm -rf /var/www/mychurch/*
cp -r dist/* /var/www/mychurch/
```

### 7️⃣ Restart کردن Backend
```bash
pm2 restart mychurch-backend
```

اگر Backend اصلاً start نشده:
```bash
pm2 start backend/server.js --name mychurch-backend
```

### 8️⃣ ذخیره تنظیمات PM2
```bash
pm2 save
```

### 9️⃣ چک کردن وضعیت
```bash
pm2 status
pm2 logs mychurch-backend --lines 20
```

---

## 3️⃣ تست سایت

بعد از deploy، این آدرس‌ها رو امتحان کن:

- 🏠 صفحه اصلی: http://samanabyar.online
- 📖 صفحه Bible FlipBook: http://samanabyar.online/bible
- 🔍 API Test: http://samanabyar.online/api/bible/books

---

## 4️⃣ فعال کردن HTTPS (SSL)

برای اینکه سایت با `https://` کار کنه:

```bash
certbot --nginx -d samanabyar.online -d www.samanabyar.online
```

این دستور:
- گواهینامه SSL رایگان از Let's Encrypt دریافت می‌کنه
- Nginx رو خودکار پیکربندی می‌کنه
- Auto-renewal رو فعال می‌کنه

---

## 5️⃣ دستورات مفید PM2

### نگاه کردن به Logs:
```bash
pm2 logs mychurch-backend
```

### Restart کردن:
```bash
pm2 restart mychurch-backend
```

### Stop کردن:
```bash
pm2 stop mychurch-backend
```

### Start کردن:
```bash
pm2 start mychurch-backend
```

### حذف کامل:
```bash
pm2 delete mychurch-backend
```

### مانیتورینگ real-time:
```bash
pm2 monit
```

---

## 6️⃣ رفع مشکلات متداول

### ❌ مشکل: "Cannot find module"
**حل:**
```bash
cd /root/Mychurch
npm install
cd backend
npm install
```

### ❌ مشکل: "Port 3001 already in use"
**حل:**
```bash
pm2 delete all
pm2 start backend/server.js --name mychurch-backend
```

### ❌ مشکل: صفحه 404 Not Found
**حل:**
```bash
# چک کردن فایل‌های nginx
ls -la /var/www/mychurch/

# اگر خالیه، دوباره کپی کن
cp -r /root/Mychurch/dist/* /var/www/mychurch/
```

### ❌ مشکل: Backend کار نمی‌کنه
**حل:**
```bash
# چک کردن logs
pm2 logs mychurch-backend

# چک کردن .env
cat /root/Mychurch/backend/.env

# Restart
pm2 restart mychurch-backend
```

### ❌ مشکل: دیتابیس متصل نمیشه
**حل:**
```bash
# چک کردن Supabase credentials در .env
cd /root/Mychurch/backend
cat .env | grep DATABASE_URL

# تست دیتابیس
node -e "const { Pool } = require('pg'); const pool = new Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT NOW()').then(r => console.log('DB OK:', r.rows[0])).catch(e => console.error('DB Error:', e));"
```

---

## 7️⃣ Nginx Configuration

اگر نیاز به تغییر تنظیمات Nginx داشتی:

```bash
nano /etc/nginx/sites-available/mychurch
```

بعد از تغییر:
```bash
nginx -t  # تست config
systemctl reload nginx  # اعمال تغییرات
```

---

## 8️⃣ Backup گرفتن

### Backup از کد:
```bash
cd /root
tar -czf mychurch-backup-$(date +%Y%m%d).tar.gz Mychurch/
```

### Backup از دیتابیس:
دیتابیس روی Supabase هست و خودش backup می‌گیره، ولی اگر بخوای دستی:
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## 9️⃣ Monitoring

### چک کردن استفاده از منابع:
```bash
htop
# یا
top
```

### چک کردن disk space:
```bash
df -h
```

### چک کردن memory:
```bash
free -h
```

### چک کردن Nginx logs:
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🎯 Checklist بعد از هر Deployment

- [ ] ✅ کد از GitHub pull شد
- [ ] ✅ Dependencies نصب شدند
- [ ] ✅ Frontend build شد
- [ ] ✅ فایل‌ها به `/var/www/mychurch/` کپی شدند
- [ ] ✅ Backend restart شد
- [ ] ✅ `pm2 status` نشون میده که running است
- [ ] ✅ سایت اصلی باز میشه: http://samanabyar.online
- [ ] ✅ صفحه Bible کار می‌کنه: http://samanabyar.online/bible
- [ ] ✅ API جواب میده: http://samanabyar.online/api/bible/books
- [ ] ✅ Console browser خطا نداره (F12)
- [ ] ✅ FlipBook features کار می‌کنن (highlight, notes, TTS)

---

## 📞 در صورت مشکل

اگر مشکلی پیش اومد:
1. `pm2 logs mychurch-backend` رو چک کن
2. `/var/log/nginx/error.log` رو چک کن
3. Browser Console (F12) رو چک کن
4. اسکرین‌شات بگیر و به من نشون بده

---

**تاریخ آخرین بروزرسانی:** 2025-10-10
**نسخه:** 1.0.0
