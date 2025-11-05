# 📥 راهنمای دانلود کامل کتاب مقدس از Bible.com

این اسکریپت تمام فصل‌های کتاب مقدس را از Bible.com دانلود می‌کند.

## 🚀 استفاده سریع

### دانلود کامل کتاب مقدس فارسی (نسخه هزارۀ نو):
```powershell
python scripts/download-bible-complete.py --version 118 --language fa
```

### دانلود فقط عهد جدید فارسی:
```powershell
python scripts/download-bible-complete.py --version 118 --language fa --testament nt
```

### دانلود فقط عهد عتیق فارسی:
```powershell
python scripts/download-bible-complete.py --version 118 --language fa --testament ot
```

### دانلود یک کتاب خاص (مثلاً یوحنا):
```powershell
python scripts/download-bible-complete.py --version 118 --language fa --book JHN
```

### دانلود کتاب مقدس انگلیسی KJV:
```powershell
python scripts/download-bible-complete.py --version 1 --language en
```

## 📋 پارامترها

| پارامتر | توضیح | مثال |
|---------|-------|------|
| `--version` | شماره نسخه کتاب مقدس | `118` (هزارۀ نو) |
| `--language` | کد زبان | `fa` (فارسی), `en` (انگلیسی) |
| `--testament` | انتخاب عهد | `ot` (عهد عتیق), `nt` (عهد جدید), `both` (کامل) |
| `--book` | دانلود فقط یک کتاب | `GEN`, `JHN`, `ROM` |
| `--output` | مسیر خروجی | پیش‌فرض: `C:/Users/SamYar/Desktop/Bible/www.bible.com` |

## 🔢 شماره نسخه‌های معروف

### فارسی:
- **118** - هزارۀ نو (New Millennium Version)
- **1619** - کتاب مقدس فارسی
- **1256** - ترجمۀ قدیم
- **1275** - ترجمۀ تفسیری

### انگلیسی:
- **1** - KJV (King James Version)
- **111** - NIV (New International Version)
- **12** - ASV (American Standard Version)
- **97** - MSG (The Message)

## 📚 کدهای کتاب‌ها

### عهد عتیق (Old Testament):
```
GEN (پیدایش), EXO (خروج), LEV (لاویان), NUM (اعداد), DEU (تثنیه)
JOS (یوشع), JDG (داوران), RUT (روت)
1SA, 2SA (سموئیل اول و دوم)
1KI, 2KI (پادشاهان اول و دوم)
1CH, 2CH (تواریخ اول و دوم)
EZR (عزرا), NEH (نحمیا), EST (استر)
JOB (ایوب), PSA (مزامیر), PRO (امثال)
ECC (جامعه), SNG (غزل غزلها)
ISA (اشعیا), JER (ارمیا), LAM (مراثی)
EZK (حزقیال), DAN (دانیال)
HOS (هوشع), JOL (یوئیل), AMO (عاموس)
OBA (عوبدیا), JON (یونس), MIC (میکاه)
NAM (ناحوم), HAB (حبقوق), ZEP (صفنیا)
HAG (حجی), ZEC (زکریا), MAL (ملاکی)
```

### عهد جدید (New Testament):
```
MAT (متی), MRK (مرقس), LUK (لوقا), JHN (یوحنا)
ACT (اعمال), ROM (رومیان)
1CO, 2CO (قرنتیان اول و دوم)
GAL (غلاطیان), EPH (افسسیان)
PHP (فیلیپیان), COL (کولسیان)
1TH, 2TH (تسالونیکیان اول و دوم)
1TI, 2TI (تیموتاؤس اول و دوم)
TIT (تیطس), PHM (فلیمون)
HEB (عبرانیان), JAS (یعقوب)
1PE, 2PE (پطرس اول و دوم)
1JN, 2JN, 3JN (یوحنا اول، دوم و سوم)
JUD (یهودا), REV (مکاشفه)
```

## ⚙️ ویژگی‌ها

- ✅ **دانلود خودکار** تمام 1,189 فصل کتاب مقدس
- 📁 **سازمان‌دهی هوشمند** فایل‌ها در پوشه‌های مجزا
- 🔄 **از سرگیری دانلود** - فایل‌های موجود را رد می‌کند
- 📊 **گزارش پیشرفت** زنده و دقیق
- ⏱️ **تاخیر مودبانه** بین درخواست‌ها (0.5 ثانیه)
- 🛡️ **مدیریت خطا** با retry خودکار
- 📈 **آمار کامل** در پایان دانلود

## 📦 خروجی

فایل‌ها در این ساختار ذخیره می‌شوند:
```
C:\Users\SamYar\Desktop\Bible\www.bible.com\
└── fa\
    └── bible\
        └── 118\
            ├── GEN.1.html
            ├── GEN.2.html
            ├── ...
            ├── JHN.1.html
            ├── JHN.21.html
            └── download_stats.json
```

## 🎯 مثال‌های کاربردی

### 1️⃣ دانلود سریع عهد جدید فارسی (260 فصل):
```powershell
python scripts/download-bible-complete.py --version 118 --language fa --testament nt
```
⏱️ زمان تقریبی: **3-5 دقیقه**

### 2️⃣ دانلود کامل کتاب مقدس فارسی (1,189 فصل):
```powershell
python scripts/download-bible-complete.py --version 118 --language fa
```
⏱️ زمان تقریبی: **15-20 دقیقه**

### 3️⃣ دانلود چند نسخه مختلف:
```powershell
# هزارۀ نو (فارسی)
python scripts/download-bible-complete.py --version 118 --language fa

# ترجمۀ قدیم (فارسی)
python scripts/download-bible-complete.py --version 1256 --language fa

# KJV (انگلیسی)
python scripts/download-bible-complete.py --version 1 --language en
```

## 🔧 عیب‌یابی

### مشکل: "ModuleNotFoundError: No module named 'requests'"
**حل:**
```powershell
pip install requests
```

### مشکل: "Connection timeout"
**حل:** اینترنت خود را بررسی کنید و دوباره اجرا کنید. اسکریپت از جایی که متوقف شده ادامه می‌دهد.

### مشکل: خیلی کند است
**حل:** 
- تاخیر را در خط 110 کاهش دهید: `time.sleep(0.5)` → `time.sleep(0.2)`
- یا فقط عهد جدید را دانلود کنید: `--testament nt`

## 📞 پشتیبانی

اگر مشکلی داشتید، لاگ خطا را بررسی کنید و از `--book` برای تست با یک کتاب استفاده کنید:
```powershell
python scripts/download-bible-complete.py --version 118 --language fa --book GEN
```

---

## 🎉 بعد از دانلود

پس از دانلود کامل، اسکریپت استخراج را اجرا کنید:
```powershell
python scripts/extract-bible-audio-text.py
```

این همه متن، صدا و اطلاعات نسخه‌ها را استخراج و در یک فایل JSON ذخیره می‌کند! 🚀
