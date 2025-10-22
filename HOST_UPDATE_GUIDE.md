# 🚀 دستور جادویی: هاست آپدیت شو!

## استفاده ساده

### ⚡ روش سریع (FTP - بدون نیاز به SSH Key)

```bash
npm run deploy:ftp
```

این روش فایل‌های backend را از طریق FTP آپلود می‌کند. بعد از آپلود باید دستی npm install و pm2 restart را روی سرور اجرا کنید.

### 🔐 روش کامل (SSH - نیاز به SSH Key)

```powershell
npm run host:update
```

این روش همه چیز را خودکار انجام می‌دهد اما نیاز به راه‌اندازی SSH Key دارد.

## دو راه deployment 🛣️

### 1️⃣ FTP Method (ساده‌تر - توصیه می‌شود)

**مزایا:**
- نیاز به تنظیمات خاص ندارد
- فقط username/password کافیست
- سریع و مطمئن

**معایب:**
- نیاز به اجرای دستی دستورات روی سرور (npm install, pm2 restart)

**استفاده:**
```bash
npm run deploy:ftp
```

**بعد از FTP upload:**
```bash
ssh samanabyar@mi3-cl8-its2.a2hosting.com -p 7822
cd /public_html/Mychurch/backend
npm install --production
pm2 restart church-backend
```

### 2️⃣ SSH Method (پیشرفته)

**مزایا:**
- همه چیز خودکار
- یک دستور و تمام

**معایب:**
- نیاز به راه‌اندازی SSH Key
- A2 Hosting معمولاً SSH را محدود می‌کند

**استفاده:**
```bash
npm run deploy
# یا
npm run host:update
```

## چه کاری انجام می‌دهد؟ 🤔

این اسکریپت به صورت خودکار:

1. ✅ به سرور A2 Hosting متصل می‌شود (SSH)
2. ✅ آخرین تغییرات را از GitHub دریافت می‌کند
3. ✅ Dependencies را نصب می‌کند
4. ✅ PM2 را ریستارت می‌کند
5. ✅ سلامت سرور را چک می‌کند
6. ✅ گزارش کامل به شما نمایش می‌دهد

## پیش‌نیازها 📋

قبل از اولین استفاده:

### 1. نصب ssh2 module:

```bash
npm install ssh2
```

### 2. تنظیم .env

فایل `backend/.env` باید شامل این موارد باشد:

```env
SSH_HOST=mi3-cl8-its2.a2hosting.com
SSH_PORT=7822
SSH_USER=samanabyar
SSH_PASS=your_password_here
SSH_PROJECT_PATH=/home/samanabyar/public_html/Mychurch
```

### 3. راه‌اندازی اولیه روی سرور

اولین بار باید دستی راه‌اندازی کنی:

```bash
# اتصال به سرور
ssh samanabyar@mi3-cl8-its2.a2hosting.com -p 7822

# رفتن به پوشه سایت
cd /home/samanabyar/public_html

# Clone کردن repository
git clone https://github.com/helpsystem/Mychurch.git

# رفتن به پوشه backend
cd Mychurch/backend

# نصب dependencies
npm install --production

# نصب PM2 (اگر نصب نیست)
npm install -g pm2

# شروع سرور
pm2 start server.js --name church-backend

# ذخیره تنظیمات PM2
pm2 save

# تنظیم startup
pm2 startup
```

## استفاده روزانه 🎯

بعد از راه‌اندازی اولیه، هر وقت خواستی تغییرات را به سرور بفرستی:

```powershell
npm run host:update
```

**همین!** 🎉

## خروجی نمونه 📊

```
╔════════════════════════════════════════════╗
║     🚀 AUTOMATIC DEPLOYMENT SCRIPT         ║
║     Deploy to: mi3-cl8-its2.a2hosting.com  
╚════════════════════════════════════════════╝

▶ مرحله 1: اتصال به سرور SSH
ℹ در حال اتصال به samanabyar@mi3-cl8-its2.a2hosting.com:7822...
✅ اتصال به mi3-cl8-its2.a2hosting.com برقرار شد

▶ مرحله 2: اجرای دستورات deployment
ℹ اجرای دستورات deployment...
Already on 'main'
Current branch main is up to date.
added 123 packages, and audited 456 packages in 5s
[PM2] Applying action restartProcessId on app [church-backend]
[PM2] [church-backend](0) ✓
✅ تمام دستورات با موفقیت اجرا شدند

▶ مرحله 3: بررسی سلامت سرور
ℹ بررسی سلامت سرور...
✅ سرور سالم است و در حال اجرا می‌باشد

╔════════════════════════════════════════════╗
║        ✅ DEPLOYMENT SUCCESSFUL!           ║
╚════════════════════════════════════════════╝

🌐 سایت شما در آدرس زیر در دسترس است:
   https://samanabyar.online

📊 برای مشاهده لاگ‌های سرور:
   ssh samanabyar@mi3-cl8-its2.a2hosting.com -p 7822
   pm2 logs church-backend
```

## عیب‌یابی 🔧

### خطا: اتصال SSH برقرار نشد

- بررسی کن اینترنت متصل باشد
- username/password در .env را چک کن
- فایروال یا آنتی‌ویروس ممکنه مسدود کنه

### خطا: Git repository not found

اولین بار باید روی سرور git clone کنی (بخش "راه‌اندازی اولیه" رو ببین)

### خطا: PM2 not found

روی سرور PM2 نصب نیست:

```bash
ssh samanabyar@mi3-cl8-its2.a2hosting.com -p 7822
npm install -g pm2
```

## دستورات مفید 💡

```bash
# فقط deploy کن (بدون پیغام‌های رنگی)
node deploy-to-host.js

# مشاهده لاگ‌های سرور از راه دور
ssh samanabyar@mi3-cl8-its2.a2hosting.com -p 7822 "pm2 logs church-backend --lines 50"

# ریستارت دستی سرور
ssh samanabyar@mi3-cl8-its2.a2hosting.com -p 7822 "pm2 restart church-backend"

# چک کردن وضعیت PM2
ssh samanabyar@mi3-cl8-its2.a2hosting.com -p 7822 "pm2 status"
```

## یادت نره! ⚠️

1. **قبل از deploy، همیشه commit و push کن:**
   ```bash
   git add .
   git commit -m "توضیحات تغییرات"
   git push origin main
   ```

2. **فایل .env را commit نکن!** (برای امنیت)

3. **بعد از deploy، سایت را تست کن:**
   - https://samanabyar.online
   - https://samanabyar.online/api/health

## راهنماهای بیشتر 📚

- [راهنمای کامل deployment](./REMOTE_DEPLOYMENT_GUIDE.md)
- [شروع سریع backend](./backend/QUICK_START.md)
- [تنظیمات .env](./backend/.env.example)

---

**🎉 حالا می‌تونی با یه دستور تمام سایت رو آپدیت کنی!**

```powershell
npm run host:update
```
