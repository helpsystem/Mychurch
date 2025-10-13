# 📖 گزارش جامع امکانات کتاب مقدس در سایت

## ✅ امکانات موجود (آنچه الان وجود دارد)

### 1. **ساختار کتاب مقدس**
- ✅ دارای عهد عتیق (Old Testament) و عهد جدید (New Testament)
- ✅ 66 کتاب (39 عهد عتیق + 27 عهد جدید)
- ✅ همه فصل‌ها و آیات موجود است
- ✅ دوزبانه (فارسی و انگلیسی) در دیتابیس

### 2. **حالت‌های نمایش**
سایت دارای 3 حالت نمایش است:

#### **A. Modern View (نمای استاندارد)**
- نمایش عمودی آیات
- قابلیت highlight آیات
- قابلیت یادداشت‌برداری
- قابلیت bookmark

#### **B. FlipBook 3D View (نمای کتاب)**
- ✅ افکت ورق زدن 3D
- ✅ دوزبانه (فارسی + انگلیسی) در کنار هم
- ✅ اندازه بزرگ (1100×750px)
- ✅ فونت‌های بزرگ و خوانا (1.35-1.45rem)
- ✅ شماره آیات بزرگ با gradient
- ✅ navigation با صفحه کلید
- ✅ دکمه Next Chapter در صفحه آخر

#### **C. Standard View (نمای قدیمی)**
- نمایش ساده

### 3. **روخوانی (TTS - Text to Speech)**
- ✅ قابلیت روخوانی تک آیه
- ✅ قابلیت روخوانی کل فصل
- ✅ دکمه‌های Play, Pause, Stop
- ✅ پشتیبانی از فارسی و انگلیسی
- ⚠️ **مشکل**: هماهنگی با زبان سایت ناقص است

### 4. **پلیر صوتی**
- ✅ BibleAudioPlayer component موجود است
- ✅ قابلیت پخش صوت فصل‌ها
- ⚠️ **مشکل**: فایل‌های صوتی باید اضافه شوند

### 5. **جستجو**
- ✅ جعبه جستجو موجود
- ⚠️ عملکرد کامل نیست

---

## ❌ امکانات ناقص یا مشکل‌دار

### 1. **هماهنگی زبان با سایت** ⚠️
**مشکل فعلی:**
- وقتی زبان سایت فارسی است، کتاب فقط فارسی نمایش می‌دهد
- در حالت bilingual، هر دو زبان کنار هم هستند اما RTL/LTR درست نیست

**نیاز:**
```
اگر زبان سایت = فارسی:
  - صفحه راست (اصلی) = فارسی
  - صفحه چپ (مقابل) = انگلیسی
  - جهت ورق زدن = راست به چپ (RTL)

اگر زبان سایت = انگلیسی:
  - صفحه راست (اصلی) = انگلیسی  
  - صفحه چپ (مقابل) = فارسی
  - جهت ورق زدن = چپ به راست (LTR)
```

### 2. **Header کتاب** ⚠️
**مشکل فعلی:**
- نام کتاب و عهد در header وجود دارد
- اما به‌روزرسانی کامل نیست

**نیاز:**
```
Header باید نمایش دهد:
- نام عهد: "عهد عتیق" یا "عهد جدید"
- نام کتاب: "پیدایش" / "Genesis"
- شماره فصل: "فصل 1" / "Chapter 1"
```

### 3. **شماره آیات و فصل‌ها** ⚠️
**وضعیت فعلی:**
- شماره آیات در FlipBook خیلی بزرگ است (44px)
- فرمت مشابه کتاب مقدس اصلی نیست

**نیاز:**
```
فرمت استاندارد کتاب مقدس:
  "¹در ابتدا خدا آسمان‌ها و زمین را آفرید."
  "²و زمین..."
  
شماره فصل در بالای صفحه:
  "فصل ۱" با فونت بزرگتر و bold
```

### 4. **هماهنگی روخوانی با زبان سایت** ❌
**مشکل:**
- روخوانی همیشه به یک زبان است
- تغییر با زبان سایت sync نمی‌شود

