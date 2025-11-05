# 📖 Audio Bible & Interactive Bilingual Bible System
## Iranian Christian Church DC - Complete Bible Integration Guide

---

## 🎯 Overview

This system provides a **complete Bible experience** for the Iranian Christian Church DC website with two main components:

1. **🎧 Audio Bible** - Listen to all 66 books in English and Persian
2. **📖 Interactive Bilingual Bible** - Read in dual-column layout with presentation mode

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     BiblePage.tsx                         │
│         (Main Bible section with navigation)              │
└───────────────────┬───────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌──────────────────────┐
│  Audio Bible    │    │  Interactive Reader   │
│  (AudioBible)   │    │  (BilingualBibleReader)│
└─────────────────┘    └──────────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌──────────────────────┐
│  Wordproject    │    │   Supabase DB API     │
│  Audio API      │    │   Bible Content API   │
└─────────────────┘    └──────────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌──────────────────────┐
│  D:\ Local      │    │   PostgreSQL Table    │
│  Audio Files    │    │   bible_verses        │
│  (EN + FA)      │    │   (Multilingual)      │
└─────────────────┘    └──────────────────────┘
```

---

## 📂 File Structure

```
Mychurch/
├── pages/
│   ├── BiblePage.tsx                    # Main Bible hub with navigation cards
│   ├── AudioBiblePage.tsx               # Wrapper for AudioBible component
│   └── BilingualBibleReader.tsx         # Interactive reader (already exists)
│
├── components/
│   ├── AudioBible.tsx                   # NEW: Full audio player component
│   └── BilingualBiblePresentation.tsx   # Existing presentation component
│
├── backend/
│   ├── server.js                        # Register wordproject-audio route
│   └── routes/
│       ├── wordprojectAudioRoutes.js    # NEW: Audio file serving API
│       ├── bible.js                     # Existing Bible content API
│       └── bibleRoutes.js               # Existing Bible routes
│
└── App.tsx                              # Routes: /bible, /bible/audio, /bible/reader
```

---

## 🎧 Audio Bible Component

### Features

- ✅ **66 Books**: Complete Old and New Testament
- ✅ **Dual Audio**: English and Persian side-by-side players
- ✅ **Chapter Navigation**: Grid-based chapter selector
- ✅ **Search**: Find books by name (English or Persian)
- ✅ **Testament Filter**: OT / NT / All
- ✅ **Audio Controls**: Play, pause, progress bar, next/previous chapter
- ✅ **Download**: Save audio files locally
- ✅ **Responsive**: Mobile, tablet, and desktop optimized

### Routes

- **Main Page**: `http://localhost:5173/#/bible/audio`
- **From Bible Hub**: Click "Audio Bible" card on `/bible`

### Backend API Endpoints

**Base URL**: `/api/wordproject-audio`

#### 1. Get All Books
```http
GET /api/wordproject-audio/books
```

**Response:**
```json
{
  "success": true,
  "count": 66,
  "books": [
    {
      "code": "GEN",
      "name_en": "Genesis",
      "name_fa": "پیدایش",
      "chapters": 50,
      "hasEnglishAudio": true,
      "hasPersianAudio": true
    },
    ...
  ]
}
```

#### 2. Get Book Chapters
```http
GET /api/wordproject-audio/book/:bookCode
```

**Example**: `/api/wordproject-audio/book/GEN`

**Response:**
```json
{
  "success": true,
  "book": {
    "code": "GEN",
    "name_en": "Genesis",
    "name_fa": "پیدایش",
    "chapters": [
      {
        "chapter": 1,
        "audioUrl_en": "/api/wordproject-audio/play/GEN/1/en",
        "audioUrl_fa": "/api/wordproject-audio/play/GEN/1/fa",
        "downloadUrl_en": "/api/wordproject-audio/download/GEN/1/en",
        "downloadUrl_fa": "/api/wordproject-audio/download/GEN/1/fa"
      },
      ...
    ]
  }
}
```

#### 3. Play Audio (Stream)
```http
GET /api/wordproject-audio/play/:bookCode/:chapter/:lang
```

**Example**: `/api/wordproject-audio/play/GEN/1/en`

- Streams MP3 file from local D:\ drive
- Sets `Content-Type: audio/mpeg`
- Supports range requests for seeking

