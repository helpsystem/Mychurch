# 📸 Church Images Setup Guide

## مشکلات فعلی (از Console)

### ❌ Missing Images
1. `apple.png` - آیکون Apple (180x180)
2. `google.png` - آیکون Google (180x180)
3. `card.png` - تصویر نمایش Sermon App (400x300)
4. `church-interior-1.jpg` تا `church-interior-6.jpg` - عکس‌های داخل کلیسا

### ⚠️ Deprecated Meta Tag
```html
<!-- OLD (deprecated) -->
<meta name="apple-mobile-web-app-capable" content="yes">

<!-- NEW (should add) -->
<meta name="mobile-web-app-capable" content="yes">
```

### ⚠️ Preload Warnings
برخی فایل‌های preload استفاده نمی‌شوند و باعث کند شدن می‌شوند.

---

## 🎯 راه حل: استفاده از عکس‌های واقعی کلیسا

### مرحله 1: آماده‌سازی عکس‌ها

از عکس‌هایی که ارسال کردید (تاریخ ۹ نوامبر ۲۰۲۵):

1. **عکس‌های داخل کلیسا:**
   - عکس‌های با پنجره شیشه‌ای رنگی (stained glass)
   - محراب (altar) با صلیب
   - نورپردازی زیبا
   - گیاهان تزئینی

2. **عکس‌های اضافی:**
   - کتاب مقدس روی میز
   - گل آفتابگردان با کتاب مقدس
   - نمایی از پشت سر فردی در حال نگاه به قفسه کتاب

### مرحله 2: Optimization با AI

عکس‌ها باید optimize شوند:
- **Resolution:** 1920x1080 (Full HD)
- **Format:** JPEG (برای عکس) / PNG (برای آیکون)
- **Quality:** 85% (تعادل بین کیفیت و حجم)
- **File Size:** < 500KB per image

---

## 📋 دستورالعمل استفاده

### روش 1: استفاده از اسکریپت Python (پیشنهادی)

```bash
# 1. نصب dependencies
pip install Pillow

# 2. کپی عکس‌های کلیسا
# عکس‌های ارسالی را در پوشه زیر قرار دهید:
./church-photos-source/

# 3. اجرای optimizer
python optimize-church-images.py

# 4. بررسی نتایج
# عکس‌های optimize شده در:
./church-photos-optimized/

# 5. آپلود به سرور
bash upload-images.sh
```

### روش 2: دستی با Windows

```cmd
# 1. اجرای batch file
prepare-church-images.bat

# 2. پیروی از دستورات روی صفحه
```

---

## 🖼️ ساختار فایل‌های مورد نیاز

### عکس‌های کلیسا (از عکس‌های ارسالی شما)

```
public/church-photos/
├── church-interior-1.jpg  → پنجره رنگی + محراب (نمای کامل)
├── church-interior-2.jpg  → نمای نزدیک محراب با نورپردازی
├── church-interior-3.jpg  → نمای کناری با صندلی خدمت
├── church-interior-4.jpg  → نمای تاریک‌تر با فضای خلوت
├── church-interior-5.jpg  → نمای دیگری از محراب
└── church-interior-6.jpg  → نمای کلی کلیسا با نور روز
```

### آیکون‌ها (Placeholder ساخته می‌شود)

```
public/images/
├── apple.png     → Apple Touch Icon (180x180)
├── google.png    → Google PWA Icon (180x180)  
└── card.png      → Preview card (400x300)
```

---

## 🎨 استفاده از AI برای بهینه‌سازی

### پیشنهاد 1: استفاده از ChatGPT/Claude

```
Prompt: "Please optimize this church photo for web:
- Target resolution: 1920x1080
- Output format: JPEG
- Quality: 85%
- Enhance lighting and colors
- Maintain aspect ratio"
```

### پیشنهاد 2: استفاده از Photopea (آنلاین)

