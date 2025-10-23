# 🎵 Kalameh Song Archive Extractor

Complete system for extracting, structuring, and deploying Persian Christian songs from the Kalameh.com offline archive.

## 📋 Overview

This tool automatically:
- ✅ Extracts song metadata from 300+ HTML files
- ✅ Parses titles (FA/EN), artists, lyrics, media links
- ✅ Generates structured JSON/SQL/CSV exports
- ✅ Creates searchable database schema for Supabase
- ✅ Builds modern React player with word-level highlighting
- ✅ Deploys to web server via FTP

## 🚀 Quick Start

### 1. Extract Songs from Offline Archive

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run extraction script
python extract_kalameh_songs.py
```

**Output:**
- `export/songs_index.json` - Full song database (JSON)
- `export/songs_index.sql` - SQL insert statements
- `export/songs_manifest.csv` - Quick reference spreadsheet
- `export/songs.db` - SQLite database

### 2. Import to Supabase

```bash
# Run SQL schema in Supabase SQL Editor
psql -h your-supabase-url -U postgres -d postgres < songs_schema.sql

# Import data
node import_to_supabase.js
```

### 3. Deploy Frontend Components

```bash
# Copy React components to your project
cp SongPlayer.tsx your-project/components/
cp SongLibrary.tsx your-project/components/

# Install dependencies
npm install lucide-react
```

### 4. Upload to Server (Optional)

```bash
# Upload exported files via FTP
node upload_songs.js
```

## 📁 Project Structure

```
kalameh-extractor/
├── extract_kalameh_songs.py    # Main extraction script
├── tts_sync_generator.py       # Word-level timing generator
├── upload_songs.js              # FTP deployment script
├── songs_schema.sql             # Database schema for Supabase
├── requirements.txt             # Python dependencies
├── README.md                    # This file
└── export/                      # Generated files
    ├── songs_index.json
    ├── songs_index.sql
    ├── songs_manifest.csv
    ├── songs.db
    └── tts_sync/                # Word timing data
        ├── song1.json
        └── song2.json
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
# Source folder
KALAMEH_ARCHIVE_PATH=D:\path\to\kalameh.com

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# FTP (for deployment)
FTP_HOST=your-ftp-host.com
FTP_USER=your-username
FTP_PASS=your-password
FTP_PORT=21
FTP_BASE_DIR=public_html/songs
DOMAIN=yoursite.com

# Google Cloud TTS (optional)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

## 📊 Database Schema

### Main Tables

**songs** - Main song archive
- `id`, `slug`, `letter` (Persian alphabet)
- `title_fa`, `title_en`, `artist_fa`, `artist_en`
- `lyrics_fa`, `lyrics_en`
- `audio_url`, `video_url`, `ppt_url`, `chord_url`
- `duration`, `play_count`, `featured`

**song_favorites** - User favorites
- `user_id`, `song_id`

**song_playlists** - User playlists
- `user_id`, `name`, `song_ids[]`

**song_tts_sync** - Word timing data
- `song_id`, `language`, `sync_data` (JSONB)

### Key Functions

- `search_songs(query, letter, category)` - Full-text search
- `increment_song_play_count(slug)` - Track plays

## 🎨 Frontend Components

### SongPlayer Component

```tsx
import { SongPlayer } from './components/SongPlayer';

<SongPlayer
  song={song}
  autoPlay={true}
  showLyrics={true}
  enableHighlight={true}
  onNext={() => {}}
  onPrevious={() => {}}
/>
```

**Features:**
- ✅ Audio playback with seek bar
- ✅ Word-by-word lyric highlighting (synced to audio)
- ✅ Play/Pause, Volume, Loop controls
- ✅ Download PowerPoint/Chords
- ✅ Presentation mode (full-screen)

### SongLibrary Component

```tsx
import { SongLibrary } from './components/SongLibrary';

<SongLibrary />
```

**Features:**
- ✅ Alphabetical navigation (آ-ی)
- ✅ Search by title/artist
- ✅ Grid/List view toggle
- ✅ Song count per letter
- ✅ Auto-play next song

