# 🌐 HiDrive Storage Migration Guide
## انتقال فایل‌های سنگین به IONOS HiDrive

این راهنما شامل تمام مراحل لازم برای انتقال فایل‌های سنگین از سرور به HiDrive Storage است.

---

## 📋 مرحله 1: تنظیمات اولیه

### 1.1. پسورد HiDrive را تنظیم کنید

**در فایل `backend/.env` محلی:**
```bash
# IONOS HiDrive Storage
HIDRIVE_HOST=sftp.hidrive.ionos.com
HIDRIVE_PORT=22
HIDRIVE_USER=adminchurch
HIDRIVE_PASSWORD=YOUR_ACTUAL_PASSWORD_HERE
HIDRIVE_BASE_PATH=/users/adminchurch/mychurch
HIDRIVE_PUBLIC_URL=https://webdav.hidrive.ionos.com/users/adminchurch/mychurch
```

**در سرور (`root@samanabyar.online`):**
```bash
ssh root@samanabyar.online
nano /root/Mychurch/backend/.env

# اضافه کردن خطوط بالا با پسورد واقعی
# Ctrl+X, Y, Enter برای ذخیره
```

### 1.2. نصب package ها

**محلی:**
```bash
npm install ssh2-sftp-client
```

**روی سرور:**
```bash
ssh root@samanabyar.online
cd /root/Mychurch
npm install ssh2-sftp-client
pm2 restart mychurch-backend
```

---

## 🚚 مرحله 2: Migration فایل‌ها

### 2.1. از محلی (Local)

```bash
# تست اتصال
node scripts/test-hidrive-connection.cjs

# شروع migration
node scripts/migrate-to-hidrive.cjs
```

### 2.2. از روی سرور

```bash
ssh root@samanabyar.online
cd /root/Mychurch

# تست اتصال
node scripts/test-hidrive-connection.cjs

# Migration تمام فایل‌ها
node scripts/migrate-to-hidrive.cjs
```

---

## 📊 مرحله 3: بررسی نتایج

بعد از migration، فایل‌ها در این مسیرها قرار می‌گیرند:

### **Structure در HiDrive:**
```
/users/adminchurch/mychurch/
├── bible/
│   ├── timings/          # Bible timing JSON files
│   └── audio/            # Bible audio files (if available)
├── worship/
│   ├── audio/            # Worship song MP3 files
│   └── data/             # Worship data JSON/TXT files
├── sermons/
│   ├── audio/            # Sermon audio files
│   └── videos/           # Sermon video files
├── images/               # Church images
├── documents/            # PDF/DOC files
└── config/
    └── hidrive_mapping.json  # نقشه فایل‌های فارسی
```

### **Public URLs:**
همه فایل‌ها از این آدرس در دسترس هستند:
```
https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/[category]/[subcategory]/[filename]
```

مثال:
```
https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/song_847125da.mp3
```

---

## 🔄 مرحله 4: Update URLs در Database

### 4.1. Worship Songs

```bash
# روی سرور
ssh root@samanabyar.online
cd /root/Mychurch

# اجرای update script
node scripts/update-worship-urls.cjs
```

یا از **API Endpoint**:
```bash
curl -X POST http://localhost:3001/api/hidrive/migrate-worship-songs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4.2. Bible Files

```sql
-- Update Bible timing files
UPDATE bible_audio_files 
SET timing_url = REPLACE(
  timing_url, 
  '/bible/data/timings/', 
  'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/bible/timings/'
)
WHERE timing_url LIKE '/bible/data/timings/%';
```

---

## 💻 مرحله 5: Frontend Integration

### 5.1. ساخت HiDrive Service در Frontend

**فایل: `src/services/hidriveService.ts`**
```typescript
const HIDRIVE_BASE_URL = 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch';

export class HiDriveService {
  static getFileUrl(category: string, subcategory: string, filename: string): string {
    let path = `/${category}`;
    if (subcategory) {
      path += `/${subcategory}`;
    }
    path += `/${filename}`;
    
    return HIDRIVE_BASE_URL + path;
  }

  static async loadMapping(): Promise<Record<string, any>> {
    try {
      const response = await fetch(`${HIDRIVE_BASE_URL}/config/hidrive_mapping.json`);
      return await response.json();
    } catch {
      return {};
    }
  }

  static getWorshipAudioUrl(filename: string, mapping: Record<string, any>): string {
    // اگر فایل در mapping باشه، از safe name استفاده کن
    const mappedFile = Object.entries(mapping).find(
      ([_, data]: [string, any]) => data.original === filename
    );
    
    const safeName = mappedFile ? mappedFile[0] : filename;
    
    return this.getFileUrl('worship', 'audio', safeName);
  }
}
```

### 5.2. Update Audio Player Component

```tsx
import { HiDriveService } from '@/services/hidriveService';

