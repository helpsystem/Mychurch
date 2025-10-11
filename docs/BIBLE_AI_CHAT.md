# 🤖 Bible AI Chat Assistant - راهنمای استفاده

## نمای کلی

یک **دستیار هوشمند کتاب مقدس** که با استفاده از هوش مصنوعی به سوالات کتاب‌مقدسی پاسخ می‌دهد و آیات مرتبط را نمایش می‌دهد.

## ویژگی‌ها ✨

### 1. پاسخ به سوالات
- پاسخ هوشمند به سوالات کتاب‌مقدسی
- جستجوی خودکار در پایگاه داده کتاب مقدس
- ارائه آیات مرتبط با موضوع

### 2. آیه روزانه
- نمایش آیه روزانه هنگام باز کردن چت
- تنوع آیات با استفاده از seed تاریخ

### 3. جستجوی پیشرفته
- جستجو با کلمات کلیدی
- پیدا کردن آیه با مرجع (مثال: یوحنا 3:16)
- نمایش زمینه آیات (آیات قبل و بعد)

### 4. پشتیبانی دو زبانه
- فارسی (پیش‌فرض)
- انگلیسی
- امکان تغییر زبان در هدر ویجت

## معماری

```
backend/
├── services/
│   └── bibleAIService.js       # سرویس اصلی AI
├── routes/
│   └── aiChatRoutes.js         # API endpoints
└── server.js                    # تنظیم روت‌ها

frontend/
├── components/
│   └── BibleAIChatWidget.tsx   # ویجت چت شناور
└── pages/
    └── BibleAIChatPage.tsx     # صفحه معرفی
```

## API Endpoints

### 1. POST `/api/ai-chat/ask`
پرسیدن سوال از AI

**Request:**
```json
{
  "question": "چگونه می‌توانم آرامش پیدا کنم؟",
  "language": "fa"
}
```

**Response:**
```json
{
  "answer": "کتاب مقدس در مورد این موضوع می‌فرماید:",
  "verses": [
    {
      "reference": "یوحنا 14:27",
      "text": "آرامش خود را به شما می‌بخشم...",
      "book_code": "JHN",
      "chapter": 14,
      "verse": 27
    }
  ],
  "suggestion": "برای مطالعه بیشتر، این آیات را با یکدیگر مقایسه کنید."
}
```

### 2. GET `/api/ai-chat/daily-verse`
دریافت آیه روزانه

**Query Parameters:**
- `language`: `fa` | `en` (پیش‌فرض: `fa`)

**Response:**
```json
{
  "reference": "یوحنا 3:16",
  "text": "زیرا خدا جهان را چنان محبت نمود...",
  "book_code": "JHN",
  "chapter": 3,
  "verse": 16
}
```

### 3. POST `/api/ai-chat/search`
جستجوی آیات با کلمه کلیدی

**Request:**
```json
{
  "query": "محبت",
  "language": "fa",
  "limit": 5
}
```

**Response:**
```json
{
  "verses": [
    {
      "book_name": "یوحنا",
      "book_code": "JHN",
      "chapter_number": 3,
      "verse_number": 16,
      "text": "زیرا خدا جهان را چنان محبت نمود..."
    }
  ]
}
```

### 4. GET `/api/ai-chat/verse/:reference`
دریافت آیه با مرجع

**مثال:** `/api/ai-chat/verse/John 3:16?language=en`

### 5. GET `/api/ai-chat/context/:bookCode/:chapter/:verse`
دریافت زمینه آیه (آیات اطراف)

**مثال:** `/api/ai-chat/context/JHN/3/16?contextSize=2`

### 6. POST `/api/ai-chat/cross-references`
دریافت آیات مرتبط

**Request:**
```json
{
  "keywords": ["محبت", "عشق"],
  "language": "fa",
  "limit": 3
}
```

## الگوریتم Pattern Matching

سیستم از pattern matching برای شناسایی موضوعات استفاده می‌کند:

```javascript
const patterns = {
  peace: {
    keywords: ['peace', 'صلح', 'آرامش', 'سکون'],
    verses: ['JHN 14:27', 'PHP 4:7', 'ISA 26:3']
  },
  love: {
    keywords: ['love', 'محبت', 'عشق'],
    verses: ['JHN 3:16', '1CO 13:4', 'ROM 8:38']
  },
  hope: {
    keywords: ['hope', 'امید', 'رجاء'],
    verses: ['JER 29:11', 'ROM 15:13', 'PSA 42:11']
  },
  strength: {
    keywords: ['strength', 'قوت', 'نیرو', 'توان'],
    verses: ['PHP 4:13', 'ISA 40:31', 'PSA 46:1']
  }
}
```

## استفاده در Frontend

### 1. اضافه کردن ویجت به App.tsx

```tsx
import BibleAIChatWidget from './components/BibleAIChatWidget';

function App() {
  return (
    <>
      {/* سایر کامپوننت‌ها */}
      <BibleAIChatWidget />
    </>
  );
}
```

### 2. استفاده از API در کامپوننت‌ها

```tsx
import axios from 'axios';

// پرسیدن سوال
const askQuestion = async (question: string) => {
  const response = await axios.post('/api/ai-chat/ask', {
    question,
    language: 'fa'
  });
  return response.data;
};

// دریافت آیه روزانه
const getDailyVerse = async () => {
  const response = await axios.get('/api/ai-chat/daily-verse', {
    params: { language: 'fa' }
  });
  return response.data;
};
```

## UI/UX ویژگی‌ها