## 📡 API Routes

All routes available at `/api/songs/`

### GET /api/songs
Get all songs with optional filters
```
?letter=آ&category=worship&search=عیسی&limit=50&offset=0
```

### GET /api/songs/:slug
Get single song by slug

### POST /api/songs/:slug/play
Increment play count

### GET /api/songs/by-letter/:letter
Get songs by Persian letter

### GET /api/songs/letters/count
Get count of songs per letter

### GET /api/songs/featured
Get featured songs

### GET /api/songs/search
Advanced full-text search
```
?q=عیسی&letter=آ&limit=50
```

### GET /api/songs/:slug/tts-sync
Get TTS sync data for word highlighting

## 🎙️ TTS Sync Generation (Optional)

Generate word-level timing data for synchronized highlighting:

```bash
# Setup Google Cloud credentials
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Generate sync data
python tts_sync_generator.py
```

**Output:** `tts_sync/song-slug.json`

```json
{
  "song_slug": "ey-isa-nazdam-bia",
  "language": "fa",
  "total_duration": 42.5,
  "timings": [
    {"word": "ای", "start": 0.0, "end": 0.3},
    {"word": "عیسی", "start": 0.31, "end": 0.7},
    {"word": "نزدم", "start": 0.71, "end": 1.2}
  ]
}
```

## 📈 Extraction Statistics

Expected output from `extract_kalameh_songs.py`:

```
📊 KALAMEH SONG ARCHIVE EXTRACTION SUMMARY
================================================================================
📈 Total Songs: 347
   🎧 With Audio: 312 (89.9%)
   📽️  With Video: 145 (41.8%)
   🖥️  With PowerPoint: 289 (83.3%)
   📝 With Lyrics: 347 (100%)
   🎵 With Chords: 178 (51.3%)

📚 Songs by Letter:
   آ: 24 songs
   ا: 31 songs
   ب: 28 songs
   پ: 15 songs
   ...
```

## 🔐 Security

### Row Level Security (RLS)

Enabled on all tables:
- ✅ Public read access to published songs
- ✅ Authenticated users can manage favorites
- ✅ Users own their playlists

### API Authentication

Optional: Protect routes with Supabase Auth:

```javascript
const { data: { user } } = await supabase.auth.getUser();
if (!user) return res.status(401).json({ error: 'Unauthorized' });
```

## 🎯 Usage Examples

### Basic Integration

```javascript
// Fetch all songs
const response = await fetch('/api/songs');
const { songs } = await response.json();

// Search songs
const results = await fetch('/api/songs/search?q=عیسی');
const { songs: searchResults } = await results.json();

// Get songs by letter
const letterSongs = await fetch('/api/songs/by-letter/آ');
const { songs: aSongs } = await letterSongs.json();
```

### React Hook

```typescript
const useSongs = (letter?: string) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = letter ? `/api/songs/by-letter/${letter}` : '/api/songs';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setSongs(data.songs);
        setLoading(false);
      });
  }, [letter]);

  return { songs, loading };
};
```

## 🐛 Troubleshooting

### No songs extracted
- ✅ Check `BASE_DIR` path in `extract_kalameh_songs.py`
- ✅ Ensure HTML files exist in `song/` folder

### Database connection failed
- ✅ Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`
- ✅ Check Supabase project is active

### FTP upload failed
- ✅ Test FTP credentials with FileZilla
- ✅ Ensure remote directory exists

### TTS sync not working
- ✅ Check Google Cloud credentials
- ✅ Enable Text-to-Speech API in GCP console

## 📝 License

MIT License - Free for personal and commercial use

## 👨‍💻 Author

Created by AI Data Engineer for Iran Church DC

---

## 🎉 Next Steps

1. ✅ Run `extract_kalameh_songs.py` to generate exports
2. ✅ Import `songs_schema.sql` to Supabase
3. ✅ Add API routes to Express server
4. ✅ Copy React components to your project
5. ✅ Deploy and test!

**Questions?** Check the code comments or create an issue.

🎵 Enjoy your modern Persian song library!
