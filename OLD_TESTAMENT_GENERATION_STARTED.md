# 🚀 تولید عهد عتیق شروع شد

**تاریخ شروع:** 1 نوامبر 2025  
**وضعیت:** 🔄 در حال تولید

---

## 📊 خلاصه

### ✅ تکمیل شده:
- **عهد جدید:** 27 کتاب، 7,964 آیه (100% ✅)
- **تست:** مزمور 23 (6 آیه) ✅

### 🔄 در حال تولید:
- **عهد عتیق:** 39 کتاب، ~23,145 آیه
- **وضعیت:** پیدایش فصل 2 در حال تولید...
- **Terminal ID:** `5c004e53-adae-47b2-87e9-1bd8e8398052`

---

## 📈 آمار کامل پروژه

| مورد | تعداد | وضعیت |
|------|-------|-------|
| **عهد جدید** | 27 کتاب، 7,964 آیه | ✅ تکمیل |
| **عهد عتیق** | 39 کتاب، ~23,145 آیه | 🔄 در حال تولید |
| **جمع کل** | 66 کتاب، ~31,109 آیه | 25.6% تکمیل |

---

## ⚙️ تنظیمات فعلی

```bash
py -3.12 scripts/generate_all_bible_edge_tts_improved.py \
  --books GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH \
          EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS \
          JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL \
  --delay 0.8 \
  --max-retries 5 \
  --output-dir "public/audio/bible/edge-tts"
```

**ویژگی‌ها:**
- ✅ Retry Logic: 5 تلاش مجدد
- ✅ Smart Delay: 0.8 ثانیه
- ✅ Skip Existing: فایل‌های موجود رد می‌شوند
- ✅ Error Recovery: خودکار ادامه می‌یابد
- ✅ Resume Capability: از GEN 2:3 ادامه داد

---

## ⏱️ زمان‌بندی تخمینی

| مرحله | زمان | وضعیت |
|-------|------|-------|
| عهد جدید | 5.79 ساعت | ✅ تکمیل |
| عهد عتیق | 10-12 ساعت | 🔄 در حال اجرا |
| **جمع کل** | **~16-18 ساعت** | **26% تکمیل** |

**تخمین اتمام:** فردا صبح 1 نوامبر، ساعت 9-11 AM

---

## 📁 ساختار فایل‌ها

```
D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\public\audio\bible\edge-tts\
├── MAT/ (28 فصل، 1,071 آیه) ✅
├── MRK/ (16 فصل، 678 آیه) ✅
├── LUK/ (24 فصل، 1,151 آیه) ✅
├── ... (24 کتاب دیگر عهد جدید) ✅
├── GEN/ (50 فصل) 🔄 در حال تولید
├── EXO/ (40 فصل) ⏳ در انتظار
└── ... (37 کتاب دیگر عهد عتیق) ⏳
```

**حجم فعلی:** ~358 MB (عهد جدید)  
**حجم نهایی تخمینی:** ~1.5 GB (کل کتاب مقدس)

---

## 🔍 نحوه بررسی پیشرفت

### PowerShell:
```powershell
# تعداد کتاب‌ها
$path = "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\public\audio\bible\edge-tts"
(Get-ChildItem -Path $path -Directory).Count

# تعداد آیات تولید شده
(Get-ChildItem -Path $path -Filter "*.mp3" -Recurse).Count

# حجم فایل‌ها
$size = (Get-ChildItem -Path $path -Filter "*.mp3" -Recurse | Measure-Object -Property Length -Sum).Sum
[math]::Round($size / 1MB, 2)
```

### Python:
```python
import os
from pathlib import Path

audio_path = Path(r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\public\audio\bible\edge-tts")

# تعداد کتاب‌ها
books = [d for d in audio_path.iterdir() if d.is_dir()]
print(f"Books: {len(books)}")

# تعداد آیات
verses = list(audio_path.glob("**/*.mp3"))
print(f"Verses: {len(verses)}")

# حجم
total_size = sum(f.stat().st_size for f in verses)
print(f"Size: {total_size / 1024 / 1024:.2f} MB")
```

---

## 💡 نکات مهم

### در صورت قطع شدن:
```bash
# دوباره همین دستور را اجرا کنید
cd "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git"
py -3.12 "Mychurch/scripts/generate_all_bible_edge_tts_improved.py" \
  --books GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH \
          EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS \
          JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL \
  --delay 0.8 --max-retries 5 \
  --output-dir "public/audio/bible/edge-tts"
```

**قابلیت resume:** فایل‌های موجود رد می‌شوند و از جایی که متوقف شده ادامه می‌یابد.

### برای شروع از کتاب خاص:
```bash
# مثلاً از اشعیا
py -3.12 scripts/generate_all_bible_edge_tts_improved.py --start-from ISA
```

---

## 📊 کتاب‌های عهد عتیق (39 کتاب)