const AudioPlayer: React.FC<Props> = ({ song }) => {
  const [mapping, setMapping] = useState({});

  useEffect(() => {
    HiDriveService.loadMapping().then(setMapping);
  }, []);

  const audioUrl = useMemo(() => {
    if (song.audioUrl.startsWith('http')) {
      return song.audioUrl; // Already external URL
    }
    
    return HiDriveService.getWorshipAudioUrl(
      path.basename(song.audioUrl),
      mapping
    );
  }, [song.audioUrl, mapping]);

  return <audio src={audioUrl} controls />;
};
```

---

## 🔍 مرحله 6: Testing

### 6.1. تست دسترسی به فایل‌ها

```bash
# تست یک فایل
curl -I "https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/song_847125da.mp3"

# باید HTTP 200 OK برگردونه
```

### 6.2. تست از مرورگر

1. باز کردن Developer Console (F12)
2. رفتن به سایت
3. پخش یک آهنگ worship
4. بررسی Network tab برای URL صحیح

### 6.3. تست Mapping

```bash
# دانلود mapping file
curl "https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/config/hidrive_mapping.json"

# باید JSON با لیست فایل‌های فارسی برگردونه
```

---

## 🔐 مرحله 7: Upload جدید

### 7.1. از Admin Panel

1. لاگین به Admin Dashboard
2. رفتن به Upload Section
3. انتخاب فایل و Category
4. آپلود → خودکار به HiDrive می‌ره

### 7.2. Programmatic Upload

```javascript
// در backend
const hidriveService = require('./backend/services/hidriveService');

const result = await hidriveService.uploadFile(
  './path/to/file.mp3',
  'worship',
  'audio'
);

console.log('Uploaded:', result.publicUrl);
```

### 7.3. از API

```bash
curl -X POST http://localhost:3001/api/hidrive/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@song.mp3" \
  -F "category=worship" \
  -F "subcategory=audio"
```

---

## 🧹 مرحله 8: پاکسازی فایل‌های قدیمی (بعد از تست)

**⚠️ هشدار: فقط بعد از اطمینان کامل از عملکرد صحیح!**

```bash
ssh root@samanabyar.online
cd /root/Mychurch

# Backup اول
tar -czf backup-old-files-$(date +%Y%m%d).tar.gz public/worship/audio public/bible/data/timings

# انتقال backup به جای امن
scp backup-old-files-*.tar.gz user@backup-server:/backups/

# حذف فایل‌های قدیمی
rm -rf public/worship/audio/*
rm -rf public/bible/data/timings/*

# Verify
du -sh public/worship/audio
du -sh public/bible/data/timings
```

---

## 📱 مرحله 9: Monitoring

### 9.1. Check Storage Usage

```bash
# از API
curl http://localhost:3001/api/hidrive/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 9.2. View Logs

```bash
ssh root@samanabyar.online
pm2 logs mychurch-backend --lines 100 | grep -i hidrive
```

### 9.3. Test File Streaming

```bash
# تست stream endpoint
curl -I "http://localhost:3001/api/hidrive/stream/worship/audio/song.mp3"
```

---

## 🆘 عیب‌یابی (Troubleshooting)

### مشکل 1: اتصال به HiDrive ناموفق

**علت:** پسورد اشتباه یا نبود package

**راه حل:**
```bash
# چک کردن .env
cat backend/.env | grep HIDRIVE

# نصب package
npm install ssh2-sftp-client

# تست مجدد
node scripts/test-hidrive-connection.cjs
```

### مشکل 2: فایل‌ها لود نمی‌شن

**علت:** CORS یا URL اشتباه

**راه حل:**
```javascript
// در backend/server.js
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});
```

### مشکل 3: فایل‌های فارسی پیدا نمی‌شن

**علت:** mapping file لود نشده

**راه حل:**
```typescript
// Pre-load mapping در App.tsx
useEffect(() => {
  fetch('https://webdav.hidrive.ionos.com/.../hidrive_mapping.json')
    .then(r => r.json())
    .then(setGlobalMapping);
}, []);
```

---

## 📌 نکات مهم

1. ✅ **همیشه backup بگیر** قبل از حذف فایل‌های قدیمی
2. ✅ **تست کامل** روی محیط Development قبل از Production
3. ✅ **Mapping file** رو همیشه sync نگه دار
4. ✅ **Monitor** کن که همه فایل‌ها درست لود میشن
5. ✅ **Documentation** رو update کن بعد از تغییرات

---

## 🎯 Checklist نهایی

- [ ] پسورد HiDrive تنظیم شده
- [ ] Package `ssh2-sftp-client` نصب شده
- [ ] تست اتصال موفق
- [ ] Migration اجرا شده
- [ ] URLs در database update شدن
- [ ] Frontend integration کامل شده
- [ ] تست کامل انجام شده
- [ ] فایل‌ها درست لود میشن
- [ ] Mapping file کار می‌کنه
- [ ] Backup گرفته شده
- [ ] فایل‌های قدیمی حذف شدن (اختیاری)
- [ ] Monitoring فعال شده

---

## 📞 Support

اگر مشکلی پیش اومد:
1. لاگ‌های PM2 رو چک کن: `pm2 logs mychurch-backend`
2. تست اتصال رو دوباره بزن
3. فایل `.env` رو بررسی کن
4. CORS headers رو چک کن

---

**📅 تاریخ ایجاد:** نوامبر 2025  
**✍️ نویسنده:** GitHub Copilot  
**🔄 آخرین بروزرسانی:** نوامبر 17, 2025
