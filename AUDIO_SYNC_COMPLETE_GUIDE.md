# 🎵 راهنمای کامل سیستم همگام‌سازی صوت و متن
## سیستم تایمینگ دقیق با هوش مصنوعی Gemini

---

## 📋 فهرست مطالب

1. [معرفی سیستم](#معرفی-سیستم)
2. [معماری و جریان کار](#معماری-و-جریان-کار)
3. [قابلیت‌های کلیدی](#قابلیتهای-کلیدی)
4. [فایل‌ها و مسیرها](#فایلها-و-مسیرها)
5. [نحوه استفاده](#نحوه-استفاده)
6. [ادغام با سایت](#ادغام-با-سایت)

---

## 🎯 معرفی سیستم

این سیستم یک راه‌حل کامل برای **تولید تایمینگ دقیق کلمه‌به‌کلمه** از فایل‌های صوتی است که از هوش مصنوعی Google Gemini استفاده می‌کند.

### ویژگی‌های منحصر به فرد:
- ✅ دقت **صدم ثانیه** (0.01s) در تشخیص زمان کلمات
- ✅ پشتیبانی کامل از **زبان فارسی** (RTL)
- ✅ تولید خودکار **فینگلیش** (Finglish)
- ✅ نمایش **زنده و بدون تاخیر** (Real-time)
- ✅ قابلیت **ویرایش دستی** تایمینگ
- ✅ تولید **پاورپوینت هوشمند** (PPSX)
- ✅ تشخیص **ساختار شعر** و آکورد

---

## 🏗️ معماری و جریان کار

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: تولید تایمینگ با AI Studio App                        │
├─────────────────────────────────────────────────────────────────┤
│  📂 Location: Project/audio-text-sync-&-highlight.v3 (2)/        │
│  📝 Input: فایل MP3 آهنگ                                        │
│  🤖 Process: Gemini API → Speech-to-Text با تایمینگ دقیق        │
│  📤 Output: [song_name]_full_project.json                        │
│     - metadata (filename, mode, generated_at)                   │
│     - structure[]: array of lines                                │
│       - content: متن خط                                          │
│       - words[]: { word, start_time, end_time }                 │
└─────────────────────────────────────────────────────────────────┘
                            ⬇️
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: تبدیل به فرمت سایت                                     │
├─────────────────────────────────────────────────────────────────┤
│  📂 Location: backend/convert-timing.js                          │
│  🔄 Process:                                                     │
│     1. خواندن _full_project.json                                │
│     2. تبدیل structure → lines                                   │
│     3. اضافه کردن finglish به هر کلمه                           │
│     4. محاسبه start/end هر خط                                   │
│  📤 Output: public/worship/data/timings/song_X_timing.json      │
└─────────────────────────────────────────────────────────────────┘
                            ⬇️
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: آپلود به سرور                                          │
├─────────────────────────────────────────────────────────────────┤
│  📂 Server: /var/www/html/worship/data/timings/                 │
│  🌐 URL: https://samanabyar.online/worship/data/timings/        │
│  🔧 Nginx: سرو static files از /var/www/html                    │
└─────────────────────────────────────────────────────────────────┘
                            ⬇️
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: نمایش در سایت                                          │
├─────────────────────────────────────────────────────────────────┤
│  📂 Component: KaraokeWorshipPlayer.tsx                          │
│  🎵 Process:                                                     │
│     1. Fetch timing JSON file                                    │
│     2. Load audio file                                           │
│     3. Track currentTime                                         │
│     4. Highlight active word:                                    │
│        currentTime >= word.start && currentTime < word.end      │
│  🎨 UI: کلمه فعال با رنگ سبز و سایه نورانی                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌟 قابلیت‌های کلیدی

### 1️⃣ همگام‌سازی فوق‌دقیق (0.01 ثانیه)
```typescript
// مثال از فایل timing
{
  "word": "آرامی",
  "finglish": "aarami",
  "start": 36.63,    // دقت صدم ثانیه
  "end": 37.07
}
```

**چگونه کار می‌کند:**
- Gemini API با مدل `gemini-2.0-flash-exp` صدا را پردازش می‌کند
- هر کلمه با timestamp دقیق استخراج می‌شود
- tolerance مناسب (0.15s) برای smooth transition

### 2️⃣ ترجمه چندزبانه و فینگلیش
```typescript
const finglishMap = {
  'آرامی': 'aarami',
  'دلهایی': 'delhaayi',
  'سازنده': 'sazandeh',
  'دریاها': 'daryaaha'
};

// نمایش همزمان فارسی و فینگلیش
<div className="text-2xl">آرامی دلهایی</div>
<div className="text-lg opacity-40">aarami delhaayi</div>
```

### 3️⃣ خروجی پاورپوینت هوشمند (PPSX)
**قابلیت‌ها:**
- ✅ تصاویر پس‌زمینه AI-generated (Imagen)
- ✅ فونت Vazirmatn برای فارسی
- ✅ چینش RTL صحیح
- ✅ فایل صوتی embedded
- ✅ انیمیشن‌های smooth

### 4️⃣ حالت تخصصی پرستشی
```typescript
// تشخیص ساختار شعر
if (/^(V\d+|Verse|Chorus|Bridge)$/i.test(line)) {
  // نمایش بصورت header
  return <div className="text-emerald-400">{line}</div>;
}

// گروه‌بندی خودکار بندها
const stanzas = groupLinesByGaps(lines, 2.0); // gap > 2s
```

### 5️⃣ ویرایش متن و هماهنگی دستی
**در AI Studio App:**
```typescript
// کلیک روی کلمه هنگام پخش
onClick={() => {
  const currentTime = audioRef.current.currentTime;
  updateWordTiming(wordIndex, currentTime);
}}

// ویرایش inline
<input 
  value={word.word}
  onChange={(e) => updateWordText(wordIndex, e.target.value)}
/>
```

---

## 📁 فایل‌ها و مسیرها

### 🖥️ لوکال (Development)

| نوع | مسیر | توضیحات |
|-----|------|---------|
| **AI Studio App** | `Project/audio-text-sync-&-highlight.v3 (2)/` | اپ اصلی تولید تایمینگ |
| **Output JSON** | `Project/آرامی دلهایی_full_project.json` | خروجی اپ |
| **Converter** | `backend/convert-timing.js` | تبدیل به فرمت سایت |
| **Site Timing** | `public/worship/data/timings/song_335_timing.json` | فایل نهایی |

### 🌐 سرور (Production)

| نوع | مسیر | توضیحات |
|-----|------|---------|
| **Nginx Root** | `/var/www/html/` | ریشه اصلی nginx |
| **Timing Files** | `/var/www/html/worship/data/timings/` | فایل‌های تایمینگ |
| **URL** | `https://samanabyar.online/worship/data/timings/song_335_timing.json` | آدرس عمومی |

### 📄 فرمت فایل‌ها

#### فرمت AI Studio (_full_project.json):
```json
{
  "metadata": {
    "filename": "آرامی دلهایی.mp3",
    "generated_at": "2026-01-23T04:23:35.327Z",
    "mode": "speech",
    "type": "project_full"
  },
  "structure": [
    {
      "content": "آرامی دل هایی سازنده دریاها",
      "words": [
        {
          "word": "آرامی",
          "start_time": 36.63,
          "end_time": 37.07
        }
      ],
      "type": "lyric"
    }
  ]
}
```

#### فرمت سایت (song_X_timing.json):
```json
{
  "songId": 335,
  "generatedAt": "2026-01-23T04:27:15.954Z",
  "version": "3.0",
  "model": "user-app-precise",
  "source": "آرامی دلهایی_full_project.json",
  "lines": [
    {
      "line": "آرامی دل هایی سازنده دریاها",
      "start": 36.63,
      "end": 41.51,
      "words": [
        {
          "word": "آرامی",
          "finglish": "aarami",
          "start": 36.63,
          "end": 37.07
        }
      ]
    }
  ]
}
```

---

## 🚀 نحوه استفاده

### روش 1: تولید تایمینگ برای آهنگ جدید

```bash
# 1. رفتن به پوشه اپ
cd "Project/audio-text-sync-&-highlight.v3 (2)"

# 2. نصب و اجرا (اولین بار)
npm install
npm run dev

# 3. باز کردن در مرورگر
# http://localhost:5173

# 4. آپلود فایل MP3
# انتخاب mode: "speech"
# منتظر پردازش

# 5. دانلود خروجی
# کلیک "Download Full Project JSON"
# فایل: [song_name]_full_project.json
```

### روش 2: تبدیل به فرمت سایت

```bash
# 1. کپی فایل به پوشه Project
cp "song_name_full_project.json" "Project/"

# 2. ویرایش backend/convert-timing.js
# تغییر نام فایل منبع و songId

# 3. اجرای converter
cd backend
node convert-timing.js

# 4. چک کردن خروجی
cat ../public/worship/data/timings/song_X_timing.json
```

### روش 3: آپلود به سرور

```bash
# 1. آپلود با SCP
scp "public/worship/data/timings/song_X_timing.json" \
    root@samanabyar.online:/var/www/html/worship/data/timings/

# 2. تست
curl https://samanabyar.online/worship/data/timings/song_X_timing.json

# 3. ریستارت nginx (در صورت نیاز)
ssh root@samanabyar.online "systemctl restart nginx"
```

---

## 🔗 ادغام با سایت

### 1. اضافه کردن آهنگ به worship_songs.json

```json
{
  "id": 335,
  "title": {
    "fa": "آرامی دلهایی",
    "en": "Peace of Hearts"
  },
  "artist": {
    "fa": "روزبه نجارنژاد",
    "en": "Roozbeh Najarnejad"
  },
  "audioUrl": "https://www.hidrive.strato.com/webdav/MyChurch-Files/worship/songs/wm_song_arami-delhaye.mp3",
  "hasTiming": true,  // ← مهم!
  "hasChords": false,
  "lyrics": {
    "fa": "آرامی دل هایی سازنده دریاها\nروشنی خورشیدی زیبایی رویاها..."
  }
}
```

### 2. کامپوننت KaraokeWorshipPlayer

این کامپوننت خودکار تایمینگ رو لود می‌کنه:

```typescript
// در WorshipPage.tsx
<KaraokeWorshipPlayer
  audioUrl={song.audioUrl}
  songId={song.id}          // ← از این songId استفاده می‌کنه
  title={song.title?.fa}
  artist={song.artist?.fa}
  lang="fa"
  lyrics={song.lyrics?.fa}
  autoPlay={false}
/>

// خودکار fetch می‌کنه:
// /worship/data/timings/song_335_timing.json
```

### 3. الگوریتم Highlight

```typescript
// در KaraokeWorshipPlayer.tsx
const isWordActive = 
  currentTime >= (word.start - 0.15) && 
  currentTime < (word.end + 0.15);

// استایل کلمه فعال
style={{
  color: isWordActive ? '#10b981' : 'rgba(255,255,255,0.6)',
  textShadow: isWordActive 
    ? '0 0 20px #10b981, 0 0 40px #10b981' 
    : 'none',
  transform: isWordActive ? 'scale(1.15)' : 'scale(1)',
  background: isWordActive 
    ? 'rgba(16, 185, 129, 0.2)' 
    : 'transparent'
}}
```

---

## 🛠️ Troubleshooting

### مشکل: تایمینگ اشتباه است

**راه حل:**
```bash
# 1. چک کردن فایل سرور
ssh root@samanabyar.online \
  "head -20 /var/www/html/worship/data/timings/song_X_timing.json"

# 2. مقایسه با فایل لوکال
head -20 public/worship/data/timings/song_X_timing.json

# 3. آپلود مجدد
scp public/worship/data/timings/song_X_timing.json \
    root@samanabyar.online:/var/www/html/worship/data/timings/
```

### مشکل: Cache مرورگر

**راه حل:**
- `Ctrl+Shift+R` (Hard Refresh)
- یا DevTools → Network → Disable cache
- یا Incognito Window

### مشکل: فایل 404

**چک کردن:**
```bash
# لیست همه فایل‌های timing
ssh root@samanabyar.online \
  "ls -lh /var/www/html/worship/data/timings/"

# تست مستقیم
curl -I https://samanabyar.online/worship/data/timings/song_X_timing.json
```

---

## 📊 آمار و اطلاعات

### آمار کلی سیستم

| ویژگی | مقدار |
|-------|-------|
| **کل فایل‌های تایمینگ** | 364 عدد |
| **محدوده ID** | song_1 تا song_364 |
| **دقت تایمینگ** | 0.01 ثانیه |
| **مدل AI** | user-app-precise (Gemini) |

### نمونه آهنگ آرامی دلهایی (ID: 335)

| ویژگی | مقدار |
|-------|-------|
| تعداد خطوط | 48 |
| تعداد کلمات | ~324 |
| مدت زمان | 358.97 ثانیه |
| شروع اولین کلمه | 36.63s |
| حجم فایل JSON | 54KB |
| تاریخ تولید | 2026-01-23

---

## 🎓 یادآوری‌های مهم

1. ✅ **همیشه** `hasTiming: true` را در worship_songs.json تنظیم کنید
2. ✅ **songId** باید با نام فایل مطابقت داشته باشد: `song_{id}_timing.json`
3. ✅ فایل‌ها باید در `/var/www/html/worship/data/timings/` باشند (نه `/var/www/my-church-api/`)
4. ✅ بعد از آپلود، **Hard Refresh** کنید (`Ctrl+Shift+R`)
5. ✅ برای ویرایش تایمینگ، از AI Studio App استفاده کنید

---

## 📞 پشتیبانی

- **مستندات کامل:** این فایل
- **کد منبع اپ:** `Project/audio-text-sync-&-highlight.v3 (2)/`
- **کامپوننت سایت:** `frontend/src/components/KaraokeWorshipPlayer.tsx` (1405 خط کد)
- **اسکریپت تبدیل:** `backend/convert-timing.js`
- **فایل‌های تایمینگ:** `public/worship/data/timings/` (364 فایل)

---

**🎉 موفق باشید! این سیستم یکی از پیشرفته‌ترین سیستم‌های تایمینگ برای زبان فارسی است.**
