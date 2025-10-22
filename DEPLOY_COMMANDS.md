# 🚀 دستورات جادویی - هاست آپدیت!

## دستورات اصلی

### 1️⃣ آپدیت کامل سایت (توصیه می‌شود)
```bash
npm run deploy
```
این دستور:
- به سرور SSH می‌زند
- آخرین کدها را از GitHub می‌گیرد
- npm install می‌کند
- PM2 را ریستارت می‌کند
- سلامت سرور را چک می‌کند

### 2️⃣ فقط ریستارت سرور
```bash
npm run host:restart
```
برای زمانی که فقط می‌خواهی سرور را ریستارت کنی.

### 3️⃣ تست اتصال SSH
```bash
npm run test:ssh
```
برای چک کردن اینکه SSH کار می‌کند یا نه.

## مثال استفاده

```bash
# 1. تغییراتت رو commit کن
git add .
git commit -m "توضیحات تغییرات"
git push origin main

# 2. به سرور deploy کن
npm run deploy

# ✅ تمام! سایتت آپدیت شد
```

## اطلاعات سرور

- 🌐 **Domain:** https://samanabyar.online
- 📍 **Server Path:** /root/Mychurch
- 🔐 **SSH User:** root
- 🚪 **SSH Port:** 22
- ⚡ **PM2 Process:** church-backend

## دستورات دستی (در صورت نیاز)

اگر خواستی دستی کار کنی:

```bash
# اتصال SSH
ssh root@samanabyar.online

# رفتن به پوشه پروژه
cd /root/Mychurch/backend

# مشاهده لاگ‌ها
pm2 logs church-backend

# ریستارت
pm2 restart church-backend

# لیست process‌ها
pm2 list

# متوقف کردن
pm2 stop church-backend

# شروع دوباره
pm2 start server.js --name church-backend
```

## عیب‌یابی

### ❌ خطا: Cannot connect to server
```bash
# چک کن اینترنت متصل باشد
ping samanabyar.online

# تست SSH
npm run test:ssh
```

### ❌ خطا: Port 3001 already in use
```bash
# ریستارت سرور
npm run host:restart
```

### ❌ خطا: Git pull failed
```bash
ssh root@samanabyar.online
cd /root/Mychurch
git stash
git pull origin main
```

## چک کردن وضعیت سایت

```bash
# API Health Check
curl https://samanabyar.online/api/health

# یا از مرورگر
# https://samanabyar.online/api/health
```

باید جواب بده:
```json
{"ok":true,"uptime":123.456,"ts":1234567890}
```

---

**یادت باشه:** همیشه قبل از deploy، تغییراتت رو به GitHub push کن!

```bash
git add .
git commit -m "my changes"
git push origin main
npm run deploy
```