**نیاز:**
```javascript
if (siteLanguage === 'fa') {
  // روخوانی به فارسی با voice فارسی
  voice = persianVoice;
} else {
  // روخوانی به انگلیسی با voice انگلیسی
  voice = englishVoice;
}
```

### 5. **Highlight کلمه در حال خوانده شدن** ⚠️
**وضعیت:**
- کد موجود است (currentReadingWord state)
- اما به‌طور کامل پیاده‌سازی نشده

**نیاز:**
```css
.current-word {
  background: yellow;
  font-weight: bold;
  color: #000;
  padding: 2px 4px;
  border-radius: 3px;
  animation: pulse 0.5s;
}
```

### 6. **تفسیر مژده** ❌ (وجود ندارد)
**نیاز:**
- یک کتاب جداگانه به نام "تفسیر مژده"
- باید به دیتابیس اضافه شود
- یک tab یا section جدید در BibleReader

**پیشنهاد ساختار:**
```typescript
interface CommentaryBook {
  id: string;
  type: 'mojdeh-tafsir';
  name: { fa: 'تفسیر مژده', en: 'Mojdeh Commentary' };
  chapters: Chapter[];
}
```

### 7. **زوم کتاب** ⚠️
**وضعیت فعلی:**
- FlipBook اندازه ثابت دارد: 1100×750px
- قابلیت zoom وجود ندارد

**نیاز:**
```javascript
// Zoom levels: 75%, 100%, 125%, 150%
const zoomLevels = [0.75, 1, 1.25, 1.5];
// حفظ aspect ratio و استایل
```

---

## 🔧 نیازهای اصلی برای تکمیل

### اولویت 1: هماهنگی زبان **[CRITICAL]**
```typescript
// Logic مورد نیاز:
const primaryLang = lang; // زبان اصلی سایت
const secondaryLang = lang === 'fa' ? 'en' : 'fa'; // زبان مقابل

// در FlipBook:
if (lang === 'fa') {
  rightPage = verses.fa; // صفحه راست فارسی
  leftPage = verses.en;  // صفحه چپ انگلیسی
  direction = 'rtl';
} else {
  rightPage = verses.en; // صفحه راست انگلیسی
  leftPage = verses.fa;  // صفحه چپ فارسی
  direction = 'ltr';
}
```

### اولویت 2: روخوانی هوشمند **[HIGH]**
```typescript
const getBestVoice = (language: 'fa' | 'en') => {
  const voices = speechSynthesis.getVoices();
  
  if (language === 'fa') {
    // Persian voices: Google فارسی, Microsoft Sara
    return voices.find(v => 
      v.lang.includes('fa') || 
      v.name.includes('Persian') ||
      v.name.includes('Farsi')
    );
  } else {
    // English voices: Google US, Microsoft David
    return voices.find(v => 
      v.lang === 'en-US' && 
      v.name.includes('Google')
    );
  }
};
```

### اولویت 3: Highlight کلمه فعال **[MEDIUM]**
```typescript
interface ReadingProgress {
  verseNumber: number;
  wordIndex: number;
  totalWords: number;
}

const highlightCurrentWord = (progress: ReadingProgress) => {
  // پیدا کردن span مربوط به کلمه
  const wordSpan = document.querySelector(
    `[data-verse="${progress.verseNumber}"] [data-word="${progress.wordIndex}"]`
  );
  
  // اضافه کردن class
  wordSpan?.classList.add('reading-now');
};
```

### اولویت 4: تفسیر مژده **[MEDIUM]**
1. **اضافه کردن به دیتابیس:**
```sql
CREATE TABLE mojdeh_commentary (
  id SERIAL PRIMARY KEY,
  book_key VARCHAR(50),
  chapter INT,
  verse INT,
  commentary_fa TEXT,
  commentary_en TEXT
);
```

2. **Component جدید:**
```tsx
<TabView>
  <Tab label="کتاب مقدس">
    <FlipBookBibleReader />
  </Tab>
  <Tab label="تفسیر مژده">
    <MojdehCommentaryReader />
  </Tab>
</TabView>
```

