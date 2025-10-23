# 🎙️ Google Cloud TTS Automated System - Complete Setup Guide

## 📋 Overview

This system provides **FREE** automated Text-to-Speech for your Bible platform using Google Cloud TTS with:
- ✅ **Free Tier**: 500,000 characters/month (WaveNet voices)
- ✅ **Auto-Detection**: Watches for text changes and regenerates audio
- ✅ **Dual-Language**: Persian (fa-IR-Wavenet-D) + English (en-US-Neural2-F)
- ✅ **Smart Caching**: Never regenerates the same text twice
- ✅ **Auto-Sync**: Uploads to production server automatically
- ✅ **Version Control**: Tracks audio versions with MD5 hashes
- ✅ **Usage Monitoring**: Dashboard to track quota usage

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```powershell
cd "d:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch"

# Backend dependencies
cd backend
npm install @google-cloud/text-to-speech chokidar ssh2-sftp-client

# Frontend dependencies  
cd ..
npm install

# Create required directories
New-Item -ItemType Directory -Force -Path "cache/tts"
New-Item -ItemType Directory -Force -Path "public/audio/bible/fa"
New-Item -ItemType Directory -Force -Path "public/audio/bible/en"
New-Item -ItemType Directory -Force -Path "public/audio/songs/fa"
New-Item -ItemType Directory -Force -Path "public/audio/songs/en"
New-Item -ItemType Directory -Force -Path "data/bible"
New-Item -ItemType Directory -Force -Path "data/songs"
New-Item -ItemType Directory -Force -Path "logs"
```

### Step 2: Configure Environment

Copy `.env.tts` to `backend/.env` and update:

```bash
# Your service account JSON path (already downloaded)
GOOGLE_APPLICATION_CREDENTIALS="d:/Windows.old/Users/Sami/Desktop/Iran Church DC/Cloud Speech-to-Text API User/gen-lang-client-0969365672-9e46846c8ca7.json"

# Server details (for auto-sync)
SERVER_HOST="samanabyar.online"
SERVER_USER="root"
SERVER_SSH_KEY_PATH="~/.ssh/id_rsa"  # Or use password
```

### Step 3: Test TTS Service

```powershell
cd backend
node services/ttsManager.js
```

Expected output:
```
=== TTS Manager Test ===
📊 Current usage: { charactersUsed: 0, remaining: 500000 }
📖 Generating Bible audio: GEN 1:1
✅ Speech synthesized successfully (fa)
✅ Speech synthesized successfully (en)
✅ Test successful!
```

### Step 4: Start File Watcher (Auto-Regeneration)

```powershell
# Terminal 1: File watcher
node backend/services/audioFileWatcher.js

# Terminal 2: Backend server
npm run dev:backend

# Terminal 3: Frontend
npm run dev
```

---

## 📁 File Structure

```
Mychurch/
├── backend/
│   ├── services/
│   │   ├── ttsManager.js          # Core TTS service with quota tracking
│   │   └── audioFileWatcher.js    # Watches for file changes
│   └── routes/
│       └── tts.js                 # TTS API endpoints
├── scripts/
│   └── sync_audio_to_server.js    # Syncs audio to production
├── hooks/
│   └── useAudioSync.ts            # React hook for audio playback
├── pages/
│   └── TTSUsageDashboard.tsx      # Usage monitoring dashboard
├── public/
│   ├── audio/                     # Generated audio files
│   │   ├── bible/fa/*.mp3
│   │   ├── bible/en/*.mp3
│   │   ├── songs/fa/*.mp3
│   │   └── songs/en/*.mp3
│   └── audio_index.json           # Audio file index
├── cache/
│   ├── tts/                       # Cached TTS responses
│   │   ├── fa_*.json
│   │   └── fa_*.mp3
│   └── last_sync.json             # Last sync info
├── data/                          # Source text files (watch these!)
│   ├── bible/
│   │   └── GEN/
│   │       ├── 1.json
│   │       └── ...
│   ├── songs/
│   │   └── song_1.json
│   └── readings/
└── logs/
    ├── tts-manager.log
    └── sync.log
```

---

## 🎯 How It Works

### 1. **Text Change Detection**

```json
// data/bible/GEN/1.json
{
  "bookCode": "GEN",
  "chapter": 1,
  "verses": [
    {
      "verseNumber": 1,
      "textEn": "In the beginning God created the heaven and the earth.",
      "textFa": "در ابتدا خدا آسمان و زمین را آفرید."
    }
  ]
}
```

When you update this file, the watcher:
1. Detects the change
2. Calculates MD5 hash of the text
3. Compares with cached version
4. If different → regenerates audio

### 2. **Audio Generation**

```javascript
// Automatically generates both languages
const result = await ttsManager.generateBibleVerseAudio(
  'GEN',      // Book code
  1,          // Chapter
  1,          // Verse number
  'In the beginning...', // English text
  'در ابتدا...'         // Persian text
);

// Outputs:
// /public/audio/bible/fa/gen_1_1_va3b5c6d.mp3
// /public/audio/bible/en/gen_1_1_va3b5c6d.mp3
```

### 3. **Caching System**

