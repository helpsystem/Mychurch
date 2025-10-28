# 🎤 Bible Karaoke - شروع سریع

## 🚀 نصب و راه‌اندازی (5 دقیقه)

### قدم 1: نصب بسته‌های جدید

```bash
npm install
```

این بسته‌ها اضافه می‌شوند:
- `fast-glob` - اسکن فایل‌ها
- `fs-extra` - عملیات فایل
- `he` - دی‌کد HTML
- `jsdom` - پارس HTML
- `music-metadata` - خواندن طول صوت

### قدم 2: تنظیم مسیر فایل‌های WordProject

فایل `config/bible-karaoke-config.json` را ویرایش کنید:

```json
{
  "paths": {
    "wordprojectBase": "C:/Users/YOUR_NAME/Desktop/WordProject",
    "farsiAudio": "...",
    "farsiText": "...",
    "englishText": "..."
  }
}
```

⚠️ **مهم:** مسیرهای واقعی فایل‌های دانلود شده WordProject را بگذارید!

### قدم 3: ساخت داده‌های تایمینگ

```bash
# ایندکس‌سازی (اسکن فایل‌ها)
npm run bible:index

# تولید تایمینگ (محاسبه زمان کلمات)
npm run bible:align

# یا هر دو با هم:
npm run bible:prepare
```

**خروجی:**
- `public/bible-karaoke/bible-karaoke-index.json`
- `public/bible-karaoke/chapters/*.json`

### قدم 4: استفاده در کد

```tsx
import { BibleKaraokePlayer } from '@/components/BibleKaraoke';

// در کامپوننت شما
const [data, setData] = useState(null);

useEffect(() => {
  fetch('/bible-karaoke/chapters/GEN_001.json')
    .then(res => res.json())
    .then(setData);
}, []);

return (
  <BibleKaraokePlayer 
    data={data} 
    lang="fa" 
    autoScroll={true}
  />
);
```

---

## 📁 ساختار فایل‌ها

```
پروژه/
├─ config/
│  ├─ bible-karaoke-config.json ← تنظیمات
│  └─ bible-books-mapping.json  ← نگاشت کتاب‌ها
│
├─ scripts/bible-timing/
│  ├─ utils.mjs         ← توابع کمکی
│  ├─ build-index.mjs   ← اسکن فایل‌ها
│  └─ auto-align.mjs    ← تولید تایمینگ
│
├─ components/BibleKaraoke/
│  ├─ BibleKaraokePlayer.tsx ← کامپوننت اصلی
│  ├─ VerseLine.tsx          ← نمایش یک آیه
│  └─ index.ts               ← اکسپورت
│
├─ lib/
│  └─ bibleKaraokeTypes.ts   ← تایپ‌های TypeScript
│
└─ public/bible-karaoke/     ← داده‌های تولیدشده
   ├─ bible-karaoke-index.json
   └─ chapters/
      ├─ GEN_001.json
      ├─ GEN_002.json
      └─ ...
```

---

## 🎯 دستورات npm

| دستور | توضیح |
|------|------|
| `npm run bible:index` | اسکن فایل‌های WordProject و ساخت ایندکس |
| `npm run bible:align` | تولید تایمینگ کلمه‌به‌کلمه |
| `npm run bible:prepare` | اجرای هر دو مرحله |

---

## 💡 مثال سریع

### در BiblePage.tsx موجود

```tsx
// اضافه کردن import
import { BibleKaraokePlayer } from '@/components/BibleKaraoke';
import type { ChapterData } from '@/lib/bibleKaraokeTypes';

// اضافه کردن state
const [karaokeMode, setKaraokeMode] = useState(false);
const [karaokeData, setKaraokeData] = useState<ChapterData | null>(null);

// تابع بارگذاری
const loadKaraoke = async () => {
  const key = `${selectedBookISO}_${String(selectedChapter).padStart(3, '0')}`;
  const res = await fetch(`/bible-karaoke/chapters/${key}.json`);
  if (res.ok) {
    setKaraokeData(await res.json());
    setKaraokeMode(true);
  }
};

// در JSX
<button onClick={loadKaraoke}>
  🎤 Karaoke Mode
</button>

{karaokeMode && karaokeData && (
  <BibleKaraokePlayer 
    data={karaokeData} 
    lang={lang}
  />
)}
```

---

## 🎨 ویژگی‌ها

✅ **هایلایت کلمه‌به‌کلمه** - همزمان با صوت  
✅ **فارسی + انگلیسی** - با پشتیبانی RTL  
✅ **کنترل‌های حرفه‌ای** - Play/Pause, سرعت, جلو/عقب  
✅ **اسکرول خودکار** - به آیه فعال  
✅ **طراحی زیبا** - با Tailwind CSS  

---

## 🐛 عیب‌یابی سریع

### ❌ خطا: Cannot find module 'fast-glob'
```bash
npm install
```

### ❌ خطا: Index file not found
```bash
npm run bible:index
```

### ❌ خطا: No audio/text
- بررسی کنید مسیرها در `config/bible-karaoke-config.json` درست باشد
- مطمئن شوید فایل‌های WordProject دانلود شده‌اند

### ❌ صوت پخش نمی‌شود
- فایل‌های MP3 را در `public/audio/bible/` کپی کنید
- یا مسیر `publicAudioRoot` را تغییر دهید

---

## 📚 مستندات کامل

برای راهنمای جامع، ببینید:
👉 **[BIBLE_KARAOKE_GUIDE.md](./BIBLE_KARAOKE_GUIDE.md)**

شامل:
- ساختار داده JSON
- سفارشی‌سازی استایل
- ادغام با سیستم فعلی
- مثال‌های پیشرفته
- نکات بهینه‌سازی

---

## ✨ وضعیت پروژه

| قسمت | وضعیت |
|------|--------|
| ✅ اسکریپت‌های Node.js | آماده |
| ✅ کامپوننت‌های React | آماده |
| ✅ تایپ‌های TypeScript | آماده |
| ✅ مستندات | کامل |
| ⚠️ داده‌های تایمینگ | نیاز به اجرا |
| ⚠️ فایل‌های صوتی | نیاز به کپی |

---

## 🎯 گام‌های بعدی

1. ✅ نصب بسته‌ها → `npm install`
2. ✅ تنظیم مسیرها → `config/bible-karaoke-config.json`
3. ⏳ ساخت داده → `npm run bible:prepare`
4. ⏳ کپی فایل‌های صوت → `public/audio/bible/`
5. ⏳ تست کامپوننت → اضافه کردن به BiblePage

**موفق باشید! 🚀**
