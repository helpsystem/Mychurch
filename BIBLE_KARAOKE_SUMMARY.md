# 🎤 Bible Karaoke System - خلاصه پیاده‌سازی

## ✅ فایل‌های ایجادشده

### 1️⃣ **تنظیمات (Config)**
```
config/
├─ bible-karaoke-config.json    ← مسیرها و تنظیمات سیستم
└─ bible-books-mapping.json     ← نگاشت 66 کتاب کتاب مقدس (EN/FA/ISO)
```

### 2️⃣ **اسکریپت‌های Node.js**
```
scripts/bible-timing/
├─ utils.mjs         ← توابع کمکی (readHTML, parseMetaFromPath, etc.)
├─ build-index.mjs   ← اسکن WordProject files و ساخت JSON
└─ auto-align.mjs    ← تولید تایمینگ کلمه‌به‌کلمه (proportional)
```

### 3️⃣ **کامپوننت‌های React**
```
components/BibleKaraoke/
├─ BibleKaraokePlayer.tsx  ← پلیر اصلی (285 خط)
│  • Audio controls (play/pause/seek/speed/volume)
│  • Word-by-word highlighting
│  • Auto-scroll to current verse
│  • RTL/LTR support
│
├─ VerseLine.tsx           ← نمایش یک آیه (65 خط)
│  • Verse number
│  • Word highlighting with transitions
│  • Active verse indicator
│
└─ index.ts                ← Export کامپوننت‌ها
```

### 4️⃣ **تایپ‌های TypeScript**
```
lib/
└─ bibleKaraokeTypes.ts    ← Interface ها
   • WordTiming
   • BibleVerse
   • LanguageSection
   • ChapterData
   • BibleKaraokeIndex
```

### 5️⃣ **مستندات**
```
BIBLE_KARAOKE_GUIDE.md      ← راهنمای کامل (600+ خط)
BIBLE_KARAOKE_QUICKSTART.md ← شروع سریع (200 خط)
```

---

## 📦 بسته‌های NPM اضافه‌شده

```json
{
  "dependencies": {
    "fast-glob": "^3.3.2",      // اسکن فایل‌های WordProject
    "fs-extra": "^11.2.0",      // عملیات فایل پیشرفته
    "he": "^1.2.0",             // دی‌کد HTML entities
    "jsdom": "^24.1.0",         // پارس HTML
    "music-metadata": "^7.14.0" // خواندن طول فایل صوتی
  }
}
```

---

## ⚙️ دستورات NPM جدید

```json
{
  "scripts": {
    "bible:index": "node scripts/bible-timing/build-index.mjs",
    "bible:align": "node scripts/bible-timing/auto-align.mjs",
    "bible:prepare": "npm run bible:index && npm run bible:align"
  }
}
```

---

## 🎯 نحوه کار سیستم

### مرحله 1: Build Index
```
WordProject Files (Source)
│
├─ audio/20_farsi/genesis_1.mp3
├─ audio/01_english/genesis_1.mp3
├─ text/fa/01/genesis_1.html
└─ text/kj/genesis_1.html
         │
         ↓ [build-index.mjs]
         ↓
public/bible-karaoke/
├─ bible-karaoke-index.json
└─ chapters/
   └─ GEN_001.json ← {book, chapter, en: {verses, audioUrl}, fa: {verses, audioUrl}}
```

### مرحله 2: Auto Alignment
```
GEN_001.json
│
├─ Audio Duration: 245.6 seconds
├─ Total Words: 324
│
↓ [auto-align.mjs]
↓ Time per word = 245.6 / 324 = 0.758s
↓
verses[0].timings = [
  {word: "In", start: 0.0, end: 0.758},
  {word: "the", start: 0.758, end: 1.516},
  ...
]
```

### مرحله 3: React Player
```tsx
<BibleKaraokePlayer data={chapterData} lang="fa" />
                     │
                     ↓
[Audio Element] → currentTime: 2.5s
                     │
                     ↓
[VerseLine] → finds word at 2.5s
                     │
                     ↓
<span className="highlighted">کلمه</span>
```

---

## 🎨 ویژگی‌های کلیدی

### 1. Word-by-Word Highlighting
```tsx
{timings.map((w, i) => {
  const isHighlighted = currentTime >= w.start && currentTime < w.end;
  return (
    <span className={isHighlighted ? 'bg-amber-300' : ''}>
      {w.word}
    </span>
  );
})}
```

### 2. Auto Scroll
```tsx
useEffect(() => {
  if (currentVerse) {
    verseRefs.current[currentVerse].scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
}, [currentVerse]);
```

### 3. Playback Controls
```tsx
// Speed: 0.75x, 1x, 1.25x, 1.5x
audio.playbackRate = rate;

// Skip: ±5 seconds
audio.currentTime += 5;

// Volume: 0-1
audio.volume = volume;
```

### 4. RTL/LTR Support
```tsx
<div 
  dir={lang === 'fa' ? 'rtl' : 'ltr'}
  style={{ 
    fontFamily: lang === 'fa' 
      ? 'B Homa, Vazirmatn, Tahoma' 
      : 'inherit' 
  }}
>
```

---

## 📊 ساختار داده JSON