```javascript
// Cache prevents duplicate API calls
Cache key: fa_md5hash.json

// Cached data:
{
  "audioContent": "base64...",
  "metadata": {
    "text": "در ابتدا...",
    "language": "fa",
    "voice": "fa-IR-Wavenet-D",
    "characterCount": 42,
    "timestamp": "2025-10-23T10:00:00Z"
  }
}
```

### 4. **Auto-Sync to Server**

```javascript
// After audio generation
await syncAudioToServer();

// Uploads:
// - All changed MP3 files
// - Updated audio_index.json
// - Only transfers differences (like rsync)
```

---

## 🔧 API Endpoints

### 1. **Generate Verse Audio**

```bash
POST /api/tts/synthesize-verse
Content-Type: application/json

{
  "bookCode": "GEN",
  "chapter": 1,
  "verseNumber": 1,
  "textEn": "In the beginning...",
  "textFa": "در ابتدا..."
}

# Response:
{
  "success": true,
  "verse": {
    "audio": {
      "fa": "/audio/bible/fa/gen_1_1_v12345.mp3",
      "en": "/audio/bible/en/gen_1_1_v12345.mp3"
    },
    "metadata": { ... }
  }
}
```

### 2. **Generate Chapter (Batch)**

```bash
POST /api/tts/synthesize-chapter

{
  "bookCode": "GEN",
  "chapter": 1,
  "verses": [
    { "verseNumber": 1, "textEn": "...", "textFa": "..." },
    { "verseNumber": 2, "textEn": "...", "textFa": "..." }
  ]
}
```

### 3. **Check Usage**

```bash
GET /api/tts/usage

# Response:
{
  "success": true,
  "usage": {
    "currentMonth": "2025-10",
    "charactersUsed": 12500,
    "remaining": 487500,
    "percentageUsed": "2.50",
    "requestCount": 25
  }
}
```

### 4. **Get Verse Audio Info**

```bash
GET /api/tts/verse-audio/GEN/1/1

{
  "success": true,
  "audio": {
    "audio": { "fa": "...", "en": "..." },
    "version": "v12345",
    "hash": "a3b5c6d..."
  }
}
```

---

## ⚛️ React Integration

### Using the Hook

```tsx
import { useAudioSync } from '../hooks/useAudioSync';

function BibleVerse({ bookCode, chapter, verseNumber, textEn, textFa }) {
  const { 
    playVerse, 
    isPlaying, 
    isLoading,
    getVerseAudio 
  } = useAudioSync();

  const verseAudio = getVerseAudio(bookCode, chapter, verseNumber);

  const handlePlay = async (language: 'fa' | 'en') => {
    await playVerse(bookCode, chapter, verseNumber, language);
  };

  return (
    <div className="verse">
      <p>{textFa}</p>
      <p>{textEn}</p>
      
      {verseAudio && (
        <div className="audio-controls">
          <button onClick={() => handlePlay('fa')} disabled={isLoading}>
            🔊 {isPlaying ? 'Playing...' : 'Play Persian'}
          </button>
          <button onClick={() => handlePlay('en')} disabled={isLoading}>
            🔊 {isPlaying ? 'Playing...' : 'Play English'}
          </button>
        </div>
      )}
    </div>
  );
}
```

### Auto-Preloading

```tsx
// Hook automatically preloads next 3 verses
const { playVerse } = useAudioSync({
  preloadCount: 3,
  enableAutoPreload: true,
  language: 'fa'
});

// When user plays verse 1, it preloads verses 2, 3, 4
```

---

## 📊 Usage Monitoring Dashboard

Access at: `http://localhost:5173/admin/tts-usage`

Features:
- ✅ Current month usage (real-time)
- ✅ Progress bar with color coding
- ✅ Warning alerts at 75% and 90%
- ✅ Historical usage (last 12 months)
- ✅ Request count tracking
- ✅ Auto-refresh every 30 seconds

---

## 🔄 Workflow Examples

### Example 1: Add New Bible Chapter

```powershell
# 1. Create JSON file
New-Item -Path "data/bible/GEN/2.json" -ItemType File

# 2. Add content
{
  "bookCode": "GEN",
  "chapter": 2,
  "verses": [
    {
      "verseNumber": 1,
      "textEn": "Thus the heavens and the earth were finished...",
      "textFa": "و آسمان‌ها و زمین و تمامی لشکر آنها تکمیل شدند."
    }
  ]
}

# 3. Save file
# → File watcher detects change
# → Automatically generates audio for all verses
# → Syncs to server (if SYNC_ON_CHANGE=true)
```

### Example 2: Update Existing Verse

```powershell
# 1. Edit data/bible/GEN/1.json
# 2. Change textFa for verse 1
# → Watcher detects hash change
# → Regenerates ONLY changed verse
# → Old version deleted automatically
# → New version synced to server
```

### Example 3: Manual Sync

