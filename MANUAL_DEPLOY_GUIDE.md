# 📖 راهنمای Deploy دستی به samanabyar.online

## مشکل فعلی
هر دو روش SSH و FTP با خطای Authentication مواجه شدند:
- SSH: "All configured authentication methods failed"
- FTP: "530 Login authentication failed"

**دلیل**: Username یا Password در `.env` صحیح نیست.

---

## ✅ گزینه 1: اصلاح Credentials و استفاده از اسکریپت‌ها

### مرحله 1: اصلاح `.env`

1. وارد **cPanel** یا **پنل هاستینگ** سرور `samanabyar.online` شوید
2. اطلاعات صحیح FTP و SSH را پیدا کنید:
   - FTP Username
   - FTP Password
   - SSH Username (معمولاً همان FTP username است)
   - SSH Password (معمولاً همان FTP password است)

3. فایل `.env` را با اطلاعات صحیح ویرایش کنید:

```properties
# FTP Configuration
FTP_HOST=ftp.samanabyar.online
FTP_USER=اینجا_username_صحیح_بنویسید
FTP_PASS=اینجا_password_صحیح_بنویسید
FTP_PORT=21
FTP_SECURE=false

# SSH Configuration
SSH_HOST=ssh.samanabyar.online
SSH_USER=اینجا_username_صحیح_بنویسید
SSH_PORT=22
SSH_pass=اینجا_password_صحیح_بنویسید
```

### مرحله 2: اصلاح `deploy-ftp.cjs`

فایل `deploy-ftp.cjs` را باز کنید و این قسمت را اصلاح کنید:

```javascript
// قبل (خط 6-12):
const config = {
  host: '66.198.240.7',
  user: 'samanaon',  // ❌ این username کار نمی‌کند
  password: 'LplLYSUJzufaOv2s',
  port: 21,
  secure: false
};

// بعد (استفاده از .env):
require('dotenv').config();

const config = {
  host: process.env.FTP_HOST || '66.198.240.7',
  user: process.env.FTP_USER,
  password: process.env.FTP_PASS,
  port: parseInt(process.env.FTP_PORT || '21'),
  secure: process.env.FTP_SECURE === 'true'
};
```

### مرحله 3: اجرای اسکریپت

```powershell
# ابتدا Build بسازید
npm run build

# سپس FTP Deploy اجرا کنید
node deploy-ftp.cjs
```

یا برای Full Deployment با SSH:

```powershell
node deploy-to-host.cjs
```

---

## ✅ گزینه 2: Deploy دستی با FileZilla (بدون کد)

### مرحله 1: نصب FileZilla
دانلود و نصب: https://filezilla-project.org/

### مرحله 2: اتصال به سرور

1. **Host**: `ftp.samanabyar.online`
2. **Username**: username صحیح از cPanel
3. **Password**: password صحیح
4. **Port**: `21`

### مرحله 3: آپلود فایل‌ها

1. در کامپیوتر خود، به پوشه `dist/` بروید که Build شده
2. در سرور، به مسیر `/public_html/Mychurch/` بروید
3. همه محتویات `dist/` را انتخاب کنید
4. کلیک راست → Upload
5. صبر کنید تا آپلود تمام شود (2-3 دقیقه)

### مرحله 4: تست

سایت را در مرورگر باز کنید:
```
https://samanabyar.online/Mychurch/
```

---

## ✅ گزینه 3: Deploy به Render یا Vercel (Cloud رایگان)

اگر deploy به سرور خودتون مشکل داره، می‌تونید از سرویس‌های رایگان استفاده کنید:

### Render.com (توصیه می‌شه)

1. وارد https://render.com شوید و ثبت‌نام کنید
2. **New → Web Service** را بزنید
3. Repository GitHub را وصل کنید: `helpsystem/Mychurch`
4. تنظیمات:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node backend/server.js`
   - **Environment**: Node
5. **Environment Variables** را از فایل `.env` کپی کنید:
   ```
   SUPABASE_URL=https://wxzhzsqicgwfxffxayhy.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_KEY=eyJ...
   PORT=3001
   NODE_ENV=production
   ```
6. **Create Web Service** بزنید

### Vercel.com (Frontend فقط)

برای Frontend ساده‌تر:

```bash
npm install -g vercel
vercel login
vercel --prod
```

جزئیات بیشتر در: `DEPLOYMENT_CREDENTIALS.md`

---

## ✅ گزینه 4: Deploy با SSH دستی

اگر دسترسی SSH دارید:

### مرحله 1: اتصال به سرور

```bash
ssh root@66.198.240.7 -p 22
# یا
ssh your-username@samanabyar.online -p 22
```

### مرحله 2: نصب پروژه

```bash
# رفتن به مسیر وب
cd /home/your-username/public_html/

# Clone کردن repository
git clone https://github.com/helpsystem/Mychurch.git
cd Mychurch

# نصب dependencies
npm install
cd backend && npm install && cd ..

# Build کردن
npm run build

# کپی build به مسیر اصلی
cp -r dist/* ../
```

### مرحله 3: راه‌اندازی Backend

```bash
# نصب PM2
npm install -g pm2

# راه‌اندازی Backend
cd backend
pm2 start server.js --name mychurch-backend
pm2 save
pm2 startup
```

---

## 📞 اگر باز هم مشکل داشتید

1. **چک کنید cPanel** سرورتون رو و username/password صحیح رو پیدا کنید
2. **از FTP Client** مثل FileZilla استفاده کنید (راحت‌تر از command line)
3. **یا Render.com** استفاده کنید که رایگان و بدون دردسره

---

## 🎯 خلاصه

| روش | سختی | زمان | پیشنهاد |
|-----|------|------|---------|
| اصلاح credentials + اسکریپت | متوسط | 5 دقیقه | ⭐⭐⭐ |
| FileZilla دستی | آسان | 10 دقیقه | ⭐⭐⭐⭐⭐ |
| Render.com | آسان | 15 دقیقه | ⭐⭐⭐⭐ |
| SSH دستی | سخت | 20 دقیقه | ⭐⭐ |

**توصیه نهایی**: از **FileZilla** استفاده کنید، ساده‌ترین راهه! 🚀