### Index File
```json
{
  "generatedAt": "2025-01-15T10:30:00Z",
  "totalChapters": 1189,
  "chapters": [
    {
      "key": "GEN_001",
      "iso": "GEN",
      "book": {"id": 1, "iso": "GEN", "en": "Genesis", "fa": "پیدایش"},
      "chapter": 1,
      "en": {"audioUrl": "/audio/bible/en/genesis_1.mp3", "hasText": true, "verseCount": 31},
      "fa": {"audioUrl": "/audio/bible/fa/genesis_1.mp3", "hasText": true, "verseCount": 31}
    }
  ]
}
```

### Chapter File
```json
{
  "book": {"id": 1, "iso": "GEN", "en": "Genesis", "fa": "پیدایش"},
  "chapter": 1,
  "fa": {
    "audioUrl": "/audio/bible/fa/genesis_1.mp3",
    "duration": 278.3,
    "aligned": true,
    "verses": [
      {
        "verse": 1,
        "text": "در ابتدا خدا آسمان و زمین را آفرید.",
        "start": 0.0,
        "end": 5.2,
        "timings": [
          {"word": "در", "start": 0.0, "end": 0.5},
          {"word": "ابتدا", "start": 0.5, "end": 1.2},
          {"word": "خدا", "start": 1.2, "end": 1.8},
          ...
        ]
      }
    ]
  }
}
```

---

## 🚀 استفاده در پروژه

### روش 1: صفحه مستقل
```tsx
// pages/BibleKaraokePage.tsx
import { BibleKaraokePlayer } from '@/components/BibleKaraoke';

const BibleKaraokePage = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/bible-karaoke/chapters/GEN_001.json')
      .then(res => res.json())
      .then(setData);
  }, []);

  return <BibleKaraokePlayer data={data} lang="fa" />;
};
```

### روش 2: ادغام با BiblePage
```tsx
// در BiblePage.tsx
const [viewMode, setViewMode] = useState<'normal' | 'karaoke'>('normal');

<button onClick={() => setViewMode('karaoke')}>
  🎤 Karaoke Mode
</button>

{viewMode === 'karaoke' && (
  <BibleKaraokePlayer data={karaokeData} lang={lang} />
)}
```

---

## 🔧 تنظیمات قابل تغییر

### در config/bible-karaoke-config.json
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

### در کامپوننت
```tsx
<BibleKaraokePlayer
  data={chapterData}
  lang="fa"
  showVerseNumbers={true}   // نمایش شماره آیات
  autoScroll={true}          // اسکرول خودکار
/>
```

---

## 📝 گام‌های نصب

### 1. نصب بسته‌ها
```bash
npm install
```

### 2. تنظیم مسیرها
```json
// config/bible-karaoke-config.json
{
  "paths": {
    "wordprojectBase": "C:/Path/To/WordProject",
    ...
  }
}
```

### 3. ساخت داده
```bash
npm run bible:prepare
```

### 4. استفاده در کد
```tsx
import { BibleKaraokePlayer } from '@/components/BibleKaraoke';
```

---

## 🎯 چک‌لیست آماده‌سازی

- [x] ✅ **Config files** → ایجاد شد
- [x] ✅ **Scripts** → utils, build-index, auto-align
- [x] ✅ **Components** → BibleKaraokePlayer, VerseLine
- [x] ✅ **Types** → bibleKaraokeTypes.ts
- [x] ✅ **Docs** → GUIDE + QUICKSTART
- [x] ✅ **package.json** → dependencies + scripts
- [ ] ⏳ **Run build** → `npm run bible:prepare`
- [ ] ⏳ **Copy audio** → files to public/audio/bible/
- [ ] ⏳ **Integration** → Add to BiblePage.tsx
- [ ] ⏳ **Testing** → Test with sample chapter

---

## 💡 نکات مهم

### 1. تایمینگ فعلی تقریبی است
```
Current: Proportional distribution
Better: WhisperX / Gentle Forced Alignment
```

### 2. فایل‌های صوت باید در public باشند
```
public/audio/bible/
├─ en/
│  └─ genesis_1.mp3
└─ fa/
   └─ genesis_1.mp3
```

### 3. مسیرهای WordProject باید صحیح باشد
```
Check: config/bible-karaoke-config.json
Verify: Files actually exist at those paths
```

### 4. برای استفاده در production
```
1. Copy generated JSON files
2. Copy audio files
3. Set correct publicAudioRoot in config
4. Build and deploy
```

---

## 🆘 عیب‌یابی

| مشکل | راه‌حل |
|------|--------|
| Module not found | `npm install` |
| Index not found | `npm run bible:index` |
| No timing data | `npm run bible:align` |
| Audio 404 | Copy files to public/audio/bible/ |
| No verses | Check wordprojectBase path |
| Persian font ugly | Add Vazirmatn font |

---

## 📚 مستندات

- **[BIBLE_KARAOKE_GUIDE.md](./BIBLE_KARAOKE_GUIDE.md)** - راهنمای کامل (600+ خط)
- **[BIBLE_KARAOKE_QUICKSTART.md](./BIBLE_KARAOKE_QUICKSTART.md)** - شروع سریع

---

## ✨ خلاصه

این سیستم **Bible Karaoke** شامل:

1. **3 اسکریپت Node.js** - برای پردازش داده
2. **2 کامپوننت React** - برای نمایش
3. **1 فایل Type** - برای TypeScript
4. **2 فایل Config** - برای تنظیمات
5. **2 فایل Doc** - برای راهنما

**همه چیز آماده است!** فقط:
1. `npm install`
2. تنظیم مسیرها
3. `npm run bible:prepare`
4. استفاده در کد

**موفق باشید! 🎤✨**