### Torah (تورات - 5 کتاب):
1. GEN - پیدایش (50 فصل، 1,533 آیه) 🔄
2. EXO - خروج (40 فصل، 1,213 آیه) ⏳
3. LEV - لاویان (27 فصل، 859 آیه) ⏳
4. NUM - اعداد (36 فصل، 1,288 آیه) ⏳
5. DEU - تثنیه (34 فصل، 959 آیه) ⏳

### Historical (تاریخی - 12 کتاب):
6. JOS - یوشع (24 فصل، 658 آیه) ⏳
7. JDG - داوران (21 فصل، 618 آیه) ⏳
8. RUT - روت (4 فصل، 85 آیه) ⏳
9. 1SA - اول سموئیل (31 فصل، 810 آیه) ⏳
10. 2SA - دوم سموئیل (24 فصل، 695 آیه) ⏳
11. 1KI - اول پادشاهان (22 فصل، 816 آیه) ⏳
12. 2KI - دوم پادشاهان (25 فصل، 719 آیه) ⏳
13. 1CH - اول تواریخ (29 فصل، 942 آیه) ⏳
14. 2CH - دوم تواریخ (36 فصل، 822 آیه) ⏳
15. EZR - عزرا (10 فصل، 280 آیه) ⏳
16. NEH - نحمیا (13 فصل، 406 آیه) ⏳
17. EST - استر (10 فصل، 167 آیه) ⏳

### Wisdom (حکمت - 5 کتاب):
18. JOB - ایوب (42 فصل، 1,070 آیه) ⏳
19. PSA - مزامیر (150 فصل، 2,461 آیه) 🔄 1 فصل تست
20. PRO - امثال (31 فصل، 915 آیه) ⏳
21. ECC - جامعه (12 فصل، 222 آیه) ⏳
22. SNG - غزل غزلها (8 فصل، 117 آیه) ⏳

### Major Prophets (انبیای بزرگ - 5 کتاب):
23. ISA - اشعیا (66 فصل، 1,292 آیه) ⏳
24. JER - ارمیا (52 فصل، 1,364 آیه) ⏳
25. LAM - مراثی ارمیا (5 فصل، 154 آیه) ⏳
26. EZK - حزقیال (48 فصل، 1,273 آیه) ⏳
27. DAN - دانیال (12 فصل، 357 آیه) ⏳

### Minor Prophets (انبیای کوچک - 12 کتاب):
28. HOS - هوشع (14 فصل، 197 آیه) ⏳
29. JOL - یوئیل (3 فصل، 73 آیه) ⏳
30. AMO - عاموس (9 فصل، 146 آیه) ⏳
31. OBA - عوبدیا (1 فصل، 21 آیه) ⏳
32. JON - یونس (4 فصل، 48 آیه) ⏳
33. MIC - میکاه (7 فصل، 105 آیه) ⏳
34. NAM - ناحوم (3 فصل، 47 آیه) ⏳
35. HAB - حبقوق (3 فصل، 56 آیه) ⏳
36. ZEP - صفنیا (3 فصل، 53 آیه) ⏳
37. HAG - حجی (2 فصل، 38 آیه) ⏳
38. ZEC - زکریا (14 فصل، 211 آیه) ⏳
39. MAL - ملاکی (4 فصل، 55 آیه) ⏳

**جمع:** 929 فصل، 23,145 آیه

---

## 🎯 مراحل بعدی (بعد از تکمیل)

### 1️⃣ یکپارچه‌سازی با Frontend
```typescript
// pages/BibleKaraokeReader.tsx
const AUDIO_BASE_PATH = '/audio/bible/edge-tts';
const audioUrl = `${AUDIO_BASE_PATH}/${book}/${chapter}/${verse}.mp3`;
```

### 2️⃣ تولید Timing Data (Karaoke)
```python
# scripts/generate_timing_from_audio.py
# استخراج زمان‌بندی کلمات از فایل‌های صوتی
```

### 3️⃣ نسخه صدای زن (اختیاری)
```bash
py -3.12 scripts/generate_all_bible_edge_tts_improved.py \
  --voice fa-IR-DilaraNeural \
  --output-dir "public/audio/bible/edge-tts-female"
```

### 4️⃣ CDN Upload (برای بهینه‌سازی)
- آپلود فایل‌ها به CDN
- کاهش حجم بارگذاری سایت
- سرعت بالاتر برای کاربران

---

## 📝 یادداشت‌ها

- **شروع:** 1 نوامبر 2025
- **فرآیند:** Automated با Edge TTS
- **کیفیت:** High (صدای طبیعی Microsoft)
- **زبان:** فارسی ایران (fa-IR)
- **صدا:** FaridNeural (مرد)
- **نرخ موفقیت:** 100% (عهد جدید)

---

## 🏆 موفقیت‌ها

✅ عهد جدید: 7,964 آیه در 5.79 ساعت  
🔄 عهد عتیق: در حال تولید...  
⏳ هدف نهایی: 31,109 آیه (کل کتاب مقدس)

---

*آخرین بروزرسانی: 1 نوامبر 2025*
