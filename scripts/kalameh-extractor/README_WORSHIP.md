# 🎵 Worship Songs Archive System

Complete Persian/English worship songs extraction, database, and modern web interface from www.kalameh.com offline archive.

## 📋 Features

- **Extraction**: Parse 300+ HTML files from Kalameh archive
- **Data Outputs**: JSON (flat + hierarchical), CSV, SQL
- **Modern UI**: React + TypeScript + Tailwind CSS
- **Audio Player**: Word-level highlighting synchronized with playback
- **Presentation Mode**: Projector-optimized view
- **Search & Filter**: By letter, title, composer, chord key
- **Keyboard Shortcuts**: Space=Play/Pause, /=Search, P=Presentation, Esc=Exit
- **Upload**: SFTP deployment script

## 🚀 Quick Start

### 1. Extract Songs from HTML Archive

```bash
cd scripts/kalameh-extractor

# Install Python dependencies
pip install beautifulsoup4 lxml mutagen

# Run extraction
python extract_worship_songs.py
```

**Output**: `export/worship_songs_index.json`, `*.csv`, `*.sql`

### 2. Copy Data to Frontend

```bash
# Copy JSON to public folder for frontend access
copy export\worship_songs_index.json ..\..\public\
```

### 3. Run Development Server

```bash
# Install Node dependencies (if not done)
npm install

# Start backend
cd backend
npm start

# Start frontend (in new terminal)
cd ..
npm run dev
```

Visit: **http://localhost:5173/worship-songs**

### 4. Upload to Server (Optional)

```bash
cd scripts/kalameh-extractor

# Configure .env
copy .env.example .env
# Edit .env with your SFTP credentials

# Upload
node upload_assets.js
```

## 📁 Project Structure

```
scripts/kalameh-extractor/
├── extract_worship_songs.py   # HTML parser & data extractor
├── extract_songs_node.js       # Node.js alternative (no Python)
├── upload_assets.js             # SFTP uploader
├── .env.example                 # SFTP config template
└── export/                      # Generated outputs
    ├── worship_songs_index.json
    ├── worship_songs_flat.json
    ├── worship_songs.csv
    ├── worship_songs.sql
    └── parse_log.txt

pages/
└── WorshipSongsArchive.tsx     # Main page component

components/
├── SongCard.tsx                 # Individual song card with player
└── SongLibrary.tsx              # Old version (can be removed)

hooks/
└── useAudioHighlight.ts         # Word-level sync logic

backend/routes/
└── songs.js                     # API endpoints with mock fallback
```

## 🎹 Keyboard Shortcuts

- **Space**: Play/Pause current song
- **/**: Focus search box
- **Ctrl+P**: Toggle presentation mode
- **Esc**: Exit presentation mode
- **←/→**: Previous/Next song (if implemented)

## 🔧 Configuration

### Extract Python Script

Edit `extract_worship_songs.py`:

```python
ROOTS = [
    r"D:\Path\To\www.kalameh.com",
    r"D:\Path\To\specific\song-archive.html",
]

EXPORT_DIR = Path(__file__).parent / "export"
```

### SFTP Upload

Create `.env` from `.env.example`:

```env
SERVER_HOST=your.server.ip
SERVER_PORT=22
SERVER_USER=root
SERVER_PASS=yourpassword
# OR
# SERVER_KEY=C:/Users/you/.ssh/id_rsa

LOCAL_EXPORT_DIR=D:/Path/To/export
REMOTE_BASE_DIR=/var/www/html/assets/worship
UPLOAD_AUDIO=false
```

### Frontend API

Vite config (already set up):

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true
  }
}
```

## 📊 Data Schema

### JSON Output Structure

```json
{
  "total_songs": 300,
  "letters": 32,
  "data": {
    "ا": [
      {
        "id": "abc123def456",
        "slug": "آگاهی-از-محبت-خدا",
        "title_fa": "آگاهی از محبت خدا",
        "title_en": "Awareness of God's Love",
        "composer": "کشیش ادوارد هوسپیان",
        "artist": "کشیش ادوارد هوسپیان",
        "letter": "آ",
        "chord_base": "D",
        "chord_mode": "Major",
        "chord_view": "/node/12345",
        "ppt": "/files/song123.pptx",
        "video": "https://youtube.com/watch?v=...",
        "lyric_audio_link": "/node/12346",
        "audio_download": "/files/song123.mp3",
        "audio_stream": "/sites/default/files/audio/song123.mp3",
        "mp3_local": "D:/path/to/local/song123.mp3",
        "duration_sec": 245.5,
        "lyrics_fa": "متن کامل سرود به فارسی...",
        "lyrics_en": "Full English lyrics...",
        "source_html": "D:/archive/song-archive.html"
      }
    ]
  }
}
```

### SQL Schema

```sql
CREATE TABLE worship_songs (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    letter TEXT,
    title_fa TEXT,
    title_en TEXT,
    composer TEXT,
    artist TEXT,
    chord_base TEXT,
    chord_mode TEXT,
    chord_view TEXT,
    ppt TEXT,
    video TEXT,
    lyric_audio_link TEXT,
    audio_download TEXT,
    audio_stream TEXT,
    mp3_local TEXT,
    duration_sec REAL,
    lyrics_fa TEXT,
    lyrics_en TEXT,
    source_html TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎨 Features Detail

### Word-Level Highlighting

- **Algorithm**: Tokenize lyrics by whitespace/punctuation
- **Timing**: `word_duration = total_duration / word_count`
- **Sync**: RequestAnimationFrame loop checks currentTime
- **Visual**: Yellow background, scale transform, font-weight

### Presentation Mode

- Black background, high contrast
- Larger text (2xl titles, xl lyrics)
- 2-column grid on desktop
- Safe margins for projectors
- Persistent toolbar (auto-hide on idle - future)

### Search & Filters

- Real-time search across: title_fa, title_en, composer, artist
- Alphabet strip with active state
- Query params persistence (future)
- Fuzzy matching (future enhancement)

## 🐛 Troubleshooting

### Python Not Installed

Use Node.js version:

```bash
cd scripts/kalameh-extractor
node extract_songs_node.js
```

### Backend Won't Start

Check port conflicts:

```powershell
Get-NetTCPConnection -LocalPort 3001
# Kill process if needed
Stop-Process -Id <PID>
```

### Frontend Shows No Songs

1. Check API is running: http://localhost:3001/api/songs
2. Check proxy config in `vite.config.ts`
3. Check browser console for errors
4. Verify JSON file exists: `public/worship_songs_index.json`

### Mock Data Not Loading

Check file path in `backend/routes/songs.js`:

```javascript
const MOCK_DATA_PATH = path.join(__dirname, '../../scripts/kalameh-extractor/export/songs_index.json');
```

## 📝 TODO / Future Enhancements

- [ ] Import schema to Supabase
- [ ] Actual extraction from full archive (300+ songs)
- [ ] TTS word timing (Google Cloud TTS)
- [ ] Favorites & playlists
- [ ] PDF chord sheet viewer
- [ ] WebVTT subtitle generation
- [ ] Advanced search (key, mode, duration)
- [ ] Export to PDF/PPTX
- [ ] Share song links
- [ ] QR code generation
- [ ] Offline PWA support
- [ ] Multiple language support (EN/FA/AR)

## 📄 License

Internal use - Iranian Church DC

## 🙏 Credits

- **Source**: www.kalameh.com
- **Tech Stack**: React, TypeScript, Tailwind CSS, Node.js, Python, BeautifulSoup
- **Church**: Iranian Christian Church of DC

---

**Made with ❤️ for worship ministry**
