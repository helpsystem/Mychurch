# 🚀 Bible System - Quick Start Guide

## Iranian Christian Church DC Website

---

## ⚡ Quick Commands

```bash
# Start Backend (Required!)
npm run backend

# Start Frontend
npm run dev

# Both at once
npm run dev:full
```

---

## 📍 Access Links

Once servers are running:

### Main Navigation
- **Bible Hub**: http://localhost:5173/#/bible

### Audio Bible
- **Audio Player**: http://localhost:5173/#/bible/audio
- Direct API test: http://localhost:3001/api/wordproject-audio/books

### Interactive Reader
- **Bilingual Reader**: http://localhost:5173/#/bible/reader
- **Presentation Mode**: http://localhost:5173/#/bible-presentation

---

## 🎯 What's New

### ✅ Implemented Today

1. **WordProject Audio API** (`backend/routes/wordprojectAudioRoutes.js`)
   - Serves audio from local D:\ drive
   - English & Persian for all 66 books
   - Streaming + Download support

2. **AudioBible Component** (`components/AudioBible.tsx`)
   - Dual-language audio players
   - Book/chapter navigation
   - Search and filters
   - Download buttons

3. **Enhanced Routes** (`App.tsx`)
   - `/bible` - Main hub with navigation cards
   - `/bible/audio` - Audio Bible player
   - `/bible/reader` - Interactive bilingual reader

4. **Updated BiblePage** (`pages/BiblePage.tsx`)
   - Beautiful gradient cards linking to sub-sections
   - Quick access to Audio and Reader modes

---

## 📋 Features Checklist

### Audio Bible
- ✅ 66 Books (OT + NT)
- ✅ English Audio (from WordProject)
- ✅ Persian Audio (from WordProject)  
- ✅ Chapter-by-chapter playback
- ✅ Play/Pause/Seek controls
- ✅ Next/Previous chapter navigation
- ✅ Download audio files
- ✅ Search books by name
- ✅ Filter by testament (OT/NT/All)
- ✅ Responsive design (mobile/tablet/desktop)

### Interactive Reader
- ✅ Dual-column layout (EN + FA)
- ✅ Multiple translations (Mojdeh, Qadim, Tafsiri, English)
- ✅ Reading mode (personal study)
- ✅ Presentation mode (projector display)
- ✅ Audio integration (TTS + pre-recorded)
- ✅ Verse highlighting
- ✅ Keyboard controls
- ✅ Font size adjustment
- ✅ Full-screen mode
- ✅ Flipbook animations

---

## 🧪 Testing Checklist

### 1. Backend API Test

```bash
# Test 1: Get all books
curl http://localhost:3001/api/wordproject-audio/books

# Test 2: Get Genesis chapters
curl http://localhost:3001/api/wordproject-audio/book/GEN

# Test 3: Play Genesis 1 (English)
# Open in browser:
http://localhost:3001/api/wordproject-audio/play/GEN/1/en
```

### 2. Frontend Audio Bible Test

1. Navigate to http://localhost:5173/#/bible/audio
2. Check if books list loads (should show 66 books)
3. Click on "Genesis" (first book)
4. Click on "Chapter 1"
5. Verify English audio plays
6. Verify Persian audio plays
7. Try "Next Chapter" button
8. Try "Download" button

### 3. Frontend Interactive Reader Test

1. Navigate to http://localhost:5173/#/bible/reader
2. Select "Ephesians" from book dropdown
3. Select "Chapter 1"
4. Verify English text appears on left
5. Verify Persian text appears on right
6. Click "Presentation Mode" button
7. Press Space to play audio
8. Press Arrow keys to navigate verses
9. Press ESC to exit presentation

---

## 🐛 Common Issues & Fixes

### Issue 1: "Audio files not found" (404 error)

**Cause**: Audio files not in expected location

**Fix**:
```powershell
# Check if files exist
Test-Path "D:\https___www.wordproject.org_bibles_audio_01_english_index.htm\www.wordproject.org\bibles\audio\20_farsi"

# If False, update paths in:
backend/routes/wordprojectAudioRoutes.js
Lines 11-12: ENGLISH_AUDIO_BASE and PERSIAN_AUDIO_BASE
```

### Issue 2: "Backend not responding"

**Cause**: Backend server not running

