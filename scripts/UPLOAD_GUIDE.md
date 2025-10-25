# 📤 راهنمای آپلود فایل‌ها به سرور

## 🎯 مقدمه

بعد از استخراج فایل‌های سرود، باید آن‌ها را به سرور منتقل کنید تا React بتواند آن‌ها را بخواند.

---

## 📋 روش‌های مختلف آپلود

### روش 1️⃣: استفاده از اسکریپت Python (خودکار) ⭐

**مزایا:**
- خودکار و سریع
- پشتیبانی از SSH Key
- نمایش پیشرفت

**نیازمندی‌ها:**
```bash
pip install paramiko
```

**تنظیمات:**
فایل `upload_worship_to_server.py` را ویرایش کنید:

```python
SERVER_HOST = "samanabyar.online"  # دامنه یا IP سرور
SERVER_USER = "root"               # نام کاربری SSH
SERVER_PASSWORD = "YOUR_PASSWORD"  # رمز عبور (یا None)
SERVER_KEY_FILE = None             # مسیر SSH key (یا None)
REMOTE_BASE = "/var/www/html/public/worship"  # مسیر روی سرور
```

**اجرا:**
```bash
cd scripts
python upload_worship_to_server.py
```

---

### روش 2️⃣: استفاده از FileZilla (دستی)

**مراحل:**

1. **نصب FileZilla:**
   - دانلود: https://filezilla-project.org/

2. **اتصال به سرور:**
   ```
   Host: samanabyar.online
   Username: root
   Password: YOUR_PASSWORD
   Port: 22
   ```

3. **آپلود پوشه‌ها:**
   ```
   Local:  D:\...\Mychurch\public\worship\
   Remote: /var/www/html/public/worship/
   ```

4. **پوشه‌های مورد نیاز:**
   - ✅ `audio/`
   - ✅ `pptx/`
   - ✅ `data/`
   - ✅ `lyrics/`

---

### روش 3️⃣: استفاده از SCP (Command Line)

**Windows (PowerShell):**
```powershell
scp -r "D:\...\Mychurch\public\worship\*" root@samanabyar.online:/var/www/html/public/worship/
```

**Linux/Mac:**
```bash
scp -r ./public/worship/* root@samanabyar.online:/var/www/html/public/worship/
```

---

### روش 4️⃣: استفاده از rsync (سریع‌ترین)

**مزایا:**
- فقط فایل‌های تغییر یافته را آپلود می‌کند
- قابل از سرگیری
- سریع‌تر از SCP

**Linux/Mac:**
```bash
rsync -avz --progress ./public/worship/ root@samanabyar.online:/var/www/html/public/worship/
```

**Windows (با WSL یا Git Bash):**
```bash
rsync -avz --progress /d/Windows.old/.../public/worship/ root@samanabyar.online:/var/www/html/public/worship/
```

---

## 🌐 ساختار نهایی روی سرور

بعد از آپلود، ساختار باید اینطور باشه:

```
/var/www/html/public/worship/
├── audio/
│   ├── El_Shaddai.mp3
│   ├── Come_to_Me_Jesus.mp3
│   └── ... (سایر MP3ها)
│
├── pptx/
│   ├── Elshaddai.pptx
│   ├── Real_Love.pptx
│   └── ... (سایر PPTXها)
│
├── lyrics/
│   ├── el-shaddai_fa.txt
│   ├── el-shaddai_en.txt
│   └── ...
│
└── data/
    ├── worship_songs.json  ⭐ کلیدی!
    └── timepoints/
        ├── ElShaddai.json
        └── ...
```

---

## 🔐 تنظیمات امنیتی

### استفاده از SSH Key (توصیه می‌شود)

**1. ایجاد SSH Key:**
```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

**2. کپی Public Key به سرور:**
```bash
ssh-copy-id root@samanabyar.online
```

**3. استفاده در اسکریپت:**
```python
SERVER_PASSWORD = None
SERVER_KEY_FILE = "~/.ssh/id_rsa"  # یا مسیر دیگری
```

---

## ✅ تست بعد از آپلود

### 1. تست دسترسی به JSON:
```bash
curl https://samanabyar.online/worship/data/worship_songs.json
```

### 2. تست دسترسی به فایل صوتی:
```bash
curl -I https://samanabyar.online/worship/audio/El_Shaddai.mp3
```

### 3. تست در مرورگر:
```
https://samanabyar.online/worship/data/worship_songs.json
https://samanabyar.online/#/worship
```

---

## 🚨 مشکلات رایج

### ❌ خطا 403 Forbidden

**راه‌حل:**
```bash
# اجرا روی سرور:
chmod -R 755 /var/www/html/public/worship/
chown -R www-data:www-data /var/www/html/public/worship/
```

### ❌ خطا 404 Not Found

**بررسی:**
1. مطمئن شوید فایل‌ها آپلود شده‌اند
2. بررسی کنید مسیر صحیح است
3. بررسی کنید nginx/apache به درستی پیکربندی شده

### ❌ فایل‌های بزرگ آپلود نمی‌شوند

**راه‌حل برای Nginx:**
```nginx
# در /etc/nginx/nginx.conf
client_max_body_size 100M;
```

**راه‌حل برای Apache:**
```apache
# در .htaccess
php_value upload_max_filesize 100M
php_value post_max_size 100M
```

---

## 📊 حجم فایل‌ها

تخمین حجم کل:

```
🎵 MP3 Files: ~1164 فایل × ~5MB = ~5.8GB
📊 PPTX Files: ~729 فایل × ~2MB = ~1.5GB
💾 کل تقریبی: ~7-8GB
```

### 💡 توصیه: استفاده از CDN

برای سرعت بهتر و کاهش بار سرور:

**گزینه‌های CDN:**
- Cloudflare R2
- AWS S3
- Bunny CDN
- Backblaze B2

**مثال با Cloudflare:**
```json
{
  "audioUrl": "https://cdn.samanabyar.online/worship/audio/Song.mp3"
}
```

---

## 🔄 آپدیت فایل‌ها

برای آپدیت فایل‌ها در آینده:

**با rsync (فقط فایل‌های جدید):**
```bash
rsync -avz --update ./public/worship/ root@samanabyar.online:/var/www/html/public/worship/
```

**با اسکریپت Python:**
```bash
python upload_worship_to_server.py
```

---

## 📝 نکات مهم

1. **بکآپ بگیرید:** قبل از آپلود، از فایل‌های سرور بکآپ بگیرید
2. **تست کنید:** بعد از آپلود، همه لینک‌ها را تست کنید
3. **مانیتور کنید:** فضای دیسک سرور را بررسی کنید
4. **فشرده‌سازی:** فایل‌های بزرگ را فشرده کنید

---

## 🎯 مراحل نهایی

✅ **چک‌لیست:**

- [ ] فایل‌ها به سرور آپلود شدند
- [ ] دسترسی به JSON تست شد
- [ ] دسترسی به فایل‌های صوتی تست شد
- [ ] صفحه Worship در مرورگر باز می‌شود
- [ ] سرودها نمایش داده می‌شوند
- [ ] دکمه‌ها کار می‌کنند
- [ ] پاورپوینت‌ها قابل دانلود هستند

---

**موفق باشید! 🚀**
