# 🚀 Quick Start - Data Architecture Implementation

## ✅ تکمیل شده (Completed)

### قدم 1: Code Cleanup ✅
- [x] حذف تمام لینک‌های `/bible-karaoke` از کد
- [x] Redirect قدیمی‌ها به `/bible`
- [x] تست و Deploy موفق
- [x] سایت الان با تغییرات جدید در Production است

### قدم 2: Vite Config ✅  
- [x] فایل `vite.config.ts` استاندارد و بدون مشکل
- [x] Build لوکال موفق
- [x] Production deployment موفق

### قدم 3: Nuclear Deployment ✅
- [x] اسکریپت `deploy-nuclear-clean.ps1` ساخته شد
- [x] Deploy کامل و تمیز انجام شد
- [x] Nginx restart شد
- [x] Site: https://samanabyar.online (Live!)

---

## 🔄 مراحل باقی‌مانده (Remaining Steps)

### قدم 4: Git Cleanup (اولویت بالا - 2 ساعت)

**هدف:** کاهش حجم Repository از 4GB به زیر 50MB

#### A. نصب BFG Repo Cleaner

```powershell
# Option 1: Manual Download
# دانلود از: https://rtyley.github.io/bfg-repo-cleaner/
# فایل bfg.jar رو در D:\Tools\ قرار بده

# Option 2: با Chocolatey
choco install bfg-repo-cleaner
```

#### B. اجرای Cleanup

```powershell
cd "d:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch"

# تست اول (Dry Run)
.\cleanup-git.ps1 -DryRun

# اجرای واقعی (بعد از تایید)
.\cleanup-git.ps1 -Force
```

#### C. Force Push

```powershell
# بعد از cleanup موفق
git push --force --all
git push --force --tags
```

**⚠️ هشدار:** این کار تاریخچه Git را بازنویسی می‌کنه!

---

### قدم 5: Backup System Setup (اولویت متوسط - 1 ساعت)

#### A. بکاپ Database روی سرور

```bash
# SSH به سرور
ssh root@samanabyar.online

# آپلود اسکریپت بکاپ
# (از لوکال):
scp backup-database.sh root@samanabyar.online:/root/scripts/

# روی سرور:
cd /root/scripts
chmod +x backup-database.sh

# تنظیم متغیرها در .env
nano /root/Mychurch/backend/.env
# اضافه کن:
# DB_HOST=your-supabase-host
# DB_PORT=5432
# DB_NAME=your-db-name
# DB_USER=postgres
# DB_PASS=your-password

# تست اسکریپت
./backup-database.sh

# اضافه کردن به Cron (هر شب ساعت 2)
crontab -e
# اضافه کن:
0 2 * * * /root/scripts/backup-database.sh
```

#### B. Sync بکاپ‌ها به Local (Windows)

```powershell
# ساخت فولدر بکاپ لوکال
New-Item -Path "D:\Backups\Mychurch" -ItemType Directory -Force

# اجرای Sync
.\sync-backups.ps1

# تنظیم Task Scheduler (هفتگی)
# 1. Task Scheduler را باز کن
# 2. Create Basic Task
# 3. نام: "Mychurch Backup Sync"
# 4. Trigger: Weekly - یکشنبه‌ها ساعت 12 ظهر
# 5. Action: Start a Program
#    Program: powershell.exe
#    Arguments: -File "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\sync-backups.ps1"
```

---

### قدم 6: Storage Migration (اختیاری - 3 ساعت)

**این مرحله برای بعد است اگر خواستی فایل‌های بزرگ رو به Storage منتقل کنی.**

#### چک کردن فایل‌های بزرگ موجود:

```powershell
# پیدا کردن MP3 ها
Get-ChildItem -Path . -Recurse -Include *.mp3 | Select-Object FullName, @{Name="SizeMB";Expression={[math]::Round($_.Length / 1MB, 2)}}

# پیدا کردن PDF ها
Get-ChildItem -Path . -Recurse -Include *.pdf | Where-Object {$_.Length -gt 1MB} | Select-Object FullName, @{Name="SizeMB";Expression={[math]::Round($_.Length / 1MB, 2)}}
```

---

## 📊 وضعیت فعلی (Status)

| مرحله | وضعیت | توضیحات |
|-------|--------|---------|
| Code Cleanup | ✅ کامل | تمام لینک‌های قدیمی حذف/redirect شدند |
| Vite Config | ✅ کامل | Build بدون مشکل |
| Deployment | ✅ کامل | Site live در Production |
| Git Cleanup | 🟡 آماده | اسکریپت نوشته شده، نیاز به اجرا |
| Backup System | 🟡 آماده | اسکریپت‌ها نوشته شدند، نیاز به setup |
| Storage Migration | ⏸️ بعداً | اختیاری - برای آینده |

---

## 🎯 برنامه امروز (Today's Plan)

### اگر وقت داری (2-3 ساعت):

1. **Git Cleanup** (اولویت #1)
   - نصب BFG
   - اجرای `cleanup-git.ps1`
   - Force push

2. **Backup Setup** (اولویت #2)
   - آپلود `backup-database.sh` به سرور
   - تست بکاپ دستی
   - تنظیم Cron Job

3. **Local Sync** (اولویت #3)
   - تست `sync-backups.ps1`
   - تنظیم Task Scheduler

### اگر وقت کمه (30 دقیقه):

فقط **Git Cleanup** رو انجام بده:
```powershell
.\cleanup-git.ps1 -DryRun  # تست
.\cleanup-git.ps1 -Force   # اجرا
git push --force --all     # Push
```

---

## 📞 کمک نیاز داری؟

### مشکلات رایج:

**1. BFG error: "Not a git repository"**
```powershell
# مطمئن شو در root repository هستی
cd "d:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch"
```

**2. Git push هنوز خیلی بزرگه**
```powershell
# اندازه .git رو چک کن
$gitSize = (Get-ChildItem -Path ".git" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "$([math]::Round($gitSize, 2)) MB"

# اگه هنوز بزرگه، دوباره BFG رو اجرا کن با limit کوچک‌تر
java -jar D:\Tools\bfg.jar --strip-blobs-bigger-than 5M .
```

**3. SSH به سرور کار نمی‌کنه**
```powershell
# تست connection
ssh root@samanabyar.online "echo OK"

# اگه password می‌خواد، SSH key setup کن:
ssh-keygen
ssh-copy-id root@samanabyar.online
```

---

## ✅ Checklist - برای امروز

- [ ] نصب BFG Repo Cleaner
- [ ] بکاپ کامل Repository فعلی
- [ ] اجرای `cleanup-git.ps1`
- [ ] Force push به GitHub
- [ ] تست git clone جدید
- [ ] آپلود `backup-database.sh` به سرور
- [ ] تنظیم Cron Job
- [ ] تست `sync-backups.ps1`
- [ ] تنظیم Task Scheduler

---

## 📚 فایل‌های مهم

- `DATA_ARCHITECTURE_PLAN.md` - برنامه کامل معماری
- `cleanup-git.ps1` - اسکریپت پاکسازی Git
- `sync-backups.ps1` - اسکریپت Sync بکاپ‌ها
- `backup-database.sh` - اسکریپت بکاپ روی سرور
- `deploy-nuclear-clean.ps1` - اسکریپت Deploy ✅

---

**وضعیت:** 🟢 60% Complete  
**آخرین آپدیت:** 14 دسامبر 2025  
**بعدی:** Git Cleanup