**Fix**:
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# If error, start backend:
npm run backend
```

### Issue 3: "Verses not loading in Reader"

**Cause**: Database connection issue

**Fix**:
1. Check `.env` file has correct Supabase credentials
2. Verify `SUPABASE_URL` and `SUPABASE_KEY`
3. Check backend console for SQL errors
4. Test database connection:
```bash
node -e "require('./backend/db-postgres.js').testConnection()"
```

### Issue 4: "CORS errors in browser console"

**Cause**: Frontend and backend ports mismatch

**Fix**:
```javascript
// backend/server.js
// Ensure localhost:5173 is in allowedOrigins array (line ~95)
const allowedOrigins = [
  'http://localhost:5173', // ← Must be here
  'http://localhost:3001',
];
```

---

## 📱 User Guide (Church Staff)

### For Worship Leaders

**Playing Audio Bible During Service:**
1. Navigate to **Bible** → **Audio Bible**
2. Select the book and chapter for today's sermon
3. Click chapter number to auto-play
4. Use English or Persian player (or both!)
5. Connect computer to church sound system

**Presenting Verses on Screen:**
1. Navigate to **Bible** → **Interactive Bible**
2. Select translation (Mojdeh recommended for Persian)
3. Choose book and chapter
4. Click **Presentation Mode** button
5. Connect computer to projector
6. Use keyboard:
   - **→** Next verse
   - **←** Previous verse
   - **Space** Play/Pause audio
   - **ESC** Exit full-screen

### For Bible Study Leaders

**Reading with Group:**
1. Navigate to **Bible** → **Interactive Bible**
2. Select passage
3. Use dual-column view to show both languages
4. Scroll through verses together
5. Click verse numbers to highlight specific verses
6. Use audio for read-along

**Downloading Audio for Offline:**
1. Navigate to **Bible** → **Audio Bible**
2. Select book and chapter
3. Click **Download** icon on English or Persian player
4. File saves to your Downloads folder
5. Use for offline listening or sharing

---

## 🎨 Customization Guide

### Change Colors

**Audio Bible** (components/AudioBible.tsx):
```tsx
// Line 234: English player gradient
className="bg-gradient-to-br from-blue-500 to-blue-600"
// Change to: from-green-500 to-green-600

// Line 285: Persian player gradient  
className="bg-gradient-to-br from-purple-500 to-purple-600"
// Change to: from-red-500 to-red-600
```

**Navigation Cards** (pages/BiblePage.tsx):
```tsx
// Line 380: Audio Bible card
className="bg-gradient-to-br from-blue-500 to-blue-600"

// Line 406: Interactive Reader card
className="bg-gradient-to-br from-purple-500 to-purple-600"
```

### Change Fonts

**Persian Text**:
```css
/* App.tsx, line 115 */
<div className="font-vazir"> /* Change to font-b-nazanin or font-iranian-sans */
```

**English Text**:
```css
/* App.tsx, line 115 */
<div className="font-poppins"> /* Change to font-roboto or font-open-sans */
```

### Add New Translation

1. **Database**: Add column to `bible_verses` table
```sql
ALTER TABLE bible_verses ADD COLUMN text_spanish TEXT;
```

2. **Backend**: Update API to return new translation
```javascript
// backend/routes/bible.js
verses: {
  en: [...],
  fa: [...],
  es: [...]  // ← Add Spanish
}
```

3. **Frontend**: Update translation dropdown
```tsx
// pages/BilingualBibleReader.tsx
const TRANSLATIONS = [
  { id: 'mojdeh', name_fa: 'مژده', name_en: 'Mojdeh' },
  { id: 'spanish', name_fa: 'اسپانیایی', name_en: 'Spanish' },  // ← Add
];
```

---

## 📊 Performance Tips

### Optimize Audio Loading

**Current**: Loads audio on demand (streaming)
**Optimization**: Preload next chapter while current is playing

```tsx
// In AudioBible.tsx playChapter function:
useEffect(() => {
  if (selectedChapter < selectedBook.chapters) {
    const nextChapter = selectedChapter + 1;
    const nextAudio = chapters.find(ch => ch.chapter === nextChapter);
    
    // Preload next chapter audio
    const preloadEn = new Audio(nextAudio.audioUrl_en);
    const preloadFa = new Audio(nextAudio.audioUrl_fa);
    preloadEn.preload = 'auto';
    preloadFa.preload = 'auto';
  }
}, [selectedChapter]);
```

### Cache Bible Content

**Current**: Fetches from API each time
**Optimization**: Cache in localStorage

```tsx
// In BilingualBibleReader.tsx:
const CACHE_KEY = `bible_${bookCode}_${chapter}`;

// Save to cache
localStorage.setItem(CACHE_KEY, JSON.stringify(verses));

// Load from cache first
const cached = localStorage.getItem(CACHE_KEY);
if (cached) {
  setContent(JSON.parse(cached));
}
```

---

## 🔒 Security Notes

### Audio File Access

Audio files are served through backend API, not directly from D:\ drive. This prevents:
- Direct file system access
- Unauthorized downloads
- Path traversal attacks

### Database Queries

All database queries use parameterized statements to prevent SQL injection:
```javascript
// Safe ✅
pool.query('SELECT * FROM bible_verses WHERE book_code = $1', [bookCode]);

// Unsafe ❌
pool.query(`SELECT * FROM bible_verses WHERE book_code = '${bookCode}'`);
```

### API Rate Limiting (Future)

Consider adding rate limiting for production:
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', apiLimiter);
```

---

## 📞 Support

**Technical Issues:**
- Email: help.system@ymail.com
- GitHub: https://github.com/helpsystem/Mychurch/issues

**Church Admin:**
- Email: admin@iranianchurchdc.org

**Emergency Contact:**
- Phone: [Church Office Number]

---

## 📚 Additional Resources

- **Full Documentation**: `BIBLE_SYSTEM_GUIDE.md`
- **API Reference**: `BIBLE_SYSTEM_GUIDE.md` → Backend API Endpoints section
- **Site Architecture**: `SITE_ARCHITECTURE.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`

---

**Quick Tip**: Bookmark this page for easy reference!

**Last Updated**: November 2, 2025  
**Version**: 2.0