### اولویت 5: Zoom کتاب **[LOW]**
```typescript
const [zoomLevel, setZoomLevel] = useState(1);

<div 
  className="flipbook-wrapper" 
  style={{
    transform: `scale(${zoomLevel})`,
    transformOrigin: 'center top',
    transition: 'transform 0.3s'
  }}
>
  <FlipBook ... />
</div>

// Zoom Controls:
<button onClick={() => setZoomLevel(z => Math.min(z + 0.25, 1.5))}>+</button>
<button onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.75))}>-</button>
```

---

## 📊 وضعیت فعلی (Summary)

| امکانات | وضعیت | درصد تکمیل |
|---------|-------|------------|
| ساختار عهد قدیم/جدید | ✅ کامل | 100% |
| دوزبانه بودن دیتا | ✅ کامل | 100% |
| FlipBook 3D | ✅ کامل | 95% |
| هماهنگی با زبان سایت | ⚠️ ناقص | 40% |
| Header با نام عهد/کتاب | ⚠️ ناقص | 70% |
| فرمت شماره آیات | ⚠️ نیاز به بهبود | 60% |
| روخوانی هوشمند | ⚠️ ناقص | 50% |
| Highlight کلمه فعال | ⚠️ ناقص | 30% |
| تفسیر مژده | ❌ وجود ندارد | 0% |
| زوم کتاب | ❌ وجود ندارد | 0% |

**میانگین کلی: 64.5%**

---

## 🎯 پلان اجرایی (Action Plan)

### فاز 1: رفع مشکلات حیاتی (1-2 ساعت)
1. ✅ هماهنگی زبان با سایت
2. ✅ روخوانی با زبان صحیح
3. ✅ بهبود Header

### فاز 2: بهبودهای UX (2-3 ساعت)
4. ✅ Highlight کلمه در حال خوانده شدن
5. ✅ فرمت بهتر شماره آیات
6. ✅ Zoom کتاب

### فاز 3: محتوای جدید (3-4 ساعت)
7. ✅ اضافه کردن تفسیر مژده به دیتابیس
8. ✅ ساخت MojdehCommentaryReader
9. ✅ یکپارچه‌سازی در BibleReaderPage

---

## 📁 فایل‌های کلیدی

```
components/
├── FlipBookBibleReader.tsx      [799 lines] - اصلی‌ترین component
├── FlipBookBibleReader.css      [1110 lines] - استایل‌ها
├── BibleAudioPlayer.tsx         - پلیر صوتی
├── ModernBibleReader.tsx        - نمای استاندارد
└── BibleReader.tsx              - نمای قدیمی

pages/
└── BibleReaderPage.tsx          - صفحه اصلی با toggle views

hooks/
├── useBibleTTS.ts               - هوک روخوانی
└── useLanguage.ts               - هوک زبان

backend/routes/
└── bibleRoutes.js               - API کتاب مقدس
```

---

## 🔍 نکات فنی مهم

### 1. ساختار دیتابیس فعلی
```sql
-- جداول موجود:
bible_books (66 کتاب)
  - key: کلید کتاب (Gen, Exod, Matt, ...)
  - name_fa, name_en
  - testament: 'old' | 'new'
  - chapters: تعداد فصل‌ها

bible_verses (31,102 آیه)
  - book_key
  - chapter_number
  - verse_number
  - text_fa
  - text_en
```

### 2. API های موجود
```
GET /api/bible/books           - لیست کتاب‌ها
GET /api/bible/content/:book/:chapter  - آیات یک فصل
GET /api/bible/search?q=...    - جستجو
```

### 3. State Management
```typescript
// States اصلی در FlipBookBibleReader:
- selectedBookKey: string
- selectedChapter: number
- verses: BibleVerse[]
- isBilingualMode: boolean
- readingLang: 'fa' | 'en'
- currentPage: number
```

---

**آخرین به‌روزرسانی**: 12 اکتبر 2025
**نویسنده**: GitHub Copilot
**وضعیت**: در حال توسعه 🚧
