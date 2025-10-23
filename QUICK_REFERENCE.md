# 🎙️ Google Cloud TTS - Quick Reference Card

## 🚀 ONE-LINE INSTALLATION
```powershell
.\install-tts.ps1
```

## 📝 QUICK START (3 Terminals)

### Terminal 1: File Watcher
```powershell
cd backend
node services/audioFileWatcher.js
```

### Terminal 2: Backend Server
```powershell
npm run dev:backend
```

### Terminal 3: Frontend
```powershell
npm run dev
```

## 🔗 IMPORTANT URLs

| Service | URL |
|---------|-----|
| **Usage Dashboard** | http://localhost:5173/admin/tts-usage |
| **API Health** | http://localhost:3001/api/health |
| **Audio Index** | http://localhost:5173/audio_index.json |

## 📁 KEY FILES

```
backend/
  services/
    ttsManager.js          # Core TTS engine
    audioFileWatcher.js    # Auto-detection
  routes/
    tts.js                # API endpoints

scripts/
  sync_audio_to_server.js # Server sync

hooks/
  useAudioSync.ts         # React hook

pages/
  TTSUsageDashboard.tsx   # Monitor usage

data/
  bible/                  # Watch this!
  songs/                  # Watch this!
```

## 🎯 COMMON COMMANDS

```powershell
# Test TTS
npm run tts-test

# Start watcher
npm run tts-watcher

# Sync to server
npm run sync-audio

# Check logs
Get-Content logs/tts-manager.log -Tail 20

# View cache
Get-ChildItem cache/tts
```

## 🔧 API QUICK REFERENCE

### Generate Verse
```bash
POST /api/tts/synthesize-verse
{
  "bookCode": "GEN",
  "chapter": 1,
  "verseNumber": 1,
  "textEn": "...",
  "textFa": "..."
}
```

### Check Usage
```bash
GET /api/tts/usage
```

### Get Verse Audio
```bash
GET /api/tts/verse-audio/GEN/1/1
```

## ⚛️ REACT USAGE

```tsx
import { useAudioSync } from '../hooks/useAudioSync';

const { playVerse, isPlaying } = useAudioSync();

<button onClick={() => playVerse('GEN', 1, 1, 'fa')}>
  🔊 Play
</button>
```

## 📊 FREE TIER LIMITS

| Voice Type | Limit |
|------------|-------|
| **Persian WaveNet** | 500k chars/month |
| **English Neural2** | 1M chars/month |
| **Storage** | Unlimited (local) |

## 🐛 TROUBLESHOOTING

### "API Key Error"
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "d:/Windows.old/.../gen-lang-client-0969365672-9e46846c8ca7.json"
```

### "Quota Exceeded"
- Check dashboard: /admin/tts-usage
- Wait until next month
- Or upgrade plan

### "Watcher Not Working"
```powershell
# Restart watcher
npm run tts-watcher
```

## 💡 PRO TIPS

1. **Use Caching:** Never regenerate same text
2. **Batch Processing:** Generate chapters at once
3. **Monitor Usage:** Check dashboard weekly
4. **Preload Audio:** Use `preloadCount: 5`
5. **Auto-Sync:** Enable `SYNC_ON_CHANGE=true`

## 📈 SYSTEM STATUS

✅ Service Account Configured  
✅ TTS Manager Ready  
✅ File Watcher Ready  
✅ API Routes Registered  
✅ React Hook Available  
✅ Dashboard Accessible  
✅ Sample Data Created  

## 📚 DOCUMENTATION

- **Complete Guide:** TTS_AUTOMATED_SETUP.md
- **System Overview:** TTS_SYSTEM_README.md
- **Project Summary:** PROJECT_SUMMARY.md

---

**Ready! Run `.\install-tts.ps1` to start.**