### دکمه شناور
- موقعیت: پایین راست صفحه
- انیمیشن: scale و shadow هنگام hover
- نشان AI: pulse animation

### ویجت چت
- ابعاد: 384px × 600px
- موقعیت: Fixed bottom-right
- پشتیبانی RTL/LTR
- Responsive

### پیام‌ها
- پیام کاربر: gradient آبی-بنفش
- پیام AI: سفید با border
- آیات: پس‌زمینه amber با border

### آیه روزانه
- نمایش در بالای چت
- پس‌زمینه gradient amber-orange
- آیکون کتاب

### سوالات پیشنهادی
- نمایش هنگام چت خالی
- 4 سوال پیشنهادی
- کلیک برای ارسال خودکار

## بهینه‌سازی

### 1. Database Query
```sql
-- استفاده از index برای جستجوی سریع
CREATE INDEX idx_verses_text_fa ON bible_verses 
  USING gin(to_tsvector('simple', text_fa));

CREATE INDEX idx_verses_text_en ON bible_verses 
  USING gin(to_tsvector('english', text_en));
```

### 2. Rate Limiting
```javascript
// محدودیت درخواست: 10 req/min per user
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10
});

app.use('/api/ai-chat', limiter);
```

### 3. Caching
```javascript
// کش آیه روزانه
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 86400 }); // 24 hours

async function getDailyVerse(language) {
  const cacheKey = `daily_${language}_${new Date().toDateString()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  
  const verse = await fetchDailyVerseFromDB(language);
  cache.set(cacheKey, verse);
  return verse;
}
```

## ارتقا به OpenAI (اختیاری)

برای استفاده از GPT-4 به جای pattern matching:

```javascript
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateAIResponseWithGPT(userQuestion, verses) {
  const prompt = `
    You are a Bible study assistant. A user asked: "${userQuestion}"
    
    Here are relevant verses from the Bible:
    ${verses.map(v => `${v.reference}: ${v.text}`).join('\n')}
    
    Provide a thoughtful, biblical response in Persian (Farsi).
  `;
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });
  
  return completion.choices[0].message.content;
}
```

## تست

### 1. تست API
```bash
# پرسیدن سوال
curl -X POST http://localhost:3001/api/ai-chat/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "چگونه می‌توانم آرامش پیدا کنم؟", "language": "fa"}'

# آیه روزانه
curl http://localhost:3001/api/ai-chat/daily-verse?language=fa

# جستجو
curl -X POST http://localhost:3001/api/ai-chat/search \
  -H "Content-Type: application/json" \
  -d '{"query": "محبت", "language": "fa", "limit": 5}'
```

### 2. تست Frontend
```bash
npm run dev
# Navigate to http://localhost:5173
# کلیک روی دکمه چت شناور
```

## Deployment

### 1. متغیرهای محیطی
```bash
# .env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### 2. Build
```bash
# Backend
cd backend
npm install

# Frontend
cd ..
npm install
npm run build
```

### 3. Start Server
```bash
cd backend
node server.js
```

## مثال‌های استفاده

### سوالات رایج

1. **آرامش و سکون**
   - "چگونه می‌توانم آرامش پیدا کنم؟"
   - آیات: یوحنا 14:27، فیلیپیان 4:7، اشعیا 26:3

2. **محبت**
   - "خداوند چه می‌گوید درباره محبت؟"
   - آیات: یوحنا 3:16، ۱ قرنتیان 13:4، رومیان 8:38

3. **امید**
   - "چگونه امیدوار باشم؟"
   - آیات: ارمیا 29:11، رومیان 15:13، مزامیر 42:11

4. **قدرت و توان**
   - "از کجا قدرت بگیرم؟"
   - آیات: فیلیپیان 4:13، اشعیا 40:31، مزامیر 46:1

## مقایسه با AlHayat GPT

| ویژگی | Mychurch AI Chat | AlHayat GPT |
|------|------------------|-------------|
| **پایگاه داده محلی** | ✅ | ❌ |
| **دو زبانه (فا/انگ)** | ✅ | ✅ |
| **بدون API Key** | ✅ | ✅ |
| **Offline Support** | ✅ | ❌ |
| **Custom Patterns** | ✅ | ❌ |
| **Widget Embed** | ✅ | ✅ |
| **Cost** | رایگان | رایگان |

## مزایای نسخه فعلی

1. **کاملاً رایگان** - بدون نیاز به API key
2. **حریم خصوصی** - داده‌ها روی سرور خودتان
3. **سرعت بالا** - query مستقیم از PostgreSQL
4. **Offline** - کار می‌کند بدون اینترنت
5. **Customizable** - pattern‌ها رو خودتان تعریف کنید

## توسعه آینده

### فاز 1 (فعلی) ✅
- Pattern matching اصلی
- جستجوی کلمه کلیدی
- آیه روزانه
- UI/UX ویجت

### فاز 2 (آینده)
- [ ] یکپارچه‌سازی با OpenAI GPT-4
- [ ] تاریخچه مکالمات
- [ ] نشانک‌گذاری آیات
- [ ] اشتراک‌گذاری آیات

### فاز 3 (آینده دور)
- [ ] Voice input/output
- [ ] Bible study plans
- [ ] Community questions
- [ ] Mobile app

## پشتیبانی

برای سوالات و مشکلات:
1. بررسی logs سرور: `backend/logs/`
2. تست API endpoints با curl
3. بررسی browser console برای خطاهای frontend

---

**ساخته شده با ❤️ برای کلیسای ایرانیان**
