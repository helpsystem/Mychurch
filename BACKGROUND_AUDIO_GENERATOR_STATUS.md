# Background Audio Generator - Complete Guide

## ✅ Status: RUNNING AUTOMATICALLY IN BACKGROUND

The Bible Audio Generator is now running in the background and will automatically:
1. Generate audio files for all Bible chapters (English + Persian)
2. Create word-level timing alignment data
3. Save progress and continue from where it left off if interrupted
4. Log all activities to `audio_generation_log.txt`

---

## 📊 Current Setup

- **Job ID**: 3 (PowerShell Background Job)
- **Output Directory**: `public/audio/bible/auto-generated/`
- **Alignment Directory**: `public/data/alignments/`
- **Progress File**: `audio_generation_progress.json`
- **Log File**: `audio_generation_log.txt`

---

## 💡 Management Commands

### View Live Log (Real-Time)
```powershell
Get-Content audio_generation_log.txt -Wait -Tail 10
```

### Check Progress
```powershell
Get-Content audio_generation_progress.json | ConvertFrom-Json | Format-List
```

### View Generated Files
```powershell
# Audio files
Get-ChildItem public/audio/bible/auto-generated/ | Select-Object Name, Length

# Alignment files
Get-ChildItem public/data/alignments/ | Select-Object Name
```

### Check Job Status
```powershell
Get-Job -Id 3 | Format-List
```

### View Job Output
```powershell
Receive-Job -Id 3 -Keep
```

### Stop Generator
```powershell
Stop-Job -Id 3
Remove-Job -Id 3
Remove-Item bg_audio_job.txt
```

---

## 📈 Statistics

### Expected Output
- **Total Chapters**: 1,189 (66 books)
- **Audio Files**: 2,378 (English + Persian for each chapter)
- **Alignment Files**: 2,378 JSON files
- **Total Size**: ~2-3 GB

### Time Estimates
- **Per Chapter**: 2-3 minutes (audio generation + alignment)
- **Per Book**: Varies by chapter count (e.g., Genesis 50 chapters = ~2 hours)
- **Full Bible**: 10-12 hours continuous running

### Current Progress
Check `audio_generation_progress.json` for:
- Last book processed
- Last chapter completed
- Total chapters generated
- Start time and last update time

---

## 🎯 Features

### Automatic Audio Generation
- Uses Microsoft Edge TTS (free, unlimited)
- English voice: `en-US-GuyNeural`
- Persian voice: `fa-IR-DilaraNeural`
- High-quality, natural-sounding speech

### Word-Level Alignment
- **Method 1**: Whisper (if installed) - most accurate
- **Method 2**: Synthetic timing (fallback) - good enough for most cases
- Saves timing data in JSON format compatible with `BibleAudioTextSync` component

### Progress Tracking
- Saves progress after each chapter
- Can resume from last position if stopped
- Logs all activities with timestamps

### Error Handling
- Retries on failure
- Skips existing files (won't regenerate)
- Continues on error (doesn't stop entire process)

---

## 🗂️ File Structure

### Audio Files
```
public/audio/bible/auto-generated/
├── GEN_1_en.mp3
├── GEN_1_fa.mp3
├── GEN_2_en.mp3
├── GEN_2_fa.mp3
└── ...
```

### Alignment Files
```
public/data/alignments/
├── GEN_1_en_alignment.json
├── GEN_1_fa_alignment.json
├── GEN_2_en_alignment.json
├── GEN_2_fa_alignment.json
└── ...
```

### Alignment JSON Format
```json
{
  "verses": [
    {
      "verse": 1,
      "words": [
        {
          "word": "In",
          "start": 0.0,
          "end": 0.25,
          "index": 0
        }
      ],
      "totalDuration": 125.5
    }
  ],
  "language": "en",
  "metadata": {
    "book": "GEN",
    "chapter": 1,
    "method": "synthetic",
    "generatedAt": "2025-11-03T06:34:37"
  }
}
```

---

## 🔧 Configuration

### Books List
Edit `scripts/background_audio_generator.py` to add/remove books:
```python
books = [
    {'code': 'GEN', 'chapters': 50, 'name': 'Genesis'},
    {'code': 'EXO', 'chapters': 40, 'name': 'Exodus'},
    # Add more books here
]
```

### Delay Between Requests
Adjust delay to prevent rate limiting (default: 1.0 second):
```python
await asyncio.sleep(1.0)  # Line 241 in background_audio_generator.py
```

### Voice Selection
Change voices in the script:
```python
voice = 'en-US-JennyNeural' if language == 'en' else 'fa-IR-FaridNeural'
```

---

## 🐛 Troubleshooting

### Generator Not Starting
- Check if backend is running: `curl http://localhost:3001/api/bible/content/GEN/1`
- Check Python version: `py -3.12 --version`
- Install dependencies: `py -3.12 -m pip install edge-tts aiohttp`

### No Audio Files Generated
- Check log file: `Get-Content audio_generation_log.txt -Tail 50`
- Check job state: `Get-Job -Id 3`
- View job errors: `Receive-Job -Id 3`

### Alignment Data Incorrect
- Install Whisper for better accuracy: `pip install openai-whisper torch`
- Synthetic alignment is estimated timing (not precise)
- Regenerate specific chapter: Delete old files and restart

### Unicode/Encoding Errors
- Already fixed in current version (UTF-8 encoding)
- If still occurs, check Windows console encoding: `chcp 65001`

---

## 🚀 Next Steps

### 1. Monitor Progress
Watch the log file in real-time:
```powershell
Get-Content audio_generation_log.txt -Wait -Tail 10
```

### 2. Test Generated Files
Once a few chapters are complete:
```powershell
# List generated files
Get-ChildItem public/audio/bible/auto-generated/ | Select-Object -First 10

# Test playback (Windows)
Start-Process "public/audio/bible/auto-generated/GEN_1_en.mp3"
```

### 3. Integrate with Website
Files are automatically saved in the correct location. Update `BibleAudioSyncDemoPage.tsx` to use new files:
```tsx
audioUrl="/audio/bible/auto-generated/GEN_1_en.mp3"
```

### 4. Run Overnight
The generator runs in background and doesn't block terminal:
- Estimated completion: 10-12 hours for full Bible
- Safe to minimize VS Code or work on other tasks
- Progress is saved, can resume if interrupted

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| View log live | `Get-Content audio_generation_log.txt -Wait -Tail 10` |
| Check progress | `Get-Content audio_generation_progress.json` |
| Stop generator | `Stop-Job -Id 3; Remove-Job -Id 3` |
| View files | `Get-ChildItem public/audio/bible/auto-generated/` |
| Check status | `Get-Job -Id 3` |

---

## ✅ System is Running

The generator is now active and processing Bible chapters automatically in the background. 
Check the log file periodically to monitor progress!

**Estimated completion time**: 10-12 hours (for full Bible)

---

**Last Updated**: November 3, 2025
**Job ID**: 3
**Status**: Running
