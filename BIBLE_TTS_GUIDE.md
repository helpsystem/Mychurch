# Bible TTS Reader System - Complete Guide

## 📚 Overview

This is a comprehensive Bible reader system with Text-to-Speech (TTS) capabilities, featuring:

- ✅ **Word-by-word highlighting** synchronized with audio playback
- ✅ **Bilingual display** (English/Persian/Arabic)
- ✅ **Admin upload interface** for importing Bible translations
- ✅ **Automatic file parsing** (HTML, JSON, XML, TXT formats)
- ✅ **Database schema** with multi-language support
- ✅ **Play/Pause/Skip controls** with voice selection
- ✅ **Auto-scroll** to keep current word visible
- ✅ **Speed control** and volume adjustment

---

## 🏗️ Architecture

### Database Schema (`scripts/bible-schema.sql`)

**Tables:**
1. `bible_translations` - Supported Bible translations
2. `bible_books` - All 66 Bible books with metadata
3. `bible_chapters` - Chapter information per book
4. `bible_verses` - Verse text in multiple languages (text_en, text_fa, text_ar)
5. `bible_word_timestamps` - Word-level timing data for TTS synchronization

**Key Features:**
- Multi-language support in single row (text_en, text_fa, text_ar)
- JSONB fields for word-level timing data
- Full-text search indexes for both English and Persian
- Automatic timestamp tracking

### Import Script (`scripts/bible-import-from-directory.js`)

**Capabilities:**
- Scans directory recursively for Bible files
- Supports multiple formats:
  - **HTML**: Parses `data-chapter` and `data-verse` attributes
  - **JSON**: Handles array or object-based structures
  - **XML**: Extracts verses from XML tags
  - **TXT**: Intelligent parsing with chapter/verse detection
- Auto-detects language (English/Persian) using Unicode ranges
- Extracts book names from filenames
- Imports to database with transaction support

**Usage:**
```bash
node scripts/bible-import-from-directory.js --source "D:\path\to\bible\files"
```

### TTS Reader Component (`components/TTSBibleReader.tsx`)

**Features:**
- **Web Speech API** integration for TTS
- **Word-by-word highlighting** with automatic word boundary detection
- **Smooth auto-scroll** to keep current word in view
- **Bilingual display** with separate columns for each language
- **Audio controls**:
  - Play/Pause
  - Previous/Next verse
  - Volume control
  - Speed adjustment (0.5x - 2.0x)
  - Voice selection (filtered by language)
- **Visual feedback**:
  - Current verse highlighted with blue border
  - Active word highlighted with yellow background
  - Progress bar showing completion percentage

**Props:**
```typescript
interface TTSBibleReaderProps {
  bookCode: string;           // e.g., "GEN", "MAT"
  chapterNumber: number;       // Chapter to read
  verses: Verse[];            // Array of verses
  language?: 'en' | 'fa';     // Primary language (default: 'en')
  showBilingual?: boolean;     // Show both languages (default: true)
}
```

### Admin Upload Page (`pages/BibleAdminUpload.tsx`)

**Features:**
- **Drag & drop** file upload
- **Multi-file support** with batch import
- **Format auto-detection** or manual selection
- **Live parsing** with client-side validation
- **Import results** with success/error feedback
- **Format instructions** with examples

**Supported File Formats:**

1. **HTML:**
```html
<div class="verse" data-chapter="1" data-verse="1">
  In the beginning God created the heaven and the earth.
</div>
```

2. **JSON:**
```json
{
  "chapters": {
    "1": [
      "In the beginning God created...",
      "And the earth was without form..."
    ]
  }
}
```

3. **Plain Text:**
```
Chapter 1
1. In the beginning God created the heaven and the earth.
2. And the earth was without form, and void...
```

### Backend API (`backend/routes/bibleRoutes.js`)

**New Endpoint:**

**POST `/api/bible/import`**

Import Bible verses from admin interface.

**Request Body:**
```json
{
  "book": "Genesis",
  "language": "en",
  "verses": [
    {
      "chapter": 1,
      "verse": 1,
      "text": "In the beginning..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully imported 1533 verses",
  "data": {
    "book": "Genesis",
    "bookCode": "GEN",
    "language": "en",
    "versesImported": 1533,
    "chaptersImported": 50
  }
}
```

