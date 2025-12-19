# 🏗️ Data Architecture & Organization Plan
## Iranian Christian Church DC Website

**تاریخ:** دسامبر ۲۰۲۵  
**هدف:** مرتب‌سازی کامل فایل‌ها، بکاپ‌ها و کاهش حجم Git Repository

---

## 📋 وضعیت فعلی (Current Status)

### ❌ مشکلات:
- **Git Repository:** حدود **4 GB** (باید زیر 100 MB باشه!)
- فایل‌های بزرگ در تاریخچه Git:
  - `worship-audio.tar.gz` - 1.4 GB
  - `mychurch-dist.tar.gz` - 685 MB  
  - `bible-audio.tar.gz` - 238 MB
  - PDF و MP3 فایل‌های متعدد
- `git push` کار نمی‌کنه به دلیل حجم
- Deployment کند است

---

## 🎯 معماری جدید (Target Architecture)

### 1️⃣ **Git Repository** (فقط کد)
**محتویات مجاز:**
- ✅ کدهای TypeScript/JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`)
- ✅ فایل‌های CSS/SCSS
- ✅ فایل‌های Config (`package.json`, `vite.config.ts`, `tsconfig.json`)
- ✅ تصاویر کوچک UI (< 100 KB) مثل لوگو، آیکون‌ها
- ✅ فایل‌های Markdown مستندات

**ممنوعیت‌ها:**
- ❌ فایل‌های صوتی (MP3, WAV)
- ❌ فایل‌های ویدیویی (MP4, AVI)
- ❌ فایل‌های PDF بزرگ
- ❌ فایل‌های فشرده (tar.gz, zip)
- ❌ فولدر `node_modules`, `dist`, `build`
- ❌ فایل‌های موقت/cache

**حجم هدف:** < 50 MB

---

### 2️⃣ **Database (Supabase PostgreSQL)**
**محتویات:**
```
Tables:
├── users                     # کاربران و احراز هویت
├── bible_verses              # متن آیات کتاب مقدس
├── bible_books               # اطلاعات کتاب‌ها
├── worship_songs             # متن و اطلاعات سرودها
│   ├── title_fa, title_en
│   ├── lyrics_fa, lyrics_en
│   ├── audioUrl (لینک به HiDrive)
│   ├── pdfUrl (لینک به HiDrive)
│   └── timingUrl (لینک به فایل timing JSON)
├── sermons                   # عنوان و توضیحات موعظه‌ها
│   └── videoUrl (لینک به HiDrive)
├── events                    # رویدادها
└── gallery_images            # توضیحات تصاویر
    └── imageUrl (لینک به HiDrive)
```

**نکته مهم:** دیتابیس فقط **متن** و **URL** نگه میداره، نه فایل‌های واقعی!

---

### 3️⃣ **Storage (HiDrive / VPS Storage)**

#### 📁 ساختار فولدرها:

```
/storage/                                    # Root Storage
│
├── worship/                                 # 🎵 سرودها
│   ├── audio/
│   │   ├── song_1.mp3
│   │   ├── song_2.mp3
│   │   └── ...
│   ├── pdf/
│   │   ├── song_1_chords.pdf
│   │   └── ...
│   └── timings/
│       ├── song_1_timing.json
│       └── ...
│
├── bible/                                   # 📖 کتاب مقدس
│   ├── audio/
│   │   ├── fa/                             # فارسی
│   │   │   ├── GEN_001.mp3
│   │   │   ├── GEN_002.mp3
│   │   │   └── ...
│   │   └── en/                             # انگلیسی
│   │       └── ...
│   └── timings/
│       ├── GEN_001_timing.json
│       └── ...
│
├── sermons/                                 # 🎤 موعظه‌ها
│   ├── video/
│   │   ├── 2025-01-05_sermon.mp4
│   │   └── ...
│   └── thumbnails/
│       └── ...
│
├── gallery/                                 # 🖼️ گالری تصاویر
│   ├── events/
│   ├── ministry/
│   └── church/
│
└── backups/                                 # 💾 بکاپ‌ها
    ├── database/
    │   ├── 2025-12-14_db_backup.sql
    │   └── ...
    └── config/
        └── ...