#### 4. Download Audio
```http
GET /api/wordproject-audio/download/:bookCode/:chapter/:lang
```

**Example**: `/api/wordproject-audio/download/GEN/1/fa`

- Downloads audio file with proper filename
- Sets `Content-Disposition: attachment`

#### 5. Search Books
```http
GET /api/wordproject-audio/search?q=genesis
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "query": "genesis",
  "results": [
    {
      "code": "GEN",
      "name_en": "Genesis",
      "name_fa": "پیدایش",
      "chapters": 50
    }
  ]
}
```

### Audio File Locations

The backend serves audio from:

**English Audio**:
```
D:\https___www.wordproject.org_bibles_audio_01_english_index.htm\www.wordproject.org\bibles\audio\01_english\
```

**Persian Audio**:
```
D:\https___www.wordproject.org_bibles_audio_01_english_index.htm\www.wordproject.org\bibles\audio\20_farsi\
```

### File Naming Patterns

The API searches for files with these patterns:
- `b01_001.mp3` (standard)
- `b01_01.mp3` (alternate)
- `b01_1.mp3` (short)
- `01_001.mp3` (no prefix)

Book codes: `b01` (Genesis), `b02` (Exodus), ..., `b66` (Revelation)

---

## 📖 Interactive Bilingual Bible

### Features

- ✅ **Dual-Column Layout**: English (LTR) + Persian (RTL)
- ✅ **Multiple Translations**: Mojdeh, Qadim, Tafsiri, English NMV
- ✅ **Reading Mode**: Personal study with verse navigation
- ✅ **Presentation Mode**: Full-screen projector-friendly display
- ✅ **Audio Integration**: TTS or pre-recorded chapter audio
- ✅ **Verse Highlighting**: Synchronized with audio playback
- ✅ **Keyboard Controls**: Arrow keys, space, page up/down
- ✅ **Font Size Control**: Adjust text size for readability
- ✅ **Flipbook Animation**: Page-turning effects (Framer Motion)

### Routes

- **Main Page**: `http://localhost:5173/#/bible/reader`
- **Alternate**: `http://localhost:5173/#/bible-reader`
- **Presentation Sample**: `http://localhost:5173/#/bible-presentation-sample`
- **Presentation Dynamic**: `http://localhost:5173/#/bible-presentation`

### Backend API Endpoints

**Base URL**: `/api/bible`

#### 1. Get Books List
```http
GET /api/bible/books
```

#### 2. Get Book Info
```http
GET /api/bible/book/:code
```

#### 3. Get Chapter Content (Bilingual)
```http
GET /api/bible/content/:bookCode/:chapter
```

**Example**: `/api/bible/content/EPH/1`

**Response:**
```json
{
  "success": true,
  "bookCode": "EPH",
  "chapter": 1,
  "verses": {
    "en": [
      "Paul, an apostle of Christ Jesus...",
      "To the saints in Ephesus...",
      ...
    ],
    "fa": [
      "پولس، رسول عیسی مسیح...",
      "به مقدّسین در افسس...",
      ...
    ]
  }
}
```

#### 4. Get Specific Verse
```http
GET /api/bible/verse/:bookCode/:chapter/:verse
```

**Example**: `/api/bible/verse/EPH/1/15`

### Database Structure (Supabase)

**Table**: `bible_verses`

```sql
CREATE TABLE bible_verses (
    id SERIAL PRIMARY KEY,
    book_code VARCHAR(10) NOT NULL,
    book_name_en VARCHAR(100),
    book_name_fa VARCHAR(100),
    chapter INT NOT NULL,
    verse INT NOT NULL,
    text_mojdeh TEXT,          -- Persian Mojdeh translation
    text_qadim TEXT,            -- Persian Qadim translation
    text_tafsiri_ot TEXT,       -- Persian Tafsiri (OT)
    text_tafsiri_nt TEXT,       -- Persian Tafsiri (NT)
    text_english TEXT,          -- English NMV
    audio_mojdeh_url TEXT,      -- Audio file URL (Mojdeh)
    audio_english_url TEXT,     -- Audio file URL (English)
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bible_book_chapter ON bible_verses(book_code, chapter);
CREATE INDEX idx_bible_verse ON bible_verses(book_code, chapter, verse);
```

