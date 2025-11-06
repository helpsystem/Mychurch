# 📤 راهنمای آپلود فایلهای استاتیک به سرور FTP

## 📋 خلاصه

این راهنما به شما کمک می‌کند فایلهای استاتیک پروژه (audio, images) را از طریق FTP به سرور خودتان منتقل کنید.

## 📊 اطلاعات فایلها

### فایلهای موجود برای آپلود:

```
public/
├── audio/                  374 فایل (240 MB)
│   ├── bible/             صوتهای کتاب مقدس
│   │   ├── edge-tts/      Ephesians 1-6 (TTS)
│   │   ├── auto-generated/ Genesis, Exodus
│   │   └── youversion/    URL references
│   └── songs/             آهنگهای عبادت
├── images/                 47 فایل (20 MB)
├── church-photos/          عکسهای کلیسا
├── generated-images/       تصاویر AI
└── worship/                فایلهای worship songs

کل: ~260 MB
```

---

## 🚀 روش 1: استفاده از اسکریپت Node.js (توصیه می‌شود)

### مرحله 1: تنظیمات FTP

فایل `upload-static-files.cjs` را باز کنید و اطلاعات FTP خود را وارد کنید:

```javascript
// خط 24-31 در upload-static-files.cjs
const FTP_CONFIG = {
  host: '195.250.25.185',      // ✅ آماده
  user: 'YOUR_FTP_USERNAME',   // ❌ باید تکمیل کنید
  password: 'YOUR_FTP_PASSWORD', // ❌ باید تکمیل کنید
  port: 21,                     // ✅ پورت استاندارد FTP
  secure: false                 // true برای FTPS
};
```

### مرحله 2: تنظیم مسیر ریموت

```javascript
// خط 34 در upload-static-files.cjs
const REMOTE_BASE_DIR = '/public_html/Mychurch';
```

**مسیرهای معمول:**
- cPanel: `/public_html/` یا `/home/username/public_html/`
- VPS/Dedicated: `/var/www/html/`
- Plesk: `/httpdocs/`

### مرحله 3: اجرای اسکریپت

**آپلود همه فایلها:**
```bash
node upload-static-files.cjs
```

**آپلود فقط یک پوشه:**
```bash
# فقط فایلهای صوتی
node upload-static-files.cjs --folder=audio

# فقط عکسها
node upload-static-files.cjs --folder=images

# فقط عکسهای کلیسا
node upload-static-files.cjs --folder=church-photos
```

### خروجی نمونه:

```
═══════════════════════════════════════════════════════════════
   📤 FTP Static Files Upload - Mychurch
═══════════════════════════════════════════════════════════════

📋 تنظیمات FTP:
   Host: 195.250.25.185:21
   User: ftpuser
   Remote Dir: /public_html/Mychurch
   Local Dir: D:\...\Mychurch\public

🔍 در حال شمارش فایلها...
   audio: 374 فایل (240.12 MB)
   images: 47 فایل (20.45 MB)

📊 کل: 421 فایل (260.57 MB)

🔗 در حال اتصال به سرور FTP...
✅ اتصال برقرار شد!

📁 آپلود پوشه: audio
   ✅ [0.2%] 1.mp3 (1.09 MB) - 1.09 MB / 260.57 MB
   ✅ [0.4%] 2.mp3 (984 KB) - 2.05 MB / 260.57 MB
   ...
   ✅ [92.1%] cover.jpg (145 KB) - 240.12 MB / 260.57 MB

📁 آپلود پوشه: images
   ✅ [92.3%] logo.png (523 KB) - 240.64 MB / 260.57 MB
   ...

═══════════════════════════════════════════════════════════════
   ✨ آپلود با موفقیت انجام شد!
═══════════════════════════════════════════════════════════════

📊 خلاصه:
   فایلهای آپلود شده: 421 / 421
   حجم کل: 260.57 MB / 260.57 MB
   زمان: 342.5 ثانیه
   سرعت متوسط: 780.5 KB/s

🌐 فایلها در آدرس زیر قابل دسترسی هستند:
   http://195.250.25.185/audio/...
   http://195.250.25.185/images/...
```

---

## 🔧 روش 2: استفاده از FileZilla (گرافیکی)

### مرحله 1: نصب FileZilla

دانلود از: https://filezilla-project.org/

### مرحله 2: اتصال به سرور

1. باز کردن FileZilla
2. وارد کردن اطلاعات:
   - **Host:** `195.250.25.185`
   - **Username:** یوزرنیم FTP شما
   - **Password:** پسورد FTP شما
   - **Port:** `21`
3. کلیک بر روی "Quickconnect"

### مرحله 3: آپلود فایلها

1. سمت چپ: رفتن به `D:\...\Mychurch\public\`
2. سمت راست: رفتن به `/public_html/Mychurch/`
3. انتخاب پوشه‌های `audio`, `images`, `church-photos`, etc.
4. کلیک راست → Upload

**نکته:** FileZilla از Resume پشتیبانی می‌کند، پس در صورت قطع شدن می‌توانید ادامه دهید.

---

## 🔐 دریافت اطلاعات FTP

### از cPanel:

1. ورود به cPanel
2. بخش **Files** → **FTP Accounts**
3. گزینه **Add FTP Account**
4. تکمیل فرم:
   - Username: `mychurch_ftp`
   - Password: (یک پسورد قوی)
   - Directory: `/public_html/Mychurch`
5. کلیک **Create FTP Account**

### از Plesk:

1. ورود به Plesk
2. **Websites & Domains**
3. **FTP Access**
4. **Add FTP Account**

### از VPS (Linux):

```bash
# ایجاد یوزر FTP
sudo useradd -m -d /var/www/html/Mychurch ftpuser
sudo passwd ftpuser

