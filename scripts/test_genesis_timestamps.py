"""
Test Whisper Timestamp Generation for Genesis Chapter 1
Quick test script to verify the pipeline works before running full batch
"""

import whisper
import json
import os
from pathlib import Path
import time

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
AUDIO_DIR = PROJECT_ROOT / "bible_data" / "audio"
TEXT_DIR = PROJECT_ROOT / "bible_data" / "text"
TIMESTAMPS_DIR = PROJECT_ROOT / "bible_data" / "timestamps"

# Test parameters
TRANSLATION = "TPV"
BOOK = "GEN"
CHAPTER = 1
MODEL_SIZE = "medium"  # Using medium for faster test (can upgrade to large-v3 later)

def load_chapter_text(translation: str, book: str, chapter: int):
    """Load text JSON for a chapter"""
    text_file = TEXT_DIR / translation / book / f"{chapter}.json"
    
    if not text_file.exists():
        print(f"❌ Text file not found: {text_file}")
        return None
    
    with open(text_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def transcribe_with_timestamps(audio_path: str, model):
    """Transcribe audio and extract word-level timestamps"""
    print(f"  🎤 Transcribing: {os.path.basename(audio_path)}")
    
    result = model.transcribe(
        audio_path,
        language="fa",  # Persian
        word_timestamps=True,
        verbose=False
    )
    
    return result

def match_transcription_to_verses(transcription: dict, verses: list):
    """Match Whisper transcription to known verse text"""
    
    segments = transcription.get('segments', [])
    
    # Detect intro (first segment, usually chapter title)
    intro = None
    verse_segments = segments
    
    if segments and len(segments) > 0:
        first_seg = segments[0]
        first_text = first_seg.get('text', '').strip()
        
        # Check if it's an intro (contains book/chapter reference)
        if any(keyword in first_text for keyword in ['فصل', 'باب', 'رسوم', 'پیدایش']):
            intro = {
                'text': first_text,
                'start': first_seg['start'],
                'end': first_seg['end'],
                'words': first_seg.get('words', [])
            }
            verse_segments = segments[1:]
    
    # Match segments to verses
    verse_timings = []
    
    for i, verse in enumerate(verses):
        verse_num = verse['verse']
        verse_text = verse['text']
        
        # Simple sequential matching
        if i < len(verse_segments):
            seg = verse_segments[i]
            
            verse_timings.append({
                'verse': verse_num,
                'start': seg['start'],
                'end': seg['end'],
                'text': verse_text,
                'words': seg.get('words', [])
            })
    
    return {
        'intro': intro,
        'verses': verse_timings
    }

def test_genesis_1():
    """Test timestamp generation for Genesis Chapter 1"""
    
    print("\n" + "="*60)
    print("🧪 WHISPER TIMESTAMP TEST - GENESIS 1")
    print("="*60)
    
    # Check audio file
    audio_file = AUDIO_DIR / TRANSLATION / BOOK / f"{CHAPTER}.mp3"
    if not audio_file.exists():
        print(f"❌ Audio file not found: {audio_file}")
        return False
    
    print(f"✅ Audio file found: {audio_file}")
    print(f"   Size: {audio_file.stat().st_size / 1024:.1f} KB")
    
    # Load text
    text_data = load_chapter_text(TRANSLATION, BOOK, CHAPTER)
    if not text_data:
        return False
    
    print(f"✅ Text file loaded: {len(text_data['verses'])} verses")
    
    # Load Whisper model
    print(f"\n⏳ Loading Whisper model: {MODEL_SIZE}")
    start_load = time.time()
    model = whisper.load_model(MODEL_SIZE)
    load_time = time.time() - start_load
    print(f"✅ Model loaded in {load_time:.1f} seconds")
    
    # Transcribe
    print(f"\n⏳ Transcribing audio (this may take 1-2 minutes)...")
    start_transcribe = time.time()
    transcription = transcribe_with_timestamps(str(audio_file), model)
    transcribe_time = time.time() - start_transcribe
    print(f"✅ Transcription complete in {transcribe_time:.1f} seconds")
    print(f"   Detected {len(transcription.get('segments', []))} segments")
    
    # Match to verses
    print(f"\n⏳ Matching transcription to verses...")
    timestamps = match_transcription_to_verses(transcription, text_data['verses'])
    
    # Save output
    output_dir = TIMESTAMPS_DIR / TRANSLATION / BOOK
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = output_dir / f"{CHAPTER}.json"
    
    timestamp_data = {
        'translation': TRANSLATION,
        'book': BOOK,
        'chapter': CHAPTER,
        'model': MODEL_SIZE,
        'intro': timestamps['intro'],
        'verses': timestamps['verses'],
        'metadata': {
            'generated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'transcribe_time_seconds': round(transcribe_time, 2),
            'total_segments': len(transcription.get('segments', [])),
            'total_verses': len(timestamps['verses'])
        }
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(timestamp_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Timestamps saved: {output_file}")
    
    # Show sample output
    print("\n" + "="*60)
    print("📊 SAMPLE OUTPUT")
    print("="*60)
    
    if timestamps['intro']:
        print(f"\n🎬 Intro: {timestamps['intro']['text']}")
        print(f"   Time: {timestamps['intro']['start']:.2f}s - {timestamps['intro']['end']:.2f}s")
        print(f"   Words: {len(timestamps['intro'].get('words', []))}")
    
    print(f"\n📖 First 3 Verses:")
    for v in timestamps['verses'][:3]:
        print(f"\n   Verse {v['verse']}: {v['text'][:50]}...")
        print(f"   Time: {v['start']:.2f}s - {v['end']:.2f}s")
        print(f"   Words: {len(v.get('words', []))}")
        if v.get('words'):
            print(f"   Sample words: {v['words'][:3]}")
    
    print("\n" + "="*60)
    print("✅ TEST COMPLETE!")
    print("="*60)
    print(f"Total time: {time.time() - start_load:.1f} seconds")
    print(f"\nOutput file: {output_file}")
    
    return True

if __name__ == "__main__":
    success = test_genesis_1()
    exit(0 if success else 1)