```powershell
# Run sync manually
node scripts/sync_audio_to_server.js

# Output:
🔄 Starting audio sync...
📂 Scanning local audio directory
📁 Found 150 audio files
🔌 Connecting to samanabyar.online:22
✅ Connected to server
[1/150] ⏭️  Skipped (unchanged): bible/fa/gen_1_1_v12345.mp3
[2/150] ⬆️  Uploading: bible/fa/gen_2_1_v67890.mp3
...
📊 SYNC SUMMARY
✅ Files uploaded: 12
⏭️  Files skipped: 138
📦 Data transferred: 245 KB
⏱️  Duration: 8.5s
```

---

## 💰 Cost Management (FREE!)

### Free Tier Limits

| Voice Type | Limit | Your Config |
|------------|-------|-------------|
| WaveNet (Persian) | 500k chars/month | ✅ fa-IR-Wavenet-D |
| Neural2 (English) | 1M chars/month | ✅ en-US-Neural2-F |

### Example Usage Calculation

```
Full Bible (KJV):
- Total characters: ~4.5 million
- Persian WaveNet: Can process 500k/month
- Time to complete: 9 months (if starting from scratch)

With Caching:
- Generate once → cache forever
- Re-play millions of times → 0 cost
```

### Optimization Tips

1. **Batch Processing**: Generate during off-peak hours
2. **Incremental Updates**: Only changed verses regenerate
3. **Cache Everything**: Never call API twice for same text
4. **Monitor Dashboard**: Check usage before generating large batches

---

## 🐛 Troubleshooting

### Issue 1: "GOOGLE_APPLICATION_CREDENTIALS not set"

```powershell
# Check environment variable
$env:GOOGLE_APPLICATION_CREDENTIALS

# Set manually (PowerShell)
$env:GOOGLE_APPLICATION_CREDENTIALS = "d:/Windows.old/Users/Sami/Desktop/Iran Church DC/Cloud Speech-to-Text API User/gen-lang-client-0969365672-9e46846c8ca7.json"

# Or add to .env
GOOGLE_APPLICATION_CREDENTIALS="path/to/your/key.json"
```

### Issue 2: "Quota exceeded"

```
❌ Free tier quota exceeded!

Solution:
1. Check dashboard: /admin/tts-usage
2. Wait until next month (auto-resets on 1st)
3. Or upgrade Google Cloud plan
```

### Issue 3: "File watcher not detecting changes"

```powershell
# Check watched directories exist
Test-Path "data/bible"
Test-Path "data/songs"

# Check watcher is running
# Should see: "👀 Starting file watchers..."

# Restart watcher
node backend/services/audioFileWatcher.js
```

### Issue 4: "Sync failed - Connection refused"

```bash
# Test SSH connection
ssh root@samanabyar.online

# Check SSH key
Test-Path "~/.ssh/id_rsa"

# Or use password in .env
SERVER_PASS="your_password"
```

---

## 📝 Scheduled Tasks

### Windows Task Scheduler

```powershell
# Create task to run file watcher on startup
schtasks /create /tn "Bible TTS Watcher" /tr "node backend/services/audioFileWatcher.js" /sc onstart

# Create task for daily sync at 3 AM
schtasks /create /tn "Bible Audio Sync" /tr "node scripts/sync_audio_to_server.js" /sc daily /st 03:00
```

### PM2 (Server)

```bash
# Install PM2
npm install -g pm2

# Start watcher
pm2 start backend/services/audioFileWatcher.js --name tts-watcher

# Start with auto-restart
pm2 startup
pm2 save
```

---

## 🎉 Success Checklist

- [ ] Dependencies installed (`@google-cloud/text-to-speech`, `chokidar`, `ssh2-sftp-client`)
- [ ] Service account JSON configured in `.env`
- [ ] Test TTS service ran successfully
- [ ] File watcher started and monitoring
- [ ] First verse audio generated
- [ ] Audio files visible in `/public/audio/`
- [ ] Audio index created at `/public/audio_index.json`
- [ ] React hook tested in frontend
- [ ] Usage dashboard accessible
- [ ] Server sync tested (optional)
- [ ] No quota warnings in dashboard

---

## 📚 Next Steps

1. **Generate Initial Audio**:
   ```powershell
   node backend/scripts/generate-all-bible-audio.js
   ```

2. **Integrate with Flipbook**:
   - Use `useAudioSync` hook
   - Add 🔊 icons to verses
   - Enable auto-preloading

3. **Monitor Usage**:
   - Visit `/admin/tts-usage` weekly
   - Stay under 400k chars/month (80% of limit)

4. **Set Up Auto-Sync**:
   - Configure SSH key
   - Enable `SYNC_ON_CHANGE=true`
   - Test with `npm run sync-audio`

---

## 🆘 Support

**Files Created:**
- `backend/services/ttsManager.js` - Core TTS service
- `backend/services/audioFileWatcher.js` - Auto-regeneration
- `backend/routes/tts.js` - API endpoints
- `scripts/sync_audio_to_server.js` - Server sync
- `hooks/useAudioSync.ts` - React hook
- `pages/TTSUsageDashboard.tsx` - Usage dashboard
- `.env.tts` - Environment template

**Test Command:**
```powershell
node backend/services/ttsManager.js
```

**Logs:**
- TTS: `logs/tts-manager.log`
- Sync: `logs/sync.log`
- Watcher: Console output

---

**Ready to deploy! 🚀**
