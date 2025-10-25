# 📤 راهنمای آپلود فایل‌های Worship

## 🎯 مراحل آپلود فایل‌ها روی سرور

### 1️⃣ روش FTP (FileZilla)

```
Server: ftp.yourchurch.com
Username: your_username
Password: your_password
Port: 21

مسیر آپلود: /public_html/worship/
```

**مراحل:**
1. FileZilla را باز کنید
2. به سرور متصل شوید
3. به پوشه `/public_html/worship/` بروید
4. فایل‌ها را drag & drop کنید

### 2️⃣ روش SSH (برای سرورهای VPS)

```bash
# اتصال به سرور
ssh user@yourserver.com

# رفتن به پوشه worship
cd /var/www/html/public/worship/

# آپلود با scp (از کامپیوتر خودتان)
scp ElShaddai.mp3 user@yourserver.com:/var/www/html/public/worship/audio/
```

### 3️⃣ روش cPanel File Manager

1. وارد cPanel شوید
2. به File Manager بروید
3. مسیر: `public_html/worship/`
4. دکمه Upload را بزنید
5. فایل‌ها را انتخاب و آپلود کنید

### 4️⃣ روش Git (فقط برای فایل‌های کوچک)

```bash
# فقط برای JSON و TXT
git add public/worship/data/
git add public/worship/lyrics/
git commit -m "Add worship song data"
git push
```

**⚠️ هشدار:** فایل‌های صوتی و ویدیو را با Git commit نکنید!

---

## 📁 چک‌لیست آپلود یک سرود جدید

- [ ] فایل صوتی (`/audio/SongName.mp3`)
- [ ] متن فارسی (`/lyrics/SongName_fa.txt`)
- [ ] متن انگلیسی (`/lyrics/SongName_en.txt`)
- [ ] فایل پاورپوینت (`/pptx/SongName.pptx`) - اختیاری
- [ ] Timepoints (`/data/timepoints/SongName.json`) - اختیاری
- [ ] آپدیت `worship_songs.json`

---

## 🔐 تنظیم مجوزها (Permissions)

بعد از آپلود، مطمئن شوید مجوزها درست هستند:

```bash
# برای پوشه‌ها
chmod 755 /path/to/worship/audio/

# برای فایل‌ها
chmod 644 /path/to/worship/audio/*.mp3
```

یا در cPanel:
- پوشه‌ها: 755
- فایل‌ها: 644

---

## 🌐 استفاده از CDN (پیشنهاد)

برای بهبود سرعت، فایل‌های بزرگ را در CDN قرار دهید:

### گزینه‌های رایگان:
1. **Cloudflare R2** - 10GB رایگان
2. **Bunny CDN** - سرعت بالا، قیمت مناسب
3. **Backblaze B2** - ذخیره‌سازی ارزان

### تغییر مسیر در کد:
```javascript
// به جای:
audioUrl: "/worship/audio/ElShaddai.mp3"

// استفاده از CDN:
audioUrl: "https://cdn.yourchurch.com/worship/audio/ElShaddai.mp3"
```

---

## 📊 نظارت بر فضای دیسک

```bash
# چک کردن حجم پوشه
du -sh /path/to/worship/

# لیست فایل‌های بزرگ
find /path/to/worship/ -type f -size +10M -exec ls -lh {} \;
```

---

## 🔄 پشتیبان‌گیری خودکار

```bash
#!/bin/bash
# backup-worship.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/worship_$DATE"

mkdir -p $BACKUP_DIR
cp -r /var/www/html/public/worship/* $BACKUP_DIR/

# فشرده‌سازی
tar -czf worship_backup_$DATE.tar.gz $BACKUP_DIR/
```

اضافه به cron:
```
0 2 * * 0 /path/to/backup-worship.sh
```

---

**آخرین بروزرسانی**: 2025-01-24