```

**URL Format:**
```
https://samanabyar.online/storage/worship/audio/song_123.mp3
https://samanabyar.online/storage/bible/audio/fa/GEN_001.mp3
```

---

### 4️⃣ **Local Backups** (سیستم شخصی)

#### 📁 ساختار بکاپ لوکال:
```
D:\Backups\Mychurch\
│
├── Database\
│   ├── daily\
│   │   ├── 2025-12-14.sql
│   │   ├── 2025-12-13.sql
│   │   └── ... (30 روز اخیر)
│   └── monthly\
│       ├── 2025-12.sql
│       └── ...
│
├── Storage\                                # Mirror of cloud storage
│   ├── worship\
│   ├── bible\
│   ├── sermons\
│   └── gallery\
│
├── Code\                                   # Git clone (clean)
│   └── Mychurch\
│
└── Configs\
    ├── nginx.conf
    ├── .env.production
    └── ...
```

---

## 🚀 مراحل اجرا (Implementation Steps)

### ✅ مرحله 1: Git Cleanup (فوری - 2 ساعت)

**هدف:** کاهش حجم Git از 4GB به زیر 50MB

```powershell
# 1. نصب BFG Repo Cleaner
# دانلود از: https://rtyley.github.io/bfg-repo-cleaner/
# یا با Chocolatey: choco install bfg-repo-cleaner

# 2. بکاپ کامل Repository
Copy-Item -Path "D:\...\Mychurch" -Destination "D:\...\Mychurch_BACKUP" -Recurse

# 3. حذف فایل‌های بزرگ از تاریخچه
cd "D:\...\Mychurch"
java -jar bfg.jar --strip-blobs-bigger-than 10M .
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Force push (بعد از تایید تیم)
git push --force --all
git push --force --tags
```

**فایل‌های هدف حذف:**
- `*.tar.gz`
- `*.mp3` (جز sample‌های کوچک)
- `*.mp4`
- `*.pdf` بزرگتر از 1MB
- فولدر `cache/`
- فولدر `dist/` و `build/`

---

### ✅ مرحله 2: Storage Migration (امروز - 3 ساعت)

**الف. انتقال فایل‌های موجود به Storage:**

```powershell
# اسکریپت: migrate-to-storage.ps1
# این اسکریپت فایل‌های بزرگ رو از Git به Storage منتقل می‌کنه
```

**ب. آپدیت Database URLs:**

```sql
-- تغییر URL‌ها در دیتابیس
UPDATE worship_songs 
SET audioUrl = REPLACE(audioUrl, '/worship/', 'https://samanabyar.online/storage/worship/');

UPDATE sermons 
SET videoUrl = REPLACE(videoUrl, '/videos/', 'https://samanabyar.online/storage/sermons/');
```

---

### ✅ مرحله 3: Automated Backups (امروز - 1 ساعت)

#### A. بکاپ دیتابیس (روزانه - ساعت 2 بامداد)

**سرور:** اسکریپت Cron روی VPS

```bash
#!/bin/bash
# /root/scripts/backup-database.sh

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/var/www/storage/backups/database"
DB_NAME="your_database"

# Export database
pg_dump $DB_NAME > "$BACKUP_DIR/daily/$DATE.sql"

# ماهیانه
if [ $(date +%d) -eq 1 ]; then
    cp "$BACKUP_DIR/daily/$DATE.sql" "$BACKUP_DIR/monthly/$(date +%Y-%m).sql"
fi

# حذف بکاپ‌های قدیمی‌تر از 30 روز
find "$BACKUP_DIR/daily" -name "*.sql" -mtime +30 -delete

echo "Backup completed: $DATE"
```

**Cron Job:**
```bash
0 2 * * * /root/scripts/backup-database.sh
```

#### B. Sync به Local (هفتگی)

```powershell
# sync-backups.ps1
$SERVER = "root@samanabyar.online"
$REMOTE_PATH = "/var/www/storage/backups"
$LOCAL_PATH = "D:\Backups\Mychurch\Database"

# دانلود بکاپ‌های جدید
scp -r "${SERVER}:${REMOTE_PATH}/database/daily/*" "$LOCAL_PATH\daily\"
scp -r "${SERVER}:${REMOTE_PATH}/database/monthly/*" "$LOCAL_PATH\monthly\"

Write-Host "✅ Backups synced successfully" -ForegroundColor Green
```

**Windows Task Scheduler:** هر یکشنبه ساعت 12 ظهر

---

### ✅ مرحله 4: .gitignore Update (فوری - 5 دقیقه)

```gitignore
# .gitignore (آپدیت شده)

# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
out/
.next/

# Cache & Temp
.cache/
cache/
tmp/
*.log
.DS_Store
Thumbs.db

# Audio/Video/PDF (باید در Storage باشن)
*.mp3
*.mp4
*.wav
*.avi
*.mov
*.pdf
!docs/**/*.pdf  # فقط PDFهای مستندات مجازند

# Archives
*.tar.gz
*.zip
*.rar
*.7z

# Large data files
*.csv
*.json
# مگر اینکه کوچک باشن:
!package.json
!package-lock.json
!tsconfig.json

# Env files (حاوی اطلاعات حساس)
.env
.env.local
.env.production
.env.development

# IDE
.vscode/
.idea/
*.swp
*.swo

# Backups
*.backup
*.bak
```

---

## 📊 مقایسه قبل/بعد

| مورد | قبل | بعد |
|------|-----|-----|
| **حجم Git** | ~4 GB | < 50 MB |
| **زمان git clone** | 20+ دقیقه | < 1 دقیقه |
| **زمان git push** | ناموفق | < 10 ثانیه |
| **سرعت Deployment** | 10+ دقیقه | < 2 دقیقه |
| **بکاپ Database** | دستی | اتوماتیک روزانه |
| **بکاپ Files** | ندارد | اتوماتیک هفتگی |

---

## 🔒 امنیت و Disaster Recovery

### سطوح بکاپ:

1. **Live Production:**
   - Database: Supabase (Automatic backups)
   - Storage: VPS `/var/www/storage/`
   - Code: GitHub (cleaned)

2. **Daily Backups:**
   - Database: VPS `/var/www/storage/backups/database/daily/`
   - 30 روز نگهداری

3. **Monthly Backups:**
   - Database: VPS `/var/www/storage/backups/database/monthly/`
   - یک سال نگهداری

4. **Local Mirror:**
   - `D:\Backups\Mychurch\` (کپی هفتگی از همه چیز)

### بازیابی در صورت فاجعه:

```powershell
# Restore از بکاپ لوکال
# 1. Restore Database
psql your_database < "D:\Backups\Mychurch\Database\daily\2025-12-14.sql"

# 2. Restore Storage Files
scp -r "D:\Backups\Mychurch\Storage\*" root@samanabyar.online:/var/www/storage/

# 3. Redeploy Code
git clone https://github.com/yourrepo/Mychurch.git
cd Mychurch
npm install
npm run build
# ... deploy
```

---

## 📝 Checklist - مراحل اجرا

### امروز (اولویت بالا):
- [ ] بکاپ کامل Repository فعلی
- [ ] اجرای BFG Repo Cleaner
- [ ] آپدیت `.gitignore`
- [ ] تست `git push` بعد از cleanup
- [ ] ساخت اسکریپت `backup-database.sh`
- [ ] نصب Cron Job برای بکاپ
- [ ] ساخت اسکریپت `sync-backups.ps1`

### این هفته:
- [ ] انتقال فایل‌های MP3 به Storage
- [ ] انتقال فایل‌های PDF به Storage
- [ ] آپدیت URLs در Database
- [ ] تست دانلود فایل‌ها از Storage
- [ ] تنظیم Task Scheduler برای sync لوکال

### ماه آینده:
- [ ] مانیتورینگ حجم Storage
- [ ] بهینه‌سازی فایل‌های صوتی (compress)
- [ ] CDN setup (optional)

---

## 🛠️ اسکریپت‌های مورد نیاز

۱. `cleanup-git.ps1` - حذف فایل‌های بزرگ از Git
۲. `migrate-to-storage.ps1` - انتقال فایل‌ها به Storage
۳. `backup-database.sh` - بکاپ روزانه دیتابیس (Linux)
۴. `sync-backups.ps1` - Sync بکاپ‌ها به Local (Windows)
۵. `deploy-nuclear-clean.ps1` - Deploy کامل و تمیز ✅ (موجود است)

---

## 📞 پشتیبانی

در صورت بروز مشکل:
1. بکاپ لوکال در `D:\Backups\Mychurch\` موجود است
2. Git Repository قدیمی در `Mychurch_BACKUP` است
3. بکاپ روزانه Database در VPS موجود است

---

**وضعیت:** 🟡 در حال اجرا  
**آخرین آپدیت:** 14 دسامبر 2025
