# 🎤 Bible Karaoke System - راهنمای کامل

## 📋 فهرست مطالب

1. [معرفی سیستم](#معرفی-سیستم)
2. [نصب و راه‌اندازی](#نصب-و-راه‌اندازی)
3. [ساخت داده‌های تایمینگ](#ساخت-داده‌های-تایمینگ)
4. [استفاده از کامپوننت‌ها](#استفاده-از-کامپوننت‌ها)
5. [تنظیمات پیشرفته](#تنظیمات-پیشرفته)
6. [عیب‌یابی](#عیب‌یابی)

---

## 🎯 معرفی سیستم

سیستم **Bible Karaoke** به شما امکان می‌دهد:

- ✅ **هایلایت کلمه‌به‌کلمه** - همزمان با صوت، هر کلمه برجسته می‌شود
- ✅ **پشتیبانی دو زبانه** - فارسی و انگلیسی با نمایش RTL
- ✅ **کنترل‌های حرفه‌ای** - Play/Pause, سرعت، جلو/عقب، حجم صدا
- ✅ **اسکرول خودکار** - صفحه به‌طور خودکار به آیه جاری می‌رود
- ✅ **طراحی ریسپانسیو** - روی موبایل و دسکتاپ کار می‌کند

### ساختار سیستم

```
Bible Karaoke System
├─ WordProject Files (Source)
│  ├─ Audio: MP3 files (Farsi + English)
│  ├─ Text: HTML files with verses
│  └─ Structure: Books/Chapters
│
├─ Scripts (Processing)
│  ├─ build-index.mjs → Scan & Extract
│  ├─ auto-align.mjs → Generate Timings
│  └─ utils.mjs → Helper Functions
│
├─ Data Output (Generated)
│  ├─ bible-karaoke-index.json
│  └─ chapters/
│     ├─ GEN_001.json
│     ├─ GEN_002.json
│     └─ ...
│
└─ React Components (Frontend)
   ├─ BibleKaraokePlayer.tsx
   ├─ VerseLine.tsx
   └─ Integration with BiblePage
```

---

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها

```bash
# Node.js 18+ و npm
node --version  # باید 18.0.0+ باشد
```

### بسته‌های مورد نیاز

فایل‌های زیر را به `package.json` اضافه کنید:

```json
{
  "dependencies": {
    "fast-glob": "^3.3.2",
    "fs-extra": "^11.2.0",
    "he": "^1.2.0",
    "jsdom": "^24.1.0",
    "music-metadata": "^7.14.0"
  }
}
```

نصب:

```bash
npm install
```

### تنظیم مسیرها

فایل `config/bible-karaoke-config.json` را ویرایش کنید:

```json
{
  "paths": {
    "wordprojectBase": "C:/Users/YOUR_NAME/Desktop/WordProject",
    "farsiAudio": "C:/Users/YOUR_NAME/Desktop/WordProject/audio/20_farsi",
    "farsiText": "C:/Users/YOUR_NAME/Desktop/WordProject/text/fa",
    "englishText": "C:/Users/YOUR_NAME/Desktop/WordProject/text/kj",
    "outputDataDir": "public/bible-karaoke",
    "outputChaptersDir": "public/bible-karaoke/chapters",
    "publicAudioRoot": "/audio/bible",
    "publicTextRoot": "/text/bible"
  }
}
```

⚠️ **مهم**: مسیرها را مطابق سیستم خودتان تنظیم کنید!

---

## 🔧 ساخت داده‌های تایمینگ

### مرحله 1: ایندکس‌سازی فایل‌ها

این مرحله تمام فایل‌های HTML و MP3 را اسکن می‌کند:

```bash
# اضافه کردن اسکریپت به package.json
npm pkg set scripts.bible:index="node scripts/bible-timing/build-index.mjs"

# اجرا
npm run bible:index
```

**خروجی:**
- `public/bible-karaoke/bible-karaoke-index.json` - فهرست کامل فصل‌ها
- `public/bible-karaoke/chapters/*.json` - داده هر فصل (متن آیات + لینک صوت)

**مثال خروجی:**

```
✅ Index complete!
  📁 1189 chapters saved to public/bible-karaoke/chapters
  📋 Index: public/bible-karaoke/bible-karaoke-index.json
```

### مرحله 2: تولید تایمینگ کلمات

این مرحله برای هر کلمه زمان شروع و پایان می‌سازد:

```bash
# اضافه کردن اسکریپت
npm pkg set scripts.bible:align="node scripts/bible-timing/auto-align.mjs"

# اجرا
npm run bible:align
```

**روش کار:**
- طول کل صوت را می‌گیرد (مثلاً 180 ثانیه)
- تعداد کلمات را می‌شمارد (مثلاً 300 کلمه)
- زمان را به‌صورت متناسب تقسیم می‌کند

**خروجی:**

```
✅ Auto-alignment complete!
  📊 Processed: 1189 chapters
  🎯 Aligned: 2378 language sections

💡 Note: This is proportional timing (approximate)
   For accurate word timings, use WhisperX or Gentle Forced Alignment
```

### مرحله 3 (اختیاری): تایمینگ دقیق با WhisperX

برای دقت بیشتر می‌توانید از WhisperX استفاده کنید:

```bash
# نصب WhisperX
pip install whisperx

# اجرای تایمینگ دقیق
whisperx audio.mp3 --model large-v2 --align_model WAV2VEC2_ASR_LARGE_LV60K_960H --language fa
```

سپس خروجی را به فرمت JSON ما تبدیل کنید.

---

## 💻 استفاده از کامپوننت‌ها

### روش 1: استفاده مستقل

```tsx
import React, { useState, useEffect } from 'react';
import { BibleKaraokePlayer } from '@/components/BibleKaraoke';
import type { ChapterData } from '@/lib/bibleKaraokeTypes';

const MyPage: React.FC = () => {
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [lang, setLang] = useState<'en' | 'fa'>('fa');

  useEffect(() => {
    // بارگذاری داده فصل (مثال: پیدایش فصل 1)
    fetch('/bible-karaoke/chapters/GEN_001.json')
      .then(res => res.json())
      .then(data => setChapterData(data));
  }, []);

  if (!chapterData) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">
        {chapterData.book.fa} {chapterData.chapter}
      </h1>

      {/* انتخاب زبان */}
      <div className="mb-4">
        <button onClick={() => setLang('fa')}>فارسی</button>
        <button onClick={() => setLang('en')}>English</button>
      </div>

      {/* پلیر */}
      <BibleKaraokePlayer 
        data={chapterData} 
        lang={lang}
        autoScroll={true}
        showVerseNumbers={true}
      />
    </div>
  );
};

export default MyPage;
```

### روش 2: ادغام با BiblePage فعلی

اضافه کردن تب Karaoke Mode به `BiblePage.tsx`:

```tsx
// در ابتدای فایل
import { BibleKaraokePlayer } from '@/components/BibleKaraoke';
import type { ChapterData } from '@/lib/bibleKaraokeTypes';

// در داخل کامپوننت
const [viewMode, setViewMode] = useState<'normal' | 'karaoke'>('normal');
const [karaokeData, setKaraokeData] = useState<ChapterData | null>(null);

// تابع بارگذاری داده کاراوکه
const loadKaraokeData = async (bookIso: string, chapter: number) => {
  const key = `${bookIso}_${String(chapter).padStart(3, '0')}`;
  try {
    const res = await fetch(`/bible-karaoke/chapters/${key}.json`);
    if (res.ok) {
      const data = await res.json();
      setKaraokeData(data);
      setViewMode('karaoke');
    } else {
      alert('داده کاراوکه برای این فصل موجود نیست');
    }
  } catch (error) {
    console.error('خطا در بارگذاری داده کاراوکه:', error);
  }
};

// در JSX
<div className="view-mode-selector mb-4">
  <button 
    onClick={() => setViewMode('normal')}
    className={viewMode === 'normal' ? 'active' : ''}
  >
    {lang === 'fa' ? 'نمایش عادی' : 'Normal View'}
  </button>
  
  <button 
    onClick={() => loadKaraokeData(selectedBook, selectedChapter)}
    className={viewMode === 'karaoke' ? 'active' : ''}
  >
    {lang === 'fa' ? 'حالت کاراوکه' : 'Karaoke Mode'}
  </button>
</div>

{viewMode === 'karaoke' && karaokeData ? (
  <BibleKaraokePlayer 
    data={karaokeData} 
    lang={lang}
    autoScroll={true}
  />
) : (
  // نمایش عادی فعلی...
)}
```

### روش 3: استفاده در صفحه جداگانه

```tsx
// pages/BibleKaraokePage.tsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { BibleKaraokePlayer } from '@/components/BibleKaraoke';
import type { BibleKaraokeIndex, ChapterData } from '@/lib/bibleKaraokeTypes';

const BibleKaraokePage: React.FC = () => {
  const { lang, t } = useLanguage();
  const [index, setIndex] = useState<BibleKaraokeIndex | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);

  // بارگذاری ایندکس
  useEffect(() => {
    fetch('/bible-karaoke/bible-karaoke-index.json')
      .then(res => res.json())
      .then(data => {
        setIndex(data);
        if (data.chapters.length > 0) {
          setSelectedChapter(data.chapters[0].key);
        }
      });
  }, []);

  // بارگذاری فصل انتخاب‌شده
  useEffect(() => {
    if (!selectedChapter) return;
    
    fetch(`/bible-karaoke/chapters/${selectedChapter}.json`)
      .then(res => res.json())
      .then(setChapterData);
  }, [selectedChapter]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">
        {lang === 'fa' ? '🎤 کاراوکه کتاب مقدس' : '🎤 Bible Karaoke'}
      </h1>

      {/* انتخاب فصل */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">
          {lang === 'fa' ? 'انتخاب فصل:' : 'Select Chapter:'}
        </label>
        <select
          value={selectedChapter}
          onChange={(e) => setSelectedChapter(e.target.value)}
          className="w-full p-2 border rounded"
        >
          {index?.chapters.map((ch) => (
            <option key={ch.key} value={ch.key}>
              {lang === 'fa' ? ch.book.fa : ch.book.en} - {ch.chapter}
            </option>
          ))}
        </select>
      </div>

      {/* پلیر */}
      {chapterData && (
        <BibleKaraokePlayer 
          data={chapterData} 
          lang={lang}
          autoScroll={true}
        />
      )}
    </div>
  );
};

export default BibleKaraokePage;
```

---

## ⚙️ تنظیمات پیشرفته

### تنظیمات کامپوننت

```tsx
<BibleKaraokePlayer
  data={chapterData}
  lang="fa"
  showVerseNumbers={true}      // نمایش شماره آیات
  autoScroll={true}             // اسکرول خودکار
/>
```

### سفارشی‌سازی استایل

```css
/* در فایل CSS خود */

/* رنگ هایلایت */
.karaoke-word.bg-amber-300 {
  background: linear-gradient(120deg, #fbbf24 0%, #f59e0b 100%);
}

/* آیه فعال */
.karaoke-verse.bg-amber-50\/30 {
  background: rgba(255, 251, 235, 0.5);
  border-right: 4px solid #f59e0b;
}

/* فونت فارسی */
.bible-karaoke-player.rtl {
  font-family: 'B Homa', 'Vazirmatn', 'Tahoma', sans-serif;
}
```

### تنظیمات پیش‌فرض پلیر

در `config/bible-karaoke-config.json`:

```json
{
  "settings": {
    "versesPerPage": 10,
    "autoGenerateTiming": true,
    "defaultPlaybackRate": 1.0,
    "enableWordHighlight": true,
    "enableVerseSync": true
  }
}
```

---

## 🐛 عیب‌یابی

### مشکل: فایل‌ها پیدا نمی‌شوند

```bash
# بررسی مسیرها
ls "C:/Users/SamYar/Desktop/WordProject"

# اصلاح config
# ویرایش: config/bible-karaoke-config.json
```

### مشکل: تایمینگ تولید نمی‌شود

```bash
# بررسی وجود فایل ایندکس
ls public/bible-karaoke/bible-karaoke-index.json

# اجرای مجدد
npm run bible:index
npm run bible:align
```

### مشکل: صوت پخش نمی‌شود

1. بررسی کنید فایل‌های MP3 در `public/audio/bible/` باشند
2. مسیر `audioUrl` در JSON را چک کنید
3. Console مرورگر را برای خطاهای 404 بررسی کنید

### مشکل: هایلایت کار نمی‌کند

```tsx
// بررسی داده تایمینگ
console.log(chapterData.fa.verses[0].timings);

// باید آرایه‌ای از {word, start, end} باشد
// اگر undefined است، auto-align اجرا نشده
```

### مشکل: فونت فارسی زشت است

```html
<!-- اضافه کردن به index.html -->
<link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />

<style>
  .bible-karaoke-player.rtl {
    font-family: 'Vazirmatn', 'Tahoma', sans-serif !important;
  }
</style>
```

---

## 📊 ساختار داده JSON

### فایل Index

```json
{
  "generatedAt": "2025-01-15T10:30:00Z",
  "totalChapters": 1189,
  "chapters": [
    {
      "key": "GEN_001",
      "iso": "GEN",
      "book": {
        "id": 1,
        "iso": "GEN",
        "en": "Genesis",
        "fa": "پیدایش",
        "chapters": 50
      },
      "chapter": 1,
      "en": {
        "audioUrl": "/audio/bible/en/genesis_1.mp3",
        "hasText": true,
        "verseCount": 31
      },
      "fa": {
        "audioUrl": "/audio/bible/fa/genesis_1.mp3",
        "hasText": true,
        "verseCount": 31
      }
    }
  ]
}
```

### فایل Chapter

```json
{
  "book": {
    "id": 1,
    "iso": "GEN",
    "en": "Genesis",
    "fa": "پیدایش",
    "chapters": 50
  },
  "chapter": 1,
  "en": {
    "audioUrl": "/audio/bible/en/genesis_1.mp3",
    "duration": 245.6,
    "aligned": true,
    "alignedAt": "2025-01-15T10:35:00Z",
    "alignmentMethod": "proportional",
    "verses": [
      {
        "verse": 1,
        "text": "In the beginning God created the heaven and the earth.",
        "start": 0.0,
        "end": 4.1,
        "timings": [
          { "word": "In", "start": 0.0, "end": 0.4 },
          { "word": "the", "start": 0.4, "end": 0.6 },
          { "word": "beginning", "start": 0.6, "end": 1.2 },
          { "word": "God", "start": 1.2, "end": 1.7 },
          { "word": "created", "start": 1.7, "end": 2.3 },
          { "word": "the", "start": 2.3, "end": 2.5 },
          { "word": "heaven", "start": 2.5, "end": 3.1 },
          { "word": "and", "start": 3.1, "end": 3.3 },
          { "word": "the", "start": 3.3, "end": 3.5 },
          { "word": "earth.", "start": 3.5, "end": 4.1 }
        ]
      }
    ]
  },
  "fa": {
    "audioUrl": "/audio/bible/fa/genesis_1.mp3",
    "duration": 278.3,
    "aligned": true,
    "verses": [...]
  }
}
```

---

## 🚀 دستورات npm

اضافه کردن به `package.json`:

```json
{
  "scripts": {
    "bible:index": "node scripts/bible-timing/build-index.mjs",
    "bible:align": "node scripts/bible-timing/auto-align.mjs",
    "bible:prepare": "npm run bible:index && npm run bible:align",
    "bible:test": "node scripts/bible-timing/test-player.mjs"
  }
}
```

استفاده:

```bash
# تولید کامل داده‌ها
npm run bible:prepare

# یا مرحله‌به‌مرحله
npm run bible:index
npm run bible:align

# تست
npm run bible:test
```

---

## 📖 مثال‌های کاربردی

### مثال 1: نمایش چند زبانه

```tsx
const DualLanguagePlayer = ({ chapterKey }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/bible-karaoke/chapters/${chapterKey}.json`)
      .then(res => res.json())
      .then(setData);
  }, [chapterKey]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3>English</h3>
        {data && <BibleKaraokePlayer data={data} lang="en" />}
      </div>
      <div>
        <h3>فارسی</h3>
        {data && <BibleKaraokePlayer data={data} lang="fa" />}
      </div>
    </div>
  );
};
```

### مثال 2: پلی‌لیست فصل‌ها

```tsx
const PlaylistPlayer = () => {
  const [playlist, setPlaylist] = useState(['GEN_001', 'GEN_002', 'GEN_003']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [data, setData] = useState(null);

  const loadChapter = (index) => {
    fetch(`/bible-karaoke/chapters/${playlist[index]}.json`)
      .then(res => res.json())
      .then(setData);
  };

  useEffect(() => {
    loadChapter(currentIndex);
  }, [currentIndex]);

  const next = () => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div>
      <div className="playlist-controls">
        <button onClick={prev}>← Previous</button>
        <span>{playlist[currentIndex]}</span>
        <button onClick={next}>Next →</button>
      </div>
      
      {data && <BibleKaraokePlayer data={data} lang="fa" />}
    </div>
  );
};
```

---

## 🎓 نکات حرفه‌ای

### 1. بهینه‌سازی عملکرد

```tsx
// استفاده از React.memo برای VerseLine
export default React.memo(VerseLine, (prev, next) => {
  return (
    prev.verse.verse === next.verse.verse &&
    prev.currentTime === next.currentTime &&
    prev.isActive === next.isActive
  );
});
```

### 2. پیش‌بارگذاری صوت

```tsx
useEffect(() => {
  // Preload next chapter audio
  if (nextChapterKey) {
    const audio = new Audio(`/bible-karaoke/chapters/${nextChapterKey}.mp3`);
    audio.preload = 'metadata';
  }
}, [nextChapterKey]);
```

### 3. ذخیره پیشرفت

```tsx
// Save progress to localStorage
useEffect(() => {
  localStorage.setItem('bible-karaoke-progress', JSON.stringify({
    chapterKey: currentChapter,
    timestamp: currentTime,
    lang
  }));
}, [currentChapter, currentTime, lang]);
```

---

## 📝 چک‌لیست نهایی

- [ ] فایل‌های WordProject دانلود و در مسیر صحیح قرار گرفته
- [ ] `config/bible-karaoke-config.json` تنظیم شده
- [ ] بسته‌های npm نصب شده (`npm install`)
- [ ] اسکریپت‌ها در `package.json` اضافه شده
- [ ] `npm run bible:prepare` با موفقیت اجرا شده
- [ ] فایل‌های JSON در `public/bible-karaoke/` ساخته شده
- [ ] کامپوننت‌ها در پروژه ایمپورت شده
- [ ] تست اولیه با یک فصل انجام شده
- [ ] فونت فارسی تست شده
- [ ] صوت‌ها روی سرور یا لوکال در دسترس هستند

---

## 🆘 پشتیبانی

اگر مشکلی داشتید:

1. **Console مرورگر** را بررسی کنید
2. **خطاهای Terminal** را بخوانید
3. **مسیرها** را دوباره چک کنید
4. **نسخه Node.js** را بررسی کنید (باید 18+)
5. **فایل‌های JSON** را باز کنید و ساختار را ببینید

---

## 🎉 تبریک!

حالا شما یک سیستم کامل Bible Karaoke دارید که:
- ✅ کلمه‌به‌کلمه هایلایت می‌کند
- ✅ فارسی و انگلیسی پشتیبانی می‌کند
- ✅ کنترل‌های حرفه‌ای دارد
- ✅ قابل توسعه و سفارشی‌سازی است

**موفق باشید! 🙏**