1. بروید به: https://www.photopea.com
2. عکس را آپلود کنید
3. Image → Image Size → 1920x1080
4. Filters → Enhance → Auto
5. File → Export as → JPG (Quality: 85)

### پیشنهاد 3: استفاده از TinyPNG

1. بروید به: https://tinypng.com
2. عکس را drag & drop کنید
3. دانلود عکس optimize شده

---

## 🔧 Fix کردن Meta Tags

فایل: `index.html` (خط 12)

### قبل:
```html
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

### بعد:
```html
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

**توضیح:** هر دو meta tag نیاز هستند - یکی برای Android PWA و یکی برای iOS.

---

## 🚀 آپلود و Deploy

### مرحله 1: آپلود فایل‌ها

```bash
# Via SCP
scp church-photos-optimized/*.jpg root@samanabyar.online:/root/Mychurch/public/church-photos/
scp church-photos-optimized/*.png root@samanabyar.online:/root/Mychurch/public/images/
```

### مرحله 2: Rebuild سایت

```bash
ssh root@samanabyar.online
cd /root/Mychurch
npm run build
```

### مرحله 3: تست

```bash
# چک کردن فایل‌ها
curl -I https://samanabyar.online/church-photos/church-interior-1.jpg
curl -I https://samanabyar.online/images/apple.png

# باید HTTP 200 برگرداند
```

---

## ✅ Checklist

- [ ] عکس‌های کلیسا را از تصاویر ارسالی انتخاب کنید
- [ ] با Python script یا manually optimize کنید
- [ ] placeholder icon ها ساخته شوند
- [ ] فایل‌ها را به سرور آپلود کنید
- [ ] index.html را update کنید (meta tags)
- [ ] npm run build اجرا شود
- [ ] سایت را تست کنید (Console errors برطرف شوند)

---

## 📊 نتیجه مورد انتظار

### قبل از Fix:
```
❌ 9 x 404 errors (missing images)
⚠️ Deprecated meta tag warning
⚠️ 3 x Preload warnings
```

### بعد از Fix:
```
✅ 0 errors
✅ All images load correctly
✅ Meta tags up-to-date
✅ Faster page load (optimized images)
```

---

## 🎯 توصیه‌های اضافی

### 1. استفاده از WebP format
برای بهینه‌سازی بیشتر، می‌توانید WebP استفاده کنید:

```html
<picture>
  <source srcset="/church-photos/church-interior-1.webp" type="image/webp">
  <img src="/church-photos/church-interior-1.jpg" alt="Church Interior">
</picture>
```

### 2. Lazy Loading
برای عکس‌هایی که در پایین صفحه هستند:

```html
<img src="..." alt="..." loading="lazy">
```

### 3. Responsive Images
برای سایزهای مختلف صفحه:

```html
<img 
  srcset="
    /church-photos/church-interior-1-480.jpg 480w,
    /church-photos/church-interior-1-800.jpg 800w,
    /church-photos/church-interior-1-1200.jpg 1200w,
    /church-photos/church-interior-1-1920.jpg 1920w
  "
  sizes="(max-width: 768px) 100vw, 80vw"
  src="/church-photos/church-interior-1-1920.jpg"
  alt="Church Interior"
>
```

---

## 📝 نکات مهم

1. **کیفیت عکس‌ها:** عکس‌هایی که ارسال کردید خیلی با کیفیت هستند - نور طبیعی و زاویه‌های خوب
2. **ترکیب‌بندی:** ترکیب پنجره رنگی + صلیب + گیاهان تزئینی بسیار زیباست
3. **نورپردازی:** تنوع بین نور روز و نور مصنوعی گزینه‌های خوبی ایجاد می‌کند
4. **حس فضا:** عکس‌ها احساس آرامش و معنویت را منتقل می‌کنند

---

**آخرین بروزرسانی:** ۱۳ نوامبر ۲۰۲۵  
**وضعیت:** آماده برای پیاده‌سازی  
**اولویت:** 🔴 HIGH (9 تصویر 404 دارند)
