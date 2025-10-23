# 📚 Iran Church DC - Development Log & Documentation

> **مستندات کامل توسعه و استقرار پروژه**  
> **تاریخ شروع**: اکتبر 2025  
> **توسعه‌دهندگان**: Sami + GitHub Copilot AI

---

## 📋 فهرست مطالب

1. [معرفی پروژه](#معرفی-پروژه)
2. [ساختار فایل‌ها](#ساختار-فایلها)
3. [تنظیمات محیط Local](#تنظیمات-محیط-local)
4. [تنظیمات سرور و Host](#تنظیمات-سرور-و-host)
5. [قابلیت‌های پیاده‌سازی شده](#قابلیتهای-پیادهسازی-شده)
6. [مشکلات و راه‌حل‌ها](#مشکلات-و-راهحلها)
7. [دستورات مهم](#دستورات-مهم)
8. [To-Do List](#to-do-list)
9. [یادداشت‌های مهم](#یادداشتهای-مهم)

---

## 🎯 معرفی پروژه

### نام پروژه
**Iran Church DC - MyChurch Web Application**

### توضیحات
سیستم جامع کلیسای ایرانیان واشنگتن DC شامل:
- 📖 قرائت کتاب مقدس (دو زبانه فارسی/انگلیسی)
- 🎤 سیستم Text-to-Speech با Google Cloud
- 📜 حالت Simple Mode (اسکرول)
- 📖 حالت Flipbook Mode (انیمیشن 3D ورق زدن)
- 🎬 حالت Presentation (برای ویدیو پروژکتور)
- 🎵 سیستم مدیریت ستایش و عبادت
- 💬 سیستم چت و گفتگو
- 👥 مدیریت اعضا

### تکنولوژی‌ها
- **Frontend**: React 18.3.1 + TypeScript 5.8.2 + Vite 6.2.0
- **Styling**: TailwindCSS 3.4.17
- **Backend**: Node.js v22.20.0 + Express.js
- **Database**: Supabase PostgreSQL
- **TTS**: Google Cloud Text-to-Speech API
- **3D Flipbook**: react-pageflip 2.0.3
- **Deployment**: Render.com (Production)

---

## 📁 ساختار فایل‌ها

```
Mychurch/
├── 📂 backend/               # Backend Server (Node.js + Express)
│   ├── server.js            # Main server file
│   ├── routes/              # API Routes
│   │   ├── bibleUnified.js  # Bible API endpoints
│   │   ├── auth.js          # Authentication
│   │   └── ...
│   ├── middleware/          # Express middleware
│   ├── scripts/             # Database scripts
│   └── .env                 # Environment variables (NEVER commit!)
│
├── 📂 pages/                 # React Pages
│   ├── BibleViewer.tsx      # ⭐ صفحه اصلی قرائت کتاب مقدس
│   ├── Home.tsx
│   └── ...
│
├── 📂 components/            # React Components
│   ├── BibleToolbar.tsx     # Toolbar with controls
│   ├── BibleSimple.tsx      # Simple scroll mode
│   ├── BibleFlipbookUnified.tsx  # 3D flipbook mode
│   ├── LoadingSpinner.tsx   # Loading indicator
│   └── ...
│
├── 📂 hooks/                 # Custom React Hooks
│   ├── useBibleMode.ts      # State management for Bible reader
│   ├── useTTS.ts            # Text-to-Speech functionality
│   └── ...
│
├── 📂 services/              # API Services
│   └── ...
│
├── 📂 public/                # Static files
│   ├── bibles/              # Bible JSON files
│   └── assets/
│
├── 📂 docs/                  # Documentation
│   └── ...
│
├── 📄 App.tsx               # Main React App
├── 📄 index.tsx             # Entry point
├── 📄 vite.config.ts        # Vite configuration
├── 📄 package.json          # Dependencies
├── 📄 tsconfig.json         # TypeScript config
├── 📄 tailwind.config.js    # TailwindCSS config
├── 📄 render.yaml           # Render.com deployment config
├── 📄 .gitignore            # Git ignore rules
└── 📄 README.md             # Project readme
```

---

## 💻 تنظیمات محیط Local

### پیش‌نیازها

```powershell
# نصب Node.js (نسخه 22.20.0 یا بالاتر)
node --version  # باید v22.20.0 نشان دهد

# نصب npm
npm --version

# نصب Git
git --version
```

### نصب اولیه پروژه

```powershell
# 1. Clone کردن پروژه
cd "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git"
git clone https://github.com/helpsystem/Mychurch.git
cd Mychurch

# 2. نصب Dependencies - Frontend
npm install

# 3. نصب Dependencies - Backend
cd backend
npm install
cd ..
```

### تنظیم Environment Variables

#### 📄 فایل `backend/.env` (Local)

```env
# Database - Supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Google Cloud TTS
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# Server
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-here

# Cors
FRONTEND_URL=http://localhost:5174
```

**⚠️ مهم**: این فایل را **هرگز** commit نکنید!

### اجرای پروژه در Local

#### روش 1️⃣: اجرای جداگانه (توصیه می‌شود)

```powershell
# Terminal 1 - Backend Server
cd "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\backend"
node server.js

# Terminal 2 - Frontend Dev Server
cd "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch"
npm run dev
```

#### روش 2️⃣: اجرای همزمان

```powershell
cd "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch"
npm run dev:full  # اجرای همزمان Backend + Frontend
```

### URLs در Local

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3001
- **Bible Viewer**: http://localhost:5174/bible-viewer

---

## 🌐 تنظیمات سرور و Host

### Render.com Deployment

#### 1️⃣ ساخت Web Service

```yaml
# render.yaml
services:
  # Frontend
  - type: web
    name: mychurch-frontend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run preview
    envVars:
      - key: NODE_ENV
        value: production
      - key: VITE_API_URL
        value: https://mychurch-backend.onrender.com

  # Backend
  - type: web
    name: mychurch-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: SUPABASE_URL
        sync: false  # از Dashboard تنظیم شود
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: DATABASE_URL
        sync: false
```

#### 2️⃣ تنظیم Environment Variables در Render Dashboard

1. به https://dashboard.render.com برو
2. Service خود را انتخاب کن
3. Environment → Add Environment Variable
4. متغیرهای زیر را اضافه کن:

```
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_SERVICE_KEY=[KEY]
DATABASE_URL=postgresql://...
GOOGLE_CLOUD_PROJECT_ID=[PROJECT_ID]
JWT_SECRET=[RANDOM_SECRET]
FRONTEND_URL=https://mychurch-frontend.onrender.com
```

#### 3️⃣ Deploy کردن

```powershell
# Commit و Push
cd "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch"
git add .
git commit -m "Deploy to production"
git push origin main
```

**Render به صورت خودکار deploy می‌کند!**

#### 4️⃣ URLs در Production

- **Frontend**: https://mychurch-frontend.onrender.com
- **Backend**: https://mychurch-backend.onrender.com
- **Bible Viewer**: https://mychurch-frontend.onrender.com/bible-viewer

### Supabase Database Setup

#### ساخت جداول

```sql
-- جدول کتاب‌های کتاب مقدس
CREATE TABLE bible_books (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_fa VARCHAR(100) NOT NULL,
  testament VARCHAR(2) NOT NULL, -- 'OT' or 'NT'
  total_chapters INTEGER NOT NULL,
  book_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول آیات انگلیسی
CREATE TABLE verses_eng (
  id SERIAL PRIMARY KEY,
  book_code VARCHAR(10) NOT NULL,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  verse_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (book_code) REFERENCES bible_books(code)
);

-- جدول آیات فارسی (ترجمه قدیم)
CREATE TABLE verses_qadim (
  id SERIAL PRIMARY KEY,
  book_code VARCHAR(10) NOT NULL,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  verse_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (book_code) REFERENCES bible_books(code)
);

-- Index برای بهبود performance
CREATE INDEX idx_verses_eng_book_chapter ON verses_eng(book_code, chapter);
CREATE INDEX idx_verses_qadim_book_chapter ON verses_qadim(book_code, chapter);
```

---

## ✨ قابلیت‌های پیاده‌سازی شده

### 📖 Bible Unified Viewer (اکتبر 2025)

#### ویژگی‌ها:
- ✅ **دو زبانه کامل**: فارسی (ترجمه قدیم) و انگلیسی
- ✅ **سه حالت نمایش**:
  - 📜 **Simple Mode**: اسکرول ساده مناسب مطالعه
  - 📖 **Flipbook Mode**: انیمیشن 3D ورق زدن کتاب
  - 🎬 **Presentation Mode**: برای ویدیو پروژکتور
- ✅ **Text-to-Speech**: 
  - خواندن خودکار آیات
  - Highlight کردن کلمه به کلمه
  - صداهای طبیعی Google Cloud
- ✅ **Navigation**: 
  - دکمه‌های فصل قبل/بعد
  - انتخاب کتاب از dropdown
  - جستجوی آیات
- ✅ **Keyboard Shortcuts**:
  - `M`: تغییر Mode
  - `L`: تغییر Language
  - `P`: Presentation Mode
  - `Space`: Play/Pause
  - `←→`: Navigation
  - `F11`: Fullscreen
- ✅ **Responsive Design**: موبایل تا Desktop
- ✅ **منوی شناور**: در همه حالت‌ها قابل دسترسی

#### فایل‌های مرتبط:
- `pages/BibleViewer.tsx` - صفحه اصلی
- `components/BibleToolbar.tsx` - Toolbar
- `components/BibleSimple.tsx` - Simple mode
- `components/BibleFlipbookUnified.tsx` - Flipbook mode
- `hooks/useBibleMode.ts` - State management
- `hooks/useTTS.ts` - Text-to-Speech
- `backend/routes/bibleUnified.js` - API endpoints

#### API Endpoints:
```typescript
GET /api/bible-unified/books
// Response: { success: true, books: [...], totalBooks: 66 }

GET /api/bible-unified/chapter/:book/:chapter
// Response: { success: true, book: {...}, chapterNumber: 1, verses: [...] }

POST /api/bible-unified/tts
// Body: { text: "...", language: "en" | "fa" }
// Response: { success: true, audioUrl: "...", timings: [...] }
```

---

## 🐛 مشکلات و راه‌حل‌ها

### مشکل 1: Backend Crash در Windows

**علت**: Supabase connection pooler با Windows سازگاری ندارد

**علائم**:
```
severity: 'FATAL'
code: 'XX000'
Connection timeout: 2000ms
```

**راه‌حل موقت**: 
```typescript
// BibleViewer.tsx - استفاده از Mock Data
const fetchBooks = async () => {
  const mockBooks = [
    { code: 'GEN', number: 1, testament: 'OT', 
      names: { en: 'Genesis', fa: 'پیدایش' }, 
      chapterCount: 50 },
    // ...
  ];
  setBooks(mockBooks);
};
```

**راه‌حل دائمی** (To-Do):
- استفاده از Direct Connection به جای Pooler
- تست در Linux environment
- استفاده از Docker container

### مشکل 2: TypeScript Errors

**راه‌حل**:
```powershell
# حذف cache و rebuild
rm -r node_modules
rm package-lock.json
npm install
npm run build
```

### مشکل 3: Vite Proxy نمی‌تواند به Backend متصل شود

**راه‌حل**:
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

---

## 📝 دستورات مهم

### Git Commands

```powershell
# وضعیت فعلی
git status

# اضافه کردن تغییرات
git add .

# Commit با پیام
git commit -m "توضیحات تغییرات"

# Push به GitHub
git push origin main

# Pull از GitHub
git pull origin main

# مشاهده تاریخچه
git log --oneline

# ساخت Branch جدید
git checkout -b feature/new-feature

# برگشت به main
git checkout main
```

### NPM Commands

```powershell
# نصب یک package جدید
npm install package-name

# نصب به صورت dev dependency
npm install -D package-name

# حذف package
npm uninstall package-name

# بررسی outdated packages
npm outdated

# بروزرسانی packages
npm update

# پاک کردن cache
npm cache clean --force
```

### Development Commands

```powershell
# Frontend Dev Server
npm run dev

# Backend Server
cd backend
node server.js

# Build برای Production
npm run build

# Preview Production Build
npm run preview

# TypeScript Type Check
npm run type-check

# Lint کردن کدها
npm run lint
```

### Database Commands

```powershell
# اتصال به Supabase
psql postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Backup گرفتن
pg_dump -h db.[PROJECT].supabase.co -U postgres -d postgres > backup.sql

# Restore کردن
psql -h db.[PROJECT].supabase.co -U postgres -d postgres < backup.sql
```

---

## 📋 To-Do List

### ⚡ اولویت بالا

- [ ] **Fix Backend Connection Issue**
  - تست Direct Connection به Supabase
  - پیاده‌سازی Retry Logic
  - Setup Docker Container

- [ ] **Complete TTS Integration**
  - Setup Google Cloud Service Account
  - Test Audio Generation
  - Cache Audio Files
  - Implement Verse Timing

- [ ] **Load Real Bible Data**
  - Import تمام 66 کتاب
  - Import ترجمه‌های فارسی (قدیم، مژده، تفسیری)
  - Verify Data Integrity

### 🔄 در حال انجام

- [x] Bible Viewer UI - Simple Mode ✅
- [x] Bible Viewer UI - Flipbook Mode ✅
- [x] Presentation Mode ✅
- [x] Floating Control Menu ✅
- [x] Keyboard Shortcuts ✅
- [ ] TTS with Word Highlighting (50%)
- [ ] Search Functionality (0%)

### 📦 آینده

- [ ] User Authentication
- [ ] Bookmarks & Notes
- [ ] Study Tools
- [ ] Multiple Bible Translations
- [ ] Verse Comparison
- [ ] Reading Plans
- [ ] Social Sharing
- [ ] Mobile App (React Native)
- [ ] Offline Mode (PWA)

---

## 💡 یادداشت‌های مهم

### موارد حیاتی که نباید فراموش شوند:

1. **هرگز `.env` را commit نکنید!**
   ```gitignore
   # .gitignore
   .env
   .env.local
   .env.production
   backend/.env
   ```

2. **قبل از Push همیشه Test کنید:**
   ```powershell
   npm run build  # باید بدون Error تمام شود
   npm run preview  # تست Production Build
   ```

3. **Environment Variables در Render:**
   - همیشه از Dashboard تنظیم کنید
   - هرگز در کد Hard-code نکنید

4. **Database Backup:**
   - هفتگی Backup بگیرید
   - قبل از Migration حتماً Backup

5. **Performance:**
   - Images را Optimize کنید
   - Lazy Loading استفاده کنید
   - Code Splitting برای Routes

### Best Practices:

```typescript
// ✅ خوب: استفاده از Environment Variables
const apiUrl = import.meta.env.VITE_API_URL;

// ❌ بد: Hard-coded URLs
const apiUrl = "https://mychurch.com/api";

// ✅ خوب: Error Handling
try {
  const response = await fetch('/api/data');
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
} catch (error) {
  console.error('Error:', error);
  showErrorMessage(error.message);
}

// ❌ بد: بدون Error Handling
const data = await fetch('/api/data').then(r => r.json());
```

---

## 📞 اطلاعات تماس و لینک‌ها

### Repository
- **GitHub**: https://github.com/helpsystem/Mychurch
- **Branch**: main

### Production
- **Frontend**: https://mychurch-frontend.onrender.com
- **Backend**: https://mychurch-backend.onrender.com

### Services
- **Supabase Dashboard**: https://app.supabase.com
- **Render Dashboard**: https://dashboard.render.com
- **Google Cloud Console**: https://console.cloud.google.com

### Documentation
- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org
- **Vite**: https://vitejs.dev
- **TailwindCSS**: https://tailwindcss.com
- **Supabase**: https://supabase.com/docs

---

## 📅 تاریخچه نسخه‌ها

### v1.0.0 - اکتبر 2025
- ✅ پیاده‌سازی Bible Unified Viewer
- ✅ Simple Mode + Flipbook Mode
- ✅ Presentation Mode
- ✅ Bilingual Support (FA/EN)
- ✅ Floating Control Menu
- ✅ Keyboard Shortcuts
- ✅ Responsive Design

### v0.9.0 - سپتامبر 2025
- Initial Setup
- Basic Structure
- Database Design

---

## 🎓 آموزش‌ها

### چگونه یک Feature جدید اضافه کنیم؟

#### 1️⃣ ساخت Branch جدید
```powershell
git checkout -b feature/new-feature-name
```

#### 2️⃣ توسعه Feature
```powershell
# ساخت Component جدید
# pages/NewFeature.tsx

# ساخت API Route
# backend/routes/newFeature.js

# ساخت Custom Hook (اگر نیاز باشد)
# hooks/useNewFeature.ts
```

#### 3️⃣ Test کردن
```powershell
npm run dev  # Test در Local
npm run build  # بررسی Build Errors
```

#### 4️⃣ Commit & Push
```powershell
git add .
git commit -m "Add new feature: description"
git push origin feature/new-feature-name
```

#### 5️⃣ Create Pull Request
- به GitHub برو
- Pull Request بساز
- Review و Merge

---

**📝 این Document باید همیشه به‌روز نگه داشته شود!**

**آخرین بروزرسانی**: اکتبر 23, 2025