---

## 🚀 Quick Start

### 1. Database Setup

```bash
# Connect to your PostgreSQL database
psql -U your_username -d your_database

# Run the schema
\i scripts/bible-schema.sql
```

Or for Supabase:
1. Go to SQL Editor
2. Paste contents of `scripts/bible-schema.sql`
3. Run query

### 2. Copy Bible Files to Project

Since the script cannot access files outside the workspace, you have two options:

**Option A: Copy files into workspace**
```powershell
# Create directory in workspace
New-Item -ItemType Directory -Path "d:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\data\bible-source" -Force

# Copy Bible files
Copy-Item -Path "D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.bible.com\*" `
          -Destination "d:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\data\bible-source" `
          -Recurse
```

**Option B: Use Admin Upload Interface**
1. Start the development server
2. Navigate to `/bible/admin/upload`
3. Drag and drop Bible files
4. Click "Import to Database"

### 3. Import Bible Data (Option A)

```bash
# Run import script
node scripts/bible-import-from-directory.js --source "./data/bible-source"
```

### 4. Use TTS Reader Component

```tsx
import TTSBibleReader from '../components/TTSBibleReader';

function BiblePage() {
  const [verses, setVerses] = useState([]);

  useEffect(() => {
    // Fetch verses from API
    fetch('/api/bible/content/GEN/1')
      .then(res => res.json())
      .then(data => setVerses(data.verses));
  }, []);

  return (
    <TTSBibleReader
      bookCode="GEN"
      chapterNumber={1}
      verses={verses}
      language="en"
      showBilingual={true}
    />
  );
}
```

---

## 📖 Usage Examples

### Example 1: Standalone TTS Reader

```tsx
import { TTSBibleReader } from '../components/TTSBibleReader';

const verses = [
  {
    id: 1,
    verseNumber: 1,
    textEn: "In the beginning God created the heaven and the earth.",
    textFa: "در ابتدا خدا آسمان و زمین را آفرید."
  },
  {
    id: 2,
    verseNumber: 2,
    textEn: "And the earth was without form, and void...",
    textFa: "و زمین بی‌شکل و خالی بود..."
  }
];

<TTSBibleReader
  bookCode="GEN"
  chapterNumber={1}
  verses={verses}
  showBilingual={true}
/>
```

### Example 2: English-only Reader

```tsx
<TTSBibleReader
  bookCode="JHN"
  chapterNumber={3}
  verses={verses}
  language="en"
  showBilingual={false}
/>
```

### Example 3: Persian-only Reader

```tsx
<TTSBibleReader
  bookCode="MAT"
  chapterNumber={5}
  verses={verses}
  language="fa"
  showBilingual={false}
/>
```

---

## 🔧 Configuration

### Voice Selection

The TTS Reader automatically filters available voices by language. To use a specific voice:

1. Click the Settings icon
2. Select voice from dropdown
3. Voice preference is stored in component state

### Speed Control

Adjust playback speed from 0.5x to 2.0x:
- Drag the speed slider
- Value updates in real-time

### Volume Control

Adjust volume from 0 to 100%:
- Use volume slider in control bar
- Changes apply immediately

---

## 📱 Responsive Design

The TTS Reader is fully responsive:
- **Desktop**: Side-by-side bilingual columns
- **Tablet**: Stacked columns with smooth scrolling
- **Mobile**: Single column with language toggle

---

## 🎨 Styling

### CSS Classes

```css
/* Main container */
.tts-bible-reader { }

/* Verse container */
.verse-container { }
.verse-container.active { /* Current verse */ }

/* Highlighted word */
.verse-text span.active { 
  background: yellow;
  font-weight: bold;
}

/* Controls */
.controls { }
.playback-controls { }
.settings-controls { }
```

### Tailwind Classes Used

- `bg-blue-50` - Light blue background for current verse
- `border-blue-400` - Blue border for current verse
- `bg-yellow-300` - Yellow highlight for current word
- `scale-110` - Slight zoom for current word
- `transition-all` - Smooth transitions

---

