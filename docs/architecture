# 🏛️ معماری و دیاگرام کلی سایت کلیسای ایرانیان واشنگتن دی سی

## 📊 نمای کلی (High-Level Architecture)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                         │
│                         Port: 5173                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │   صفحه اصلی  │  │  کتاب مقدس   │  │    مدیریت   │  │   وبلاگ     ││
│  │   HomePage   │  │   Bible      │  │  Dashboard   │  │   Blog      ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘│
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │   موعظه‌ها   │  │ سرودهای عبادت│  │   رویدادها   │  │  درخواست   ││
│  │   Sermons    │  │  Worship     │  │    Events    │  │   دعا       ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕️
                            REST API (JSON)
                                    ↕️
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js + Express)                        │
│                         Port: 3001                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  📚 Bible API        │  🤖 AI Chat         │  🎤 Sermons API           │
│  📅 Events API       │  🎵 Worship Songs   │  🙏 Prayer Requests       │
│  👥 Leaders API      │  🔐 Authentication  │  🎨 Image Generation      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕️
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase PostgreSQL)                       │
│                    Cloud-hosted Database                                │
├─────────────────────────────────────────────────────────────────────────┤
│  📖 bible_verses     │  📚 bible_books     │  👤 users                 │
│  🎤 sermons          │  📅 events          │  🎵 worship_songs         │
│  🙏 prayer_requests  │  👥 leaders         │  🎨 auto_images           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ ساختار فایل‌ها و پوشه‌ها

### 📁 Frontend Structure

```
Mychurch/
├── 📄 App.tsx                          # اپلیکیشن اصلی و Routing
├── 📄 index.tsx                        # Entry point
├── 📄 vite.config.ts                   # تنظیمات Vite
│
├── 📂 components/                      # کامپوننت‌های قابل استفاده مجدد
│   ├── 📄 BibleReader.tsx              # خواننده کتاب مقدس (نمای عادی)
│   ├── 📄 FlipBookBibleReader.tsx      # 📖 خواننده 3D کتاب مقدس ⭐
│   ├── 📄 ModernBibleReader.tsx        # خواننده مدرن با قابلیت‌های پیشرفته
│   ├── 📄 BibleAIChatWidget.tsx        # چت AI کتاب مقدس
│   ├── 📄 BibleAudioPlayer.tsx         # پلیر صوتی کتاب مقدس
│   ├── 📄 EnhancedSermonsPage.tsx      # صفحه موعظه‌ها
│   ├── 📄 EnhancedWorshipSongs.tsx     # صفحه سرودهای عبادت
│   ├── 📄 EventsCalendar.tsx           # تقویم رویدادها
│   ├── 📄 DailyDevotional.tsx          # دعای روزانه
│   ├── 📄 PrayerWall.tsx               # دیوار دعا
│   ├── 📄 DashboardView.tsx            # پنل مدیریت
│   ├── 📄 EmailClient.tsx              # سیستم ایمیل
│   └── ...
│
├── 📂 pages/                           # صفحات اصلی
│   ├── 📄 HomePage.tsx                 # صفحه اصلی
│   ├── 📄 AboutPage.tsx                # درباره ما
│   ├── 📄 ContactPage.tsx              # تماس با ما
│   └── ...
│
├── 📂 context/                         # Context API (State Management)
│   ├── 📄 AuthContext.tsx              # احراز هویت
│   └── 📄 LanguageContext.tsx          # مدیریت زبان (فارسی/انگلیسی)
│
├── 📂 hooks/                           # Custom React Hooks
│   ├── 📄 useBibleTTS.ts               # Text-to-Speech برای کتاب مقدس
│   └── ...
│
├── 📂 services/                        # سرویس‌های API
│   ├── 📄 api.ts                       # Axios instance و تنظیمات
│   └── ...
│
└── 📂 public/                          # فایل‌های استاتیک
    ├── 📄 manifest.json
    ├── 📄 sw.js                        # Service Worker
    └── 📂 assets/
```

### 📁 Backend Structure

