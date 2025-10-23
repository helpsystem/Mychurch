# 📤 راهنمای آپلود فایل‌های سرویس عبادت

## ✅ پیش‌نیازها

اطلاعات سرور در فایل `.env` ریشه پروژه موجود است:

```env
SSH_HOST=ssh.samanabyar.online
SSH_USER=root
SSH_PORT=22
SSH_pass=jIVeuzsrkoWPkhUY
DOMAIN=samanabyar.online
```

## 🚀 دستور آپلود

### 1. آپلود فایل‌های JSON/CSV (بدون صوت)

```powershell
cd scripts/kalameh-extractor
node upload_assets.js
```

این دستور موارد زیر را آپلود می‌کند:
- `songs_index.json` - فهرست کامل آهنگ‌ها
- `songs_flat.json` - نسخه تخت (بدون دسته‌بندی)
- `songs_export.csv` - نسخه CSV
- `songs_schema.sql` - اسکیمای پایگاه داده

### 2. آپلود همراه با فایل‌های صوتی

برای آپلود فایل‌های MP3 هم، متغیر محیطی را تنظیم کنید:

```powershell
$env:UPLOAD_AUDIO='true'
$env:AUDIO_SOURCE_DIR='D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.kalameh.com\mp3'
node upload_assets.js
```

## 📁 مسیرهای سرور

فایل‌ها به مسیرهای زیر آپلود می‌شوند:

- **فایل‌های داده**: `/root/public_html/worship-songs/`
- **فایل‌های صوتی**: `/root/public_html/worship-songs/audio/`

## 🌐 دسترسی به فایل‌ها

بعد از آپلود، فایل‌ها از این آدرس قابل دسترسی هستند:

```
http://samanabyar.online/worship-songs/songs_index.json
http://samanabyar.online/worship-songs/audio/song-name.mp3
```

## 🔍 بررسی اتصال

برای تست اتصال SSH:

```powershell
# Test SSH connection manually
ssh root@ssh.samanabyar.online -p 22
```

## ⚙️ تنظیمات اضافی (اختیاری)

می‌توانید این متغیرها را در `.env` اضافه کنید:

```env
# Optional: Custom paths
LOCAL_EXPORT_DIR=./export
REMOTE_BASE_DIR=/root/public_html/worship-songs
REMOTE_AUDIO_DIR=/root/public_html/worship-songs/audio
UPLOAD_AUDIO=false
AUDIO_SOURCE_DIR=path/to/mp3/files
```

## 🐛 رفع مشکل

### خطا: "Cannot connect to server"
- بررسی کنید که `SSH_HOST` و `SSH_PORT` درست باشند
- مطمئن شوید سرور در دسترس است

### خطا: "Authentication failed"
- بررسی کنید که `SSH_USER` و `SSH_pass` درست باشند
- اگر از کلید SSH استفاده می‌کنید، `SERVER_KEY` را تنظیم کنید

### خطا: "Permission denied"
- مطمئن شوید کاربر SSH مجوز نوشتن در مسیر مقصد را دارد
- ممکن است نیاز باشد پوشه را از قبل بسازید:
  ```bash
  ssh root@ssh.samanabyar.online "mkdir -p /root/public_html/worship-songs"
  ```

## 📊 خروجی نمونه

```
================================================================================
🚀 Worship Songs Asset Uploader
================================================================================

📋 Configuration:
   🌐 Host: ssh.samanabyar.online:22
   👤 User: root
   🔑 Auth: ✓ Password
   📂 Local Export: D:\...\export
   📁 Remote Base: /root/public_html/worship-songs
   🎵 Upload Audio: ✗ No

🔌 Connecting to SFTP server...
✅ Connected successfully to ssh.samanabyar.online

📤 Uploading export files...
   ✓ songs_index.json (15.2 KB)
   ✓ songs_flat.json (14.8 KB)
   ✓ songs_export.csv (12.1 KB)
   ✓ songs_schema.sql (8.5 KB)

✅ Upload complete!
🌐 Files should be accessible at: http://samanabyar.online/worship-songs/
================================================================================
```