# نصب vsftpd
sudo apt-get install vsftpd
sudo systemctl start vsftpd
sudo systemctl enable vsftpd
```

---

## 🌐 تست اتصال FTP

### از خط فرمان:

```bash
# Windows (PowerShell)
Test-NetConnection -ComputerName 195.250.25.185 -Port 21

# Linux/Mac
telnet 195.250.25.185 21
# یا
nc -zv 195.250.25.185 21
```

### از مرورگر:

```
ftp://195.250.25.185/
```

(مرورگرها اغلب FTP را پشتیبانی نمی‌کنند، اما برای تست اتصال مفید است)

---

## 🛠️ عیب‌یابی

### خطا: Connection Timeout

**علل احتمالی:**
- فایروال سرور پورت 21 را بسته است
- ISP شما FTP را بلاک کرده است
- IP شما مسدود شده است

**راه حل:**
1. تست پورت: `telnet 195.250.25.185 21`
2. بررسی فایروال سرور
3. استفاده از VPN
4. استفاده از SFTP (پورت 22) به جای FTP

### خطا: 530 Login Authentication Failed

**علل احتمالی:**
- یوزرنیم یا پسورد اشتباه است
- اکانت FTP غیرفعال است

**راه حل:**
1. بررسی یوزرنیم و پسورد
2. Reset کردن پسورد از cPanel
3. بررسی لاگ FTP سرور

### خطا: 550 Permission Denied

**علل احتمالی:**
- دسترسی نوشتن ندارید
- مسیر اشتباه است

**راه حل:**
1. بررسی مسیر ریموت (`REMOTE_BASE_DIR`)
2. بررسی دسترسی‌ها (chmod)
3. تست با مسیر `/` (root FTP)

### آپلود خیلی کند است

**راه حل‌ها:**
- استفاده از `--folder` برای آپلود تدریجی
- فشرده‌سازی فایلها قبل از آپلود
- استفاده از rsync/scp به جای FTP (اگر SSH دارید)

---

## 📈 بهینه‌سازی

### فشرده‌سازی قبل از آپلود:

```bash
# فشرده‌سازی پوشه audio
tar -czf audio.tar.gz public/audio/

# آپلود فایل فشرده (سریعتر)
# سپس در سرور extract کنید
```

### استفاده از rsync (اگر SSH دارید):

```bash
rsync -avz --progress public/ root@195.250.25.185:/var/www/html/Mychurch/
```

مزایا:
- خیلی سریعتر از FTP
- فقط فایلهای تغییریافته را آپلود می‌کند
- Resume خودکار

---

## 🔄 آپلود مجدد (Update)

### آپلود فایلهای جدید:

```bash
# فقط فایلهای صوتی جدید
node upload-static-files.cjs --folder=audio/bible

# فقط عکسهای جدید
node upload-static-files.cjs --folder=images
```

### پاک کردن فایلهای قدیمی:

```bash
# اتصال با SSH
ssh root@195.250.25.185

# پاک کردن پوشه قدیمی
rm -rf /public_html/Mychurch/audio/*

# سپس آپلود مجدد
node upload-static-files.cjs --folder=audio
```

---

## 📝 Checklist قبل از آپلود

- [ ] اطلاعات FTP تست شده است (با FileZilla)
- [ ] مسیر ریموت درست است (`REMOTE_BASE_DIR`)
- [ ] فضای کافی روی سرور وجود دارد (حداقل 300 MB)
- [ ] اینترنت پایدار است (260 MB آپلود می‌خواهد)
- [ ] Backup از فایلهای قدیمی گرفته شده است (اگر وجود دارد)

---

## 🎯 بعد از آپلود

### تست دسترسی به فایلها:

```bash
# تست یک فایل صوتی
curl -I http://195.250.25.185/audio/bible/edge-tts/EPH/1.mp3

# تست یک عکس
curl -I http://195.250.25.185/images/logo.png
```

### به‌روزرسانی تنظیمات Frontend:

اگر دامنه دارید، URLها را به‌روز کنید:

```javascript
// در کامپوننتهای React
const audioUrl = `http://your-domain.com/audio/bible/edge-tts/EPH/1.mp3`;
const imageUrl = `http://your-domain.com/images/logo.png`;
```

---

## 📞 پشتیبانی

اگر مشکلی داشتید:

1. بررسی لاگ اسکریپت
2. تست اتصال با FileZilla
3. بررسی لاگ FTP سرور: `/var/log/vsftpd.log`
4. تست با یک فایل کوچک ابتدا

---

## 🎉 موفق باشید!

بعد از آپلود موفق، فایلهای شما در آدرس زیر قابل دسترسی خواهند بود:

```
http://195.250.25.185/audio/bible/edge-tts/EPH/1.mp3
http://195.250.25.185/images/logo.png
http://195.250.25.185/church-photos/exterior.jpg
```

**نکته:** اگر دامنه دارید، می‌توانید از DNS A Record برای اتصال دامنه به IP استفاده کنید:

```
yourdomain.com → 195.250.25.185
```