## 🐛 Troubleshooting

### No Sound Playing

**Check:**
1. Browser supports Web Speech API (Chrome, Edge, Safari - Yes; Firefox - Limited)
2. Volume is not muted
3. Voices are loaded (`availableVoices.length > 0`)
4. Language-appropriate voice is selected

**Fix:**
```tsx
// Force reload voices
window.speechSynthesis.cancel();
window.speechSynthesis.getVoices();
```

### Word Highlighting Not Working

**Check:**
1. Text contains valid words (not just punctuation)
2. `onboundary` event is firing (check console)
3. Word refs are being created

**Fix:**
- Ensure `handleBoundary` callback is properly attached
- Check if `currentWordIndex` state is updating

### Import Fails

**Check:**
1. Database connection is active
2. Book exists in `bible_books` table
3. File format matches expected structure
4. File encoding is UTF-8

**Fix:**
```sql
-- Check if book exists
SELECT * FROM bible_books WHERE LOWER(name_en) = 'genesis';

-- If not, insert it
INSERT INTO bible_books (code, name_en, name_fa, testament, book_number, chapters_count)
VALUES ('GEN', 'Genesis', 'پیدایش', 'OT', 1, 50);
```

### Verses Not Displaying

**Check:**
1. API endpoint returns data
2. `verses` prop is array with required fields
3. No console errors

**Fix:**
```tsx
// Log verses in component
useEffect(() => {
  console.log('Verses received:', verses);
}, [verses]);
```

---

## 🔐 Security Considerations

### Admin Upload Protection

**Recommended:**
Add authentication to upload endpoint:

```javascript
// In backend/routes/bibleRoutes.js
const { authenticateAdmin } = require('../middleware/auth');

router.post('/import', authenticateAdmin, async (req, res) => {
  // ... import logic
});
```

### File Validation

The admin upload component validates:
- File type (HTML, JSON, XML, TXT only)
- File size (recommend max 10MB per file)
- Content structure (must have verses array)

### SQL Injection Prevention

All queries use parameterized statements:
```javascript
await client.query('INSERT INTO ... VALUES ($1, $2, $3)', [val1, val2, val3]);
```

---

## 📊 Performance Optimization

### Large Chapter Handling

For chapters with 100+ verses (e.g., Psalms 119):
- Verses are rendered lazily
- Only visible verses have active refs
- Auto-scroll is debounced

### Memory Management

- Speech synthesis utterances are cleaned up on unmount
- Event listeners are removed properly
- Refs are cleared when component unmounts

### Database Indexes

Schema includes indexes for:
- Full-text search (English & Persian)
- Book/Chapter/Verse lookups
- Language-specific queries

---

## 🌐 Browser Compatibility

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| TTS | ✅ | ✅ | ✅ | ⚠️ Limited |
| Word Boundaries | ✅ | ✅ | ✅ | ❌ |
| Persian Voices | ✅ | ✅ | ❌ | ❌ |
| Auto-scroll | ✅ | ✅ | ✅ | ✅ |

**Recommendation:** Use Chrome or Edge for best experience.

---

## 📝 Future Enhancements

### Planned Features

1. **Pre-recorded Audio:**
   - Upload audio files for verses
   - Use `audio_url_en`, `audio_url_fa` fields
   - Fallback to TTS if audio not available

2. **Word-level Timestamps:**
   - Record exact timing for each word
   - Store in `bible_word_timestamps` table
   - More accurate synchronization

3. **Verse Bookmarking:**
   - Save favorite verses
   - Resume from last position
   - Share verses with timestamp

4. **Advanced Search:**
   - Full-text search across all verses
   - Search by keyword, book, chapter
   - Filter by language

5. **Mobile App:**
   - React Native version
   - Offline support
   - Background audio playback

---

## 🤝 Contributing

To add a new feature:

1. Update database schema if needed
2. Add backend API endpoint
3. Create/update React component
4. Update this documentation
5. Test thoroughly

---

## 📞 Support

For issues or questions:
- Check troubleshooting section above
- Review console errors
- Check network tab for API failures
- Verify database connection

---

## 📄 License

This Bible reader system is part of the Church Management System.

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready
