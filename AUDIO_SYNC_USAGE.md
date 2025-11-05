# Bible Audio-Text Synchronization System - Usage Guide

## 🎯 Overview

Advanced word-level audio-text synchronization system for Bible verses supporting English and Persian with real-time highlighting, bilingual display, and multiple alignment methods.

## 📦 System Components

### 1. **React Hook** (`hooks/useAudioTextSync.ts`)
Core logic for audio synchronization and word tracking.

### 2. **UI Component** (`components/BibleAudioTextSync.tsx`)
Full-featured user interface with playback controls and settings.

### 3. **Python Alignment Tool** (`scripts/bible_audio_aligner.py`)
Generates word-level timing data from audio files.

### 4. **Demo Page** (`pages/BibleAudioSyncDemoPage.tsx`)
Complete demonstration with sample data.

## 🚀 Quick Start

### Access Demo Page
```
http://localhost:5173/#/bible/audio-sync-demo
```

### Use in Your Component

```tsx
import { BibleAudioTextSync } from '@/components/BibleAudioTextSync';
import { TranscriptData } from '@/hooks/useAudioTextSync';

// Load your alignment data
const transcriptEn: TranscriptData = await fetch('/data/alignment_en.json').then(r => r.json());
const transcriptFa: TranscriptData = await fetch('/data/alignment_fa.json').then(r => r.json());

// Render component
<BibleAudioTextSync
  audioUrl="/audio/ephesians_1.mp3"
  transcriptEn={transcriptEn}
  transcriptFa={transcriptFa}
  bookName="Ephesians"
  chapter={1}
/>
```

## 📊 JSON Data Format

### Alignment Data Structure

```json
{
  "verses": [
    {
      "verse": 15,
      "words": [
        {
          "word": "For",
          "start": 0.00,
          "end": 0.25,
          "index": 0
        }
      ],
      "totalDuration": 6.55
    }
  ],
  "language": "en",
  "metadata": {
    "book": "Ephesians",
    "chapter": 1,
    "totalVerses": 2,
    "method": "whisper"
  }
}
```

### Field Descriptions

- **word**: The actual word text
- **start**: Start time in seconds (milliseconds precision)
- **end**: End time in seconds (milliseconds precision)
- **index**: Global word index across all verses
- **totalDuration**: Total duration of the verse in seconds

## 🎬 Generating Alignment Data

### Method 1: Whisper (Automatic Transcription)

Best for: Audio files without existing transcripts

```bash
python scripts/bible_audio_aligner.py \
  --audio "D:\BibleAudio\English\Ephesians_1.mp3" \
  --text "placeholder.txt" \
  --output "ephesians_1_en_alignment.json" \
  --language en \
  --model base \
  --method whisper \
  --book "Ephesians" \
  --chapter 1
```

**Requirements**: `pip install openai-whisper torch`

### Method 2: Forced Alignment (With Transcript)

Best for: When you have accurate transcripts

```bash
python scripts/bible_audio_aligner.py \
  --audio "D:\BibleAudio\Farsi\Ephesians_1.mp3" \
  --text "ephesians_1_transcript.txt" \
  --output "ephesians_1_fa_alignment.json" \
  --language fa \
  --method forced \
  --book "افسسیان" \
  --chapter 1
```

**Requirements**: `pip install aeneas`

### Method 3: Synthetic Alignment (Fallback)

Best for: Testing or when audio files are unavailable

```bash
python scripts/bible_audio_aligner.py \
  --audio "dummy.mp3" \
  --text "ephesians_1_transcript.txt" \
  --output "ephesians_1_synthetic_alignment.json" \
  --language en \
  --method synthetic \
  --book "Ephesians" \
  --chapter 1
```

**Requirements**: None (built-in Python only)

## 🎨 Component Features

### Language Selector
- **English**: Display English text only (LTR)
- **Both**: Side-by-side bilingual display
- **فارسی (Persian)**: Display Persian text only (RTL)

### Playback Controls
- **Play/Pause**: Start/stop audio playback
- **Stop**: Reset to beginning
- **Skip Verse**: Jump to previous/next verse
- **Progress Bar**: Click to seek to specific time

### Settings Panel
- **Sync Mode**: 
  - Word: Highlight individual words
  - Verse: Highlight entire verses
  - Phrase: Highlight phrase segments
- **Playback Speed**: 0.5x - 2.0x (0.25x increments)
- **Volume**: 0-100% (5% increments)

### Visual Features
- **Active Word**: Yellow background with scale animation
- **Active Verse**: Blue left border (English) or right border (Persian)
- **Verse Numbers**: Clickable to jump to specific verse
- **Dark Mode**: Full dark mode support
- **Responsive**: Mobile and desktop optimized

## 🔧 Advanced Usage

### Custom Hook Configuration

```tsx
import { useAudioTextSync } from '@/hooks/useAudioTextSync';

const {
  isPlaying,
  currentWordIndex,
  currentWord,
  currentVerseNumber,
  play,
  pause,
  stop,
  seek,
  seekToWord,
  seekToVerse,
  setPlaybackRate,
  setVolume,
  mode,
  setMode,
  audioRef
} = useAudioTextSync({
  audioUrl: '/audio/verse.mp3',
  transcript: transcriptData,
  mode: 'word', // 'word' | 'verse' | 'phrase'
  onWordChange: (word, index) => {
    console.log(`Word ${index}:`, word);
  },
  onVerseChange: (verseNumber) => {
    console.log(`Verse:`, verseNumber);
  },
  onTimeUpdate: (time) => {
    console.log(`Time:`, time.toFixed(2));
  }
});

return (
  <div>
    <button onClick={play}>Play</button>
    <button onClick={pause}>Pause</button>
    <button onClick={() => seekToVerse(3)}>Go to Verse 3</button>
    <button onClick={() => setPlaybackRate(1.5)}>1.5x Speed</button>
    <audio ref={audioRef} />
  </div>
);
```

### Building Custom UI

```tsx
import { useAudioTextSync, TranscriptData } from '@/hooks/useAudioTextSync';

const CustomBiblePlayer = ({ audioUrl, transcript }: { 
  audioUrl: string; 
  transcript: TranscriptData;
}) => {
  const { currentWordIndex, play, pause, isPlaying } = useAudioTextSync({
    audioUrl,
    transcript,
    mode: 'word'
  });

  return (
    <div>
      {transcript.verses.map((verse) => (
        <div key={verse.verse}>
          <span className="verse-number">{verse.verse}</span>
          {verse.words.map((w, i) => (
            <span
              key={i}
              className={i === currentWordIndex ? 'active' : ''}
            >
              {w.word}{' '}
            </span>
          ))}
        </div>
      ))}
      <button onClick={isPlaying ? pause : play}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
};
```

## 📁 File Organization

### Audio Files
```
public/
└── audio/
    └── bible/
        ├── english/
        │   ├── ephesians_1.mp3
        │   └── ephesians_2.mp3
        └── farsi/
            ├── ephesians_1.mp3
            └── ephesians_2.mp3
```

### Alignment Data
```
public/
└── data/
    ├── alignments/
    │   ├── english/
    │   │   ├── ephesians_1_alignment.json
    │   │   └── ephesians_2_alignment.json
    │   └── farsi/
    │       ├── ephesians_1_alignment.json
    │       └── ephesians_2_alignment.json
    └── sample_alignment_en.json
```

## 🔍 Troubleshooting

### Audio Not Playing
- Check audio file path is correct
- Verify file format (MP3, WAV, OGG supported)
- Check browser console for CORS errors
- Ensure audio file is in `public/` directory

### Words Not Highlighting
- Verify alignment JSON format is correct
- Check `start` and `end` times are in seconds
- Ensure `index` values are sequential
- Verify audio duration matches alignment data

### Performance Issues
- Use smaller Whisper model (`--model tiny` or `--model base`)
- Reduce audio quality (16kHz mono recommended)
- Limit verses per page (paginate long chapters)
- Enable production build (`npm run build`)

### Alignment Accuracy Issues
- **Whisper**: Use larger model (`--model medium` or `--model large`)
- **Forced Alignment**: Ensure transcript matches audio exactly
- **Synthetic**: Adjust speaking rate in code (default: 150 wpm English, 120 wpm Persian)

## 📈 Performance Optimization

### Lazy Loading
```tsx
// Load alignment data only when needed
const [alignment, setAlignment] = useState<TranscriptData | null>(null);

useEffect(() => {
  fetch(`/data/alignments/${book}_${chapter}_${lang}.json`)
    .then(res => res.json())
    .then(setAlignment);
}, [book, chapter, lang]);

return alignment ? (
  <BibleAudioTextSync transcriptEn={alignment} ... />
) : (
  <div>Loading...</div>
);
```

### Audio Preloading
```tsx
<audio preload="auto" ref={audioRef} />
```

### Virtual Scrolling (for long chapters)
```tsx
import { FixedSizeList } from 'react-window';

// Render only visible verses
<FixedSizeList
  height={600}
  itemCount={verses.length}
  itemSize={100}
>
  {({ index, style }) => (
    <div style={style}>
      {renderVerse(verses[index])}
    </div>
  )}
</FixedSizeList>
```

## 🔗 Integration with Existing Pages

### Add to BiblePage.tsx

```tsx
import { BibleAudioTextSync } from '@/components/BibleAudioTextSync';
import { useState } from 'react';

const BiblePage = () => {
  const [audioMode, setAudioMode] = useState(false);
  
  return (
    <div>
      <button onClick={() => setAudioMode(!audioMode)}>
        {audioMode ? 'Text Mode' : 'Audio Sync Mode'}
      </button>
      
      {audioMode ? (
        <BibleAudioTextSync
          audioUrl={getAudioUrl(currentBook, currentChapter)}
          transcriptEn={alignmentEn}
          transcriptFa={alignmentFa}
          bookName={currentBook}
          chapter={currentChapter}
        />
      ) : (
        <StaticBibleText />
      )}
    </div>
  );
};
```

## 🌐 API Integration

### Backend Endpoint

```javascript
// backend/routes/bibleAudio.js
router.get('/alignment/:book/:chapter/:language', async (req, res) => {
  const { book, chapter, language } = req.params;
  
  const alignment = await db.query(
    'SELECT * FROM bible_alignments WHERE book = $1 AND chapter = $2 AND language = $3',
    [book, chapter, language]
  );
  
  res.json(alignment.rows[0].data);
});
```

### Frontend API Call

```tsx
const fetchAlignment = async (book: string, chapter: number, lang: 'en' | 'fa') => {
  const response = await fetch(`/api/bible/alignment/${book}/${chapter}/${lang}`);
  return response.json();
};
```

## 📚 Sample Data

Sample alignment files are provided in `public/data/`:
- `sample_alignment_en.json` - Ephesians 1:15-16 (English)
- `sample_alignment_fa.json` - Ephesians 1:15-16 (Persian)

## 🎓 Best Practices

1. **Audio Quality**: Use 16kHz mono audio for best performance
2. **File Naming**: Use consistent naming: `{book}_{chapter}_{language}.mp3`
3. **Alignment Storage**: Store alignment JSON in database for scalability
4. **Error Handling**: Always provide fallback for missing alignment data
5. **Accessibility**: Ensure keyboard navigation works (Space=play/pause, Arrow keys=seek)
6. **Testing**: Test with various audio lengths and verse counts
7. **Caching**: Cache alignment data in localStorage or IndexedDB

## 📞 Support

For issues or questions:
- Check demo page: `http://localhost:5173/#/bible/audio-sync-demo`
- Review source code: `hooks/useAudioTextSync.ts`, `components/BibleAudioTextSync.tsx`
- Run Python script with `--help`: `python scripts/bible_audio_aligner.py --help`

---

**Built with**: React 18, TypeScript, TailwindCSS, Web Audio API, OpenAI Whisper, Aeneas

**License**: MIT

**Version**: 1.0.0

**Last Updated**: January 2025