```
backend/
├── 📄 dev-server.js                    # سرور توسعه اصلی ⭐
├── 📄 server.js                        # سرور تولید
├── 📄 db-postgres.js                   # اتصال به دیتابیس PostgreSQL
├── 📄 package.json                     # وابستگی‌های backend
│
├── 📂 routes/                          # API Routes
│   ├── 📄 bible.js                     # 📖 /api/bible/*
│   ├── 📄 ai-chat.js                   # 🤖 /api/ai-chat/*
│   ├── 📄 sermons.js                   # 🎤 /api/sermons/*
│   ├── 📄 events.js                    # 📅 /api/events/*
│   ├── 📄 worship-songs.js             # 🎵 /api/worship-songs/*
│   ├── 📄 prayer-requests.js           # 🙏 /api/prayer-requests/*
│   ├── 📄 leaders.js                   # 👥 /api/leaders/*
│   ├── 📄 auth.js                      # 🔐 /api/auth/*
│   └── 📄 images.js                    # 🎨 /api/images/*
│
├── 📂 services/                        # Business Logic Services
│   ├── 📄 BibleAIService.js            # سرویس AI کتاب مقدس
│   ├── 📄 ImageGenerationService.js    # تولید تصاویر خودکار
│   └── ...
│
├── 📂 middleware/                      # Express Middlewares
│   ├── 📄 auth.middleware.js           # احراز هویت
│   └── 📄 cors.middleware.js           # CORS تنظیمات
│
└── 📂 scripts/                         # اسکریپت‌های کمکی
    ├── 📄 initDB-postgres.js           # راه‌اندازی اولیه دیتابیس
    └── 📄 seedData.js                  # داده‌های نمونه
```

---

## 🗃️ ساختار دیتابیس (Database Schema)

### 📚 **Bible Tables**

```sql
-- جدول کتاب‌های کتاب مقدس
bible_books:
  - id (PK)
  - key (varchar)                  # مثل: "gen", "mat"
  - name_en (varchar)              # Genesis, Matthew
  - name_fa (varchar)              # پیدایش, متی
  - testament (enum)               # 'old' or 'new'
  - chapter_count (integer)
  - order_number (integer)

-- جدول آیات کتاب مقدس
bible_verses:
  - id (PK)
  - book_key (FK → bible_books)
  - chapter (integer)
  - verse (integer)
  - text_en (text)                 # متن انگلیسی
  - text_fa (text)                 # متن فارسی
  - audio_url_en (varchar)
  - audio_url_fa (varchar)
```

### 🎤 **Sermons Tables**

```sql
sermons:
  - id (PK)
  - title_en (varchar)
  - title_fa (varchar)
  - description_en (text)
  - description_fa (text)
  - speaker (varchar)
  - date (date)
  - duration (integer)             # به ثانیه
  - video_url (varchar)
  - audio_url (varchar)
  - thumbnail_url (varchar)
  - views (integer)
  - category (varchar)
  - created_at (timestamp)
```

### 🎵 **Worship Songs Tables**

```sql
worship_songs:
  - id (PK)
  - title_en (varchar)
  - title_fa (varchar)
  - lyrics_en (text)
  - lyrics_fa (text)
  - artist (varchar)
  - audio_url (varchar)
  - video_url (varchar)
  - thumbnail_url (varchar)
  - category (varchar)
  - language (enum)                # 'fa', 'en', 'both'
  - created_at (timestamp)
```

### 📅 **Events Tables**

```sql
events:
  - id (PK)
  - title_en (varchar)
  - title_fa (varchar)
  - description_en (text)
  - description_fa (text)
  - event_date (timestamp)
  - location (varchar)
  - location_url (varchar)         # لینک Google Maps
  - image_url (varchar)
  - category (varchar)
  - is_recurring (boolean)
  - recurring_pattern (varchar)
  - created_at (timestamp)
```

### 🙏 **Prayer Requests Tables**

```sql
prayer_requests:
  - id (PK)
  - requester_name (varchar)
  - request_text_en (text)
  - request_text_fa (text)
  - is_anonymous (boolean)
  - is_approved (boolean)
  - prayer_count (integer)
  - category (varchar)
  - created_at (timestamp)
  - updated_at (timestamp)
```

### 👥 **Church Leaders Tables**

```sql
leaders:
  - id (PK)
  - name_en (varchar)
  - name_fa (varchar)
  - title_en (varchar)
  - title_fa (varchar)
  - bio_en (text)
  - bio_fa (text)
  - photo_url (varchar)
  - email (varchar)
  - phone (varchar)
  - order_number (integer)
```