**Sample Query**:
```sql
SELECT verse, text_english, text_mojdeh 
FROM bible_verses 
WHERE book_code = 'EPH' 
  AND chapter = 1 
ORDER BY verse;
```

---

## 🚀 How to Use

### For Developers

#### 1. Start Backend Server
```bash
npm run backend
# or
node backend/server.js
```

#### 2. Start Frontend
```bash
npm run dev
```

#### 3. Access Bible System
- **Main Hub**: http://localhost:5173/#/bible
- **Audio Bible**: http://localhost:5173/#/bible/audio
- **Interactive Reader**: http://localhost:5173/#/bible/reader

### For Church Staff

#### Audio Bible Usage
1. Navigate to **Bible** → **Audio Bible**
2. Select testament filter (OT/NT/All)
3. Search or browse to find a book
4. Click chapter number to play
5. Use English and Persian players independently or together
6. Download audio files for offline listening

#### Interactive Reader Usage
1. Navigate to **Bible** → **Interactive Bible**
2. Select translation (Mojdeh, Qadim, Tafsiri, English)
3. Choose book and chapter from dropdowns
4. **Reading Mode**: Scroll through verses, click audio to read along
5. **Presentation Mode**: Click "Presentation" button for full-screen display
   - Use keyboard arrows to navigate verses
   - Space to play/pause audio
   - ESC to exit full-screen

---

## 🎨 Styling & Customization

### TailwindCSS Classes Used

**Audio Bible**:
- Gradient backgrounds: `from-blue-500 to-blue-600`, `from-purple-500 to-purple-600`
- Rounded corners: `rounded-xl`, `rounded-lg`
- Shadow effects: `shadow-lg`, `shadow-2xl`
- Hover animations: `hover:scale-105`, `transition-all`
- Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

**Interactive Reader**:
- Dual columns: `grid-cols-1 lg:grid-cols-2`
- Direction control: `dir="ltr"` and `dir="rtl"`
- Font families: `font-poppins` (English), `font-vazir` (Persian)
- Full-screen mode: `fixed inset-0 z-50 bg-black`

### Color Scheme

| Component | Primary | Secondary | Accent |
|-----------|---------|-----------|--------|
| Audio Bible | Blue `#3B82F6` | Purple `#8B5CF6` | White |
| Interactive Reader | Green `#10B981` | Blue `#3B82F6` | Gold |

---

## 📊 Data Format Examples

### BiblePayload (for Presentation Component)

```typescript
interface Verse {
  verseNumber: number;
  text_en: string;
  text_fa: string;
  audio_en?: string;
  audio_fa?: string;
}

interface Chapter {
  chapterNumber: number;
  verses: Verse[];
}

interface BiblePayload {
  book_en: string;
  book_fa: string;
  translation_name?: {
    en: string;
    fa: string;
  };
  chapters: Chapter[];
}
```

**Example**:
```json
{
  "book_en": "Ephesians",
  "book_fa": "افسسیان",
  "translation_name": {
    "en": "Mojdeh",
    "fa": "مژده"
  },
  "chapters": [
    {
      "chapterNumber": 1,
      "verses": [
        {
          "verseNumber": 1,
          "text_en": "Paul, an apostle of Christ Jesus by the will of God...",
          "text_fa": "پولس، رسول عیسی مسیح به اراده خدا...",
          "audio_en": "/audio/EPH_1_1.mp3",
          "audio_fa": "/audio/EPH_1_1_fa.mp3"
        },
        ...
      ]
    }
  ]
}
```

---

## 🔌 Supabase Integration (Optional)

### Setup Steps

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Note your project URL and API key

2. **Run SQL Schema**
   ```sql
   -- See Database Structure section above
   ```

