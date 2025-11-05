# 🔧 YouVersion Audio Sync - Troubleshooting Guide

## خطای "Failed to fetch"

اگر این خطا را می‌بینید، یکی از این مشکلات است:

### 1️⃣ Vite Server در حال اجرا نیست

**علائم:**
- خطا: `Failed to fetch`
- در Console: `net::ERR_CONNECTION_REFUSED`

**راه حل:**
```bash
# در VS Code Terminal جدید
npm run dev

# منتظر بمانید تا این پیام را ببینید:
# ➜  Local:   http://localhost:5173/
```

**نکته مهم:** Terminal را بسته نکنید! Vite باید در حال اجرا بماند.

---

### 2️⃣ مسیر فایل‌ها اشتباه است

**علائم:**
- خطا: `Failed to load Persian alignment data`
- در Network Tab: 404 Not Found

**بررسی:**
1. F12 > Network Tab
2. فیلتر کنید: `MAT_1_fa_alignment.json`
3. URL درخواست شده را ببینید

**باید این باشد:**
```
http://localhost:5173/data/alignments/youversion/MAT_1_fa_alignment.json
```

**نه این:**
```
http://localhost:5173//data/alignments/youversion/MAT_1_fa_alignment.json
                       ↑ دو slash اشتباه است!
```

**اصلاح کد:**
```typescript
// ❌ اشتباه
fetch('/data/alignments/youversion/MAT_1_fa_alignment.json')

// ✅ درست
fetch('data/alignments/youversion/MAT_1_fa_alignment.json')
```

---

### 3️⃣ فایل‌های alignment وجود ندارند

**بررسی:**
```powershell
# چک کنید فایل‌ها موجود هستند
Get-ChildItem "public/data/alignments/youversion/" | Measure-Object
# باید: Count = 178
```

**اگر Count = 0:**
```bash
# اسکریپت تبدیل را اجرا کنید
python scripts/convert_youversion_to_audio_sync.py
```

---

### 4️⃣ Port تغییر کرده است

**علائم:**
- Vite می‌گوید: `Port 5173 is in use, trying another one...`
- Server روی 5174 یا پورت دیگری شروع شده

**راه حل:**
```
# اگر Vite روی پورت 5174 است:
http://localhost:5174/#/bible/audio-youversion

# اگر روی پورت دیگری است، URL را تغییر دهید
```

---

## 🧪 تست سریع

### تست 1: Vite در حال اجرا است؟
```powershell
netstat -ano | findstr ":5173"
# باید چیزی نشان دهد (نه خالی)
```

### تست 2: فایل‌ها قابل دسترسی هستند؟
```powershell
Invoke-WebRequest -Uri "http://localhost:5173/data/alignments/youversion/MAT_1_fa_alignment.json"
# باید StatusCode = 200 برگرداند
```

### تست 3: محتوای فایل درست است؟
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:5173/data/alignments/youversion/MAT_1_fa_alignment.json"
$json = $response.Content | ConvertFrom-Json
$json.verses.Count  # باید 25 باشد
$json.metadata.word_count  # باید 285 باشد
```

---

## ✅ لیست چک

قبل از باز کردن صفحه، این موارد را چک کنید:

- [ ] Vite در حال اجرا است (`npm run dev`)
- [ ] Port 5173 در دسترس است
- [ ] فایل‌های alignment موجود هستند (178 فایل)
- [ ] مسیر fetch در کد بدون `/` ابتدایی است
- [ ] Browser Console هیچ خطایی ندارد (F12 > Console)

---

## 🎯 مسیر صحیح فایل‌ها

```
Project Root/
├── public/
│   └── data/
│       └── alignments/
│           └── youversion/
│               ├── MAT_1_fa_alignment.json  ← فارسی
│               ├── MAT_1_en_alignment.json  ← انگلیسی
│               ├── MAT_2_fa_alignment.json
│               └── ... (178 فایل)
│
├── pages/
│   └── BibleAudioYouVersionTestPage.tsx  ← کد صفحه
│
└── scripts/
    └── convert_youversion_to_audio_sync.py  ← اسکریپت تبدیل
```

**URL دسترسی در مرورگر:**
```
http://localhost:5173/data/alignments/youversion/MAT_1_fa_alignment.json
                     ↑
                     بدون slash در ابتدا!
```

**Fetch در کد:**
```typescript
fetch('data/alignments/youversion/MAT_1_fa_alignment.json')
      ↑
      بدون slash در ابتدا!
```

---

## 📱 تست در مرورگر

1. باز کنید: `http://localhost:5173/#/bible/audio-youversion`
2. F12 > Console
3. اگر خطا بود:
   - خطای دقیق را کپی کنید
   - به Network Tab بروید
   - ببینید کدام درخواست‌ها fail شدند
   - URL درخواست‌های ناموفق را چک کنید

---

## 🆘 اگر هیچ کدام کار نکرد

1. همه Node process ها را ببندید:
   ```powershell
   Stop-Process -Name node -Force -ErrorAction SilentlyContinue
   ```

2. Vite را دوباره شروع کنید:
   ```bash
   npm run dev
   ```

3. 5 ثانیه صبر کنید

4. صفحه را در مرورگر refresh کنید

5. اگر باز هم خطا دارد، اسکریپت را دوباره اجرا کنید:
   ```bash
   python scripts/convert_youversion_to_audio_sync.py
   ```

---

## ✨ وقتی کار کرد

باید این‌ها را ببینید:

- ✅ صفحه بدون خطا load شود
- ✅ عنوان: "Professional Bible Audio"
- ✅ آمار: "25 verses", "285 words"
- ✅ دکمه Play قابل کلیک باشد
- ✅ وقتی Play می‌زنید، صوت پخش شود
- ✅ کلمات همزمان با صوت highlight شوند

---

## 📞 گزارش خطا

اگر مشکل ادامه دارد، این اطلاعات را جمع‌آوری کنید:

1. خطای دقیق از Console (F12 > Console)
2. URL درخواست ناموفق از Network Tab
3. خروجی این دستور:
   ```powershell
   netstat -ano | findstr ":5173"
   ```
4. خروجی این دستور:
   ```powershell
   Get-ChildItem "public/data/alignments/youversion/" | Measure-Object
   ```

---

**تاریخ ایجاد:** 3 November 2025  
**نسخه:** 1.0  
**سیستم:** YouVersion Audio Sync
