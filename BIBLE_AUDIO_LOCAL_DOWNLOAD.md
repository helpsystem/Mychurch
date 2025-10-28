# 🎵 راهنمای دانلود فایل‌های صوتی به Local

## ✅ موفقیت اولیه!

فایل‌های صوتی افسسیان با موفقیت دانلود و در `public/audio/bible/farsi/EPH/` ذخیره شدند!

```
📁 public/audio/bible/farsi/EPH/
   ├─ 1.mp3 (1.07 MB) 
   ├─ 2.mp3 (0.96 MB)
   ├─ 3.mp3 (0.85 MB)
   ├─ 4.mp3 (1.33 MB)
   ├─ 5.mp3 (1.20 MB)
   └─ 6.mp3 (1.03 MB)
```

---

## 🚀 دانلود تمام کتاب‌های فارسی

### گام 1: دانلود همه (66 کتاب)

```bash
node scripts/download-to-public.cjs
```

این دستور:
- 66 کتاب فارسی را از WordProject دانلود می‌کند
- فایل‌ها را در `public/audio/bible/farsi/` ذخیره می‌کند
- دیتابیس را با URL های local به‌روز می‌کند

**زمان تقریبی**: 30-60 دقیقه (بسته به سرعت اینترنت)  
**حجم کلی**: حدود 2-3 GB

### گام 2: دانلود انگلیسی + فارسی

```bash
node scripts/download-to-public.cjs --all-langs
```

---

## 📝 دانلود انتخابی

### یک کتاب خاص:

```bash
# افسسیان
node scripts/download-to-public.cjs --book=EPH

# پیدایش  
node scripts/download-to-public.cjs --book=GEN

# یوحنا
node scripts/download-to-public.cjs --book=JHN
```

### چند کتاب:

```bash
# ابتدا پیدایش
node scripts/download-to-public.cjs --book=GEN

# سپس خروج
node scripts/download-to-public.cjs --book=EXO

# و یوحنا
node scripts/download-to-public.cjs --book=JHN
```

---

## 🔍 بررسی وضعیت

### چک کردن فایل‌های دانلود شده:

```powershell
# لیست فایل‌های افسسیان
Get-ChildItem public/audio/bible/farsi/EPH

# حجم کل فایل‌های دانلود شده
Get-ChildItem public/audio/bible/farsi -Recurse | Measure-Object -Property Length -Sum
```

### چک کردن دیتابیس:

```bash
node scripts/check-audio-database.cjs
```

---

## 🎯 مزایای این روش

### ✅ مزایا:

1. **استقلال کامل**: بدون نیاز به WordProject یا Supabase Storage
2. **سرعت بالا**: فایل‌ها از localhost سرو می‌شوند
3. **Offline**: کار می‌کند حتی بدون اینترنت
4. **کنترل کامل**: تمام فایل‌ها در پروژه شما
5. **Fallback**: اگر لینک external WordProject down باشد، از local استفاده می‌شود

### ⚠️ معایب:

1. **حجم پروژه**: حدود 2-3 GB اضافه می‌شود
2. **Git**: باید فایل‌های صوتی را به `.gitignore` اضافه کنیم
3. **Deploy**: باید فایل‌ها را به production آپلود کنیم

---

## 📦 مدیریت Git

### اضافه کردن به `.gitignore`:

```gitignore
# فایل‌های صوتی (خیلی حجیم هستند)
public/audio/bible/**/*.mp3
```

### نگه‌داری ساختار پوشه‌ها:

```gitignore
# نگه‌داشتن پوشه‌ها
!public/audio/bible/.gitkeep
```

---

## 🌐 استفاده ترکیبی (Hybrid)

### استراتژی پیشنهادی:

1. **Development (Local)**:
   - فایل‌ها در `public/audio/` نگه داری می‌شوند
   - سرعت بالا برای تست و توسعه

2. **Production**:
   - آپلود فایل‌ها به Supabase Storage یا CDN
   - یا استفاده از URL های WordProject (external)
   - Fallback به local اگر external در دسترس نباشد

### تغییر `BilingualPresentationDemo.tsx`:

```typescript
// سعی اول: فایل local
let audioUrl = `/audio/bible/farsi/${bookISO}/${chapterNum}.mp3`;

// اگر local موجود نبود، از external استفاده کن
if (!audioAvailable) {
  audioUrl = `http://audio1.wordfree.net/bibles/app/audio/20/${bookNum}/${chapterNum}.mp3`;
}

// Fallback: TTS
if (!audioUrl) {
  // استفاده از Web Speech API
}
```

---

## 🔄 به‌روزرسانی URL ها

اگر می‌خواهید URL ها را از external به local تغییر دهید:

```bash
# به‌روزرسانی دیتابیس برای افسسیان
node scripts/download-to-public.cjs --book=EPH

# به‌روزرسانی همه
node scripts/download-to-public.cjs
```

اسکریپت به صورت خودکار:
1. فایل را دانلود می‌کند
2. در `public/audio/` ذخیره می‌کند
3. دیتابیس را با URL جدید به‌روز می‌کند (ON CONFLICT UPDATE)

---

## 📊 آمار دانلود

### پیشرفت تا الان:

| زبان | کتاب‌های دانلود شده | مجموع فایل‌ها | حجم تقریبی |
|------|---------------------|--------------|------------|
| فارسی | 1 (EPH) | 6 فایل | 6 MB |
| انگلیسی | 0 | 0 فایل | 0 MB |
| **مجموع** | **1** | **6** | **6 MB** |

### هدف نهایی:

| زبان | کتاب‌ها | فایل‌ها | حجم تقریبی |
|------|---------|---------|------------|
| فارسی | 66 | 1189 | 1.5 GB |
| انگلیسی | 66 | 1189 | 1.5 GB |
| **مجموع** | **132** | **2378** | **3 GB** |

---

## 🛠️ عیب‌یابی

### مشکل: "Cannot find module 'adm-zip'"

```bash
npm install adm-zip
```

### مشکل: "ECONNREFUSED" یا "timeout"

- بررسی اتصال اینترنت
- امتحان مجدد با delay بیشتر
- استفاده از VPN اگر سایت WordProject block شده

### مشکل: "Permission denied"

```bash
# PowerShell را به عنوان Administrator اجرا کنید
```

### مشکل: فایل دانلود نمی‌شود

```bash
# تست مستقیم URL
curl http://audio1.wordfree.net/bibles/app/audio/20_49.zip -o test.zip
```

---

## ✨ مرحله بعدی

### حالا که افسسیان دانلود شد:

1. **تست در مرورگر**:
   ```
   http://localhost:5173/#/bible-presentation
   ```
   فایل صوتی باید از local پخش شود!

2. **دانلود کتاب‌های بیشتر**:
   ```bash
   # انجیل‌ها (سریع‌تر هستند)
   node scripts/download-to-public.cjs --book=MAT
   node scripts/download-to-public.cjs --book=MRK
   node scripts/download-to-public.cjs --book=LUK
   node scripts/download-to-public.cjs --book=JHN
   ```

3. **دانلود همه** (زمان‌بر):
   ```bash
   node scripts/download-to-public.cjs
   ```

---

**تاریخ**: 27 اکتبر 2025  
**وضعیت**: ✅ سیستم دانلود آماده و تست شده