### 👤 **Users Tables**

```sql
users:
  - id (PK)
  - username (varchar, unique)
  - email (varchar, unique)
  - password_hash (varchar)
  - role (enum)                    # 'admin', 'member', 'guest'
  - language_preference (enum)     # 'fa', 'en'
  - created_at (timestamp)
  - last_login (timestamp)
```

### 🎨 **Auto-Generated Images Tables**

```sql
auto_images:
  - id (PK)
  - type (varchar)                 # 'daily_verse', 'event', 'sermon'
  - content_en (text)
  - content_fa (text)
  - image_url (varchar)
  - status (enum)                  # 'pending', 'generated', 'failed'
  - created_at (timestamp)
```

---

## 🔄 جریان داده (Data Flow)

### 📖 مثال: خواندن کتاب مقدس

```
┌──────────────┐
│   کاربر      │
│  FlipBook    │
│  Component   │
└──────┬───────┘
       │
       │ 1. انتخاب کتاب و فصل
       ↓
┌──────────────┐
│   useState   │
│ selectedBook │
│selectedChapter│
└──────┬───────┘
       │
       │ 2. useEffect فراخوانی API
       ↓
┌──────────────┐
│   api.get()  │
│ /api/bible/  │
│ content/:book│
│   /:chapter  │
└──────┬───────┘
       │
       │ 3. درخواست به Backend
       ↓
┌──────────────┐
│   Express    │
│ Route Handler│
│  bible.js    │
└──────┬───────┘
       │
       │ 4. کوئری به دیتابیس
       ↓
┌──────────────┐
│  PostgreSQL  │
│ bible_verses │
│    Table     │
└──────┬───────┘
       │
       │ 5. نتیجه (JSON)
       ↓
┌──────────────┐
│   Backend    │
│   Response   │
│  {verses: []}│
└──────┬───────┘
       │
       │ 6. بازگشت به Frontend
       ↓
┌──────────────┐
│   setVerses()│
│   Re-render  │
│   Display    │
└──────────────┘
```

---

## 🎯 قابلیت‌های اصلی سایت

### 📖 **کتاب مقدس (Bible)**
- ✅ سه نمای مختلف: عادی، مدرن، FlipBook 3D
- ✅ حالت دوزبانه (فارسی/انگلیسی side-by-side)
- ✅ Text-to-Speech (روخوانی)
- ✅ جستجو در آیات
- ✅ Bookmark و Highlight
- ✅ یادداشت‌گذاری
- ✅ کیبورد Navigation
- ✅ چت AI کتاب مقدس

### 🎤 **موعظه‌ها (Sermons)**
- ویدیو و صوت
- دسته‌بندی
- جستجو و فیلتر
- آمار بازدید
- دانلود

### 🎵 **سرودهای عبادت (Worship Songs)**
- لیست سرودها
- متن کامل (فارسی/انگلیسی)
- پخش صوتی
- ویدیو

### 📅 **رویدادها (Events)**
- تقویم رویدادها
- رویدادهای تکرارشونده
- لینک Google Maps
- ثبت‌نام

### 🙏 **درخواست دعا (Prayer Requests)**
- ارسال درخواست
- دعا برای دیگران
- ناشناس یا با نام
- تأیید توسط مدیر

### 🤖 **AI Chat**
- پاسخ به سؤالات مرتبط با کتاب مقدس
- پیشنهاد آیات
- تفسیر

### 🎨 **تولید تصویر خودکار**
- آیه روزانه
- تصاویر رویدادها
- پوسترهای موعظه

---

## 🔧 تکنولوژی‌های استفاده شده

### Frontend
- ⚛️ **React 18** - فریمورک اصلی
- ⚡ **Vite** - Build tool
- 📘 **TypeScript** - Type safety
- 🎨 **CSS3** - استایل‌دهی
- 🔄 **Axios** - HTTP client
- 🎤 **Web Speech API** - Text-to-Speech

### Backend
- 🟢 **Node.js** - Runtime
- 🚂 **Express.js** - Web framework
- 🔐 **bcrypt** - رمزنگاری
- 🎫 **JWT** - احراز هویت
- 🤖 **AI Integration** - چت هوشمند