3. **Configure Environment Variables**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ```

4. **Update Backend Connection**
   ```javascript
   // backend/db-postgres.js
   const { createClient } = require('@supabase/supabase-js');
   
   const supabase = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_SERVICE_KEY
   );
   ```

5. **Import Bible Data**
   - Use provided SQL dump or CSV files
   - Import via Supabase Dashboard → Table Editor

---

## 🐛 Troubleshooting

### Audio Not Playing

**Problem**: Audio files return 404 error

**Solutions**:
1. Check if audio files exist in D:\ drive
2. Verify file naming matches patterns (b01_001.mp3)
3. Check backend logs for file path errors
4. Ensure backend server is running

**Test Command**:
```powershell
Test-Path "D:\https___www.wordproject.org_bibles_audio_01_english_index.htm\www.wordproject.org\bibles\audio\20_farsi\b01_001.mp3"
```

### API Returns Empty Data

**Problem**: `/api/bible/content/GEN/1` returns empty verses

**Solutions**:
1. Check if Supabase connection is working
2. Verify `bible_verses` table has data
3. Check database credentials in `.env`
4. Look at backend console for SQL errors

### Presentation Mode Not Loading

**Problem**: Clicking presentation button does nothing

**Solutions**:
1. Check browser console for errors
2. Ensure BilingualBiblePresentation component is imported
3. Verify data format matches BiblePayload interface
4. Check if Framer Motion is installed (`npm install framer-motion`)

---

## 📈 Future Enhancements

### Planned Features

1. **Verse Bookmarks**: Save favorite verses
2. **Study Notes**: Add personal annotations
3. **Verse Sharing**: Share verses on social media
4. **Offline Mode**: Progressive Web App (PWA)
5. **Mobile App**: React Native version
6. **Multi-Language**: Add Spanish, Arabic, Chinese
7. **Audio Timing Sync**: Word-by-word karaoke-style highlighting
8. **AI Bible Chat**: Ask questions about verses (already implemented)

### API Expansions

1. **Verse of the Day**: `/api/bible/daily-verse`
2. **Search by Keywords**: `/api/bible/search?q=love`
3. **Cross-References**: `/api/bible/cross-refs/:bookCode/:chapter/:verse`
4. **Commentary**: `/api/bible/commentary/:bookCode/:chapter/:verse`
5. **Parallel Translations**: `/api/bible/parallel/:bookCode/:chapter/:verse`

---

## 📝 Code Examples

### Using AudioBible Component

```tsx
import AudioBible from '@/components/AudioBible';

function MyPage() {
  return (
    <div>
      <AudioBible />
    </div>
  );
}
```

### Using BilingualBiblePresentation

```tsx
import BilingualBiblePresentation from '@/components/BilingualBiblePresentation';

const sampleData = {
  book_en: "Ephesians",
  book_fa: "افسسیان",
  translation_name: { en: "Mojdeh", fa: "مژده" },
  chapters: [
    {
      chapterNumber: 1,
      verses: [
        {
          verseNumber: 1,
          text_en: "Paul, an apostle...",
          text_fa: "پولس، رسول...",
        }
      ]
    }
  ]
};

function PresentationPage() {
  return <BilingualBiblePresentation data={sampleData} />;
}
```

### Fetching Bible Data from API

```typescript
import axios from 'axios';

async function loadChapter(bookCode: string, chapter: number) {
  try {
    const response = await axios.get(`/api/bible/content/${bookCode}/${chapter}`);
    
    if (response.data.success) {
      const verses = response.data.verses;
      console.log('English verses:', verses.en);
      console.log('Persian verses:', verses.fa);
      return verses;
    }
  } catch (error) {
    console.error('Failed to load chapter:', error);
  }
}

// Usage
loadChapter('EPH', 1);
```

---

## 🎓 Learning Resources

### React + TypeScript
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### TailwindCSS
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Tailwind Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)

### Express.js API
- [Express Guide](https://expressjs.com/en/guide/routing.html)
- [RESTful API Design](https://restfulapi.net/)

### Supabase
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)

---

## 🤝 Contributing

### Adding New Translations

1. Update database schema to add new column
2. Import translation data
3. Update `BilingualBibleReader.tsx` translations array
4. Add UI dropdown option

### Adding New Features

1. Create feature branch: `git checkout -b feature/my-feature`
2. Implement feature
3. Test thoroughly
4. Create pull request
5. Get approval from SUPER_ADMIN

---

## 📞 Support

For technical support, contact:
- **Developer**: help.system@ymail.com
- **Church Admin**: admin@iranianchurchdc.org
- **GitHub Issues**: https://github.com/helpsystem/Mychurch/issues

---

## 📜 License

This project is for the exclusive use of **Iranian Christian Church of Washington D.C.**

All audio files are sourced from [WordProject.org](https://www.wordproject.org) and are used with permission for church purposes.

---

**Last Updated**: November 2, 2025  
**Version**: 2.0  
**Author**: AI Coding Agent with help.system@ymail.com