### Database
- 🐘 **PostgreSQL** (Supabase)
- 📊 SQL queries

### DevOps
- 🐳 **Docker** - containerization
- 🔄 **Git** - version control
- ☁️ **Cloud Hosting** (آماده deploy)

---

## 📍 API Endpoints (نقاط انتهایی)

### 📖 Bible API
```
GET  /api/bible/books                    # لیست کتاب‌ها
GET  /api/bible/content/:book/:chapter   # آیات یک فصل
GET  /api/bible/search?q=query           # جستجو
GET  /api/bible/verse/:book/:chapter/:verse  # یک آیه خاص
```

### 🎤 Sermons API
```
GET    /api/sermons                      # لیست موعظه‌ها
GET    /api/sermons/:id                  # جزئیات یک موعظه
POST   /api/sermons                      # افزودن موعظه جدید
PUT    /api/sermons/:id                  # ویرایش موعظه
DELETE /api/sermons/:id                  # حذف موعظه
```

### 🎵 Worship Songs API
```
GET    /api/worship-songs                # لیست سرودها
GET    /api/worship-songs/:id            # جزئیات یک سرود
POST   /api/worship-songs                # افزودن سرود جدید
PUT    /api/worship-songs/:id            # ویرایش سرود
DELETE /api/worship-songs/:id            # حذف سرود
```

### 📅 Events API
```
GET    /api/events                       # لیست رویدادها
GET    /api/events/:id                   # جزئیات یک رویداد
POST   /api/events                       # افزودن رویداد جدید
PUT    /api/events/:id                   # ویرایش رویداد
DELETE /api/events/:id                   # حذف رویداد
GET    /api/events/upcoming              # رویدادهای آینده
```

### 🙏 Prayer Requests API
```
GET    /api/prayer-requests              # لیست درخواست‌های دعا
POST   /api/prayer-requests              # ارسال درخواست جدید
PUT    /api/prayer-requests/:id/pray     # دعا کردن برای یک درخواست
DELETE /api/prayer-requests/:id          # حذف درخواست
```

### 🤖 AI Chat API
```
POST   /api/ai-chat/ask                  # پرسیدن سؤال
GET    /api/ai-chat/daily-verse          # آیه روزانه
POST   /api/ai-chat/explain              # تفسیر آیه
```

### 🔐 Authentication API
```
POST   /api/auth/login                   # ورود
POST   /api/auth/register                # ثبت‌نام
POST   /api/auth/logout                  # خروج
GET    /api/auth/me                      # اطلاعات کاربر
```

---

## 🚀 نحوه اجرا

### Development Mode
```bash
# Frontend + Backend
npm run dev:full

# یا جداگانه:
npm run dev        # Frontend (port 5173)
npm run backend    # Backend (port 3001)
```

### Production Mode
```bash
npm run build      # Build frontend
npm start          # Start production server
```

---

## 📝 نکات مهم

1. **Backend** باید همیشه قبل از Frontend اجرا شود
2. **Database** از Supabase استفاده می‌کند (Cloud PostgreSQL)
3. **Port 3001** برای Backend و **Port 5173** برای Frontend
4. **HMR** (Hot Module Replacement) در development فعال است
5. زبان پیش‌فرض **فارسی** است ولی کاملاً دوزبانه

---

## 🎯 اولویت‌های توسعه بعدی

1. ✅ FlipBook 3D - **کامل شد**
2. ⏳ Touch Gesture Support
3. ⏳ بهبود کنترل‌های صوتی
4. 📱 Progressive Web App (PWA)
5. 🔔 سیستم نوتیفیکیشن
6. 📊 آمار و گزارش‌گیری
7. 💬 سیستم کامنت
8. 📧 خبرنامه (Newsletter)

---

## 📞 پشتیبانی

برای هر سؤال یا مشکلی، به مدیر سیستم مراجعه کنید.

**تاریخ ایجاد:** October 12, 2025  
**آخرین بروزرسانی:** October 12, 2025

---

*این دیاگرام یک نمای کلی از معماری سایت است و می‌تواند به‌عنوان مرجع برای توسعه‌دهندگان استفاده شود.* 🙏
