"""
Whisper-based Audio Timestamp Generator for Bible Chapters
Generates word-level timestamps for karaoke-style text highlighting

Requirements:
- Python 3.8+
- openai-whisper
- ffmpeg

Installation:
    pip install -U openai-whisper
    # On Windows: install ffmpeg via chocolatey or manually
"""

import whisper
import json
import os
from pathlib import Path
from typing import List, Dict, Any
import time

# Paths - relative to project root (parent of scripts/)
PROJECT_ROOT = Path(__file__).parent.parent
AUDIO_DIR = PROJECT_ROOT / "bible_data" / "audio"
TEXT_DIR = PROJECT_ROOT / "bible_data" / "text"
TIMESTAMPS_DIR = PROJECT_ROOT / "bible_data" / "timestamps"
PROGRESS_FILE = PROJECT_ROOT / "whisper_progress.json"

# Whisper model (options: tiny, base, small, medium, large-v3)
# medium = good balance of speed and accuracy for Persian
MODEL_SIZE = "medium"

def load_chapter_text(translation: str, book: str, chapter: int) -> Dict[str, Any]:
    """Load text JSON for a chapter"""
    text_file = TEXT_DIR / translation / book / f"{chapter}.json"
    
    if not text_file.exists():
        return None
    
    with open(text_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def transcribe_with_timestamps(audio_path: str, model) -> Dict[str, Any]:
    """
    Transcribe audio and extract word-level timestamps
    
    Returns:
    {
        'segments': [
            {
                'start': 0.0,
                'end': 2.5,
                'text': 'پیدایش فصل دوم',
                'words': [
                    {'word': 'پیدایش', 'start': 0.0, 'end': 0.8},
                    {'word': 'فصل', 'start': 1.0, 'end': 1.5},
                    {'word': 'دوم', 'start': 1.7, 'end': 2.3}
                ]
            }
        ]
    }
    """
    print(f"  >> Transcribing: {os.path.basename(audio_path)}")
    
    result = model.transcribe(
        audio_path,
        language="fa",  # Persian
        word_timestamps=True,
        verbose=False
    )
    
    return result

def match_transcription_to_verses(transcription: Dict, verses: List[Dict]) -> Dict[str, Any]:
    """
    Match Whisper transcription to known verse text
    
    Strategy:
    1. Detect intro (usually first segment with chapter title)
    2. Match remaining segments to verses by text similarity
    3. Extract word timestamps
    """
    
    segments = transcription.get('segments', [])
    
    # Detect intro (first segment, usually chapter title)
    intro = None
    verse_segments = segments
    
    if segments and len(segments) > 0:
        first_seg = segments[0]
        first_text = first_seg.get('text', '').strip()
        
        # Check if it's an intro (contains book/chapter reference)
        if any(keyword in first_text for keyword in ['فصل', 'باب', 'رسوم']):
            intro = {
                'text': first_text,
                'start': first_seg['start'],
                'end': first_seg['end'],
                'words': first_seg.get('words', [])
            }
            verse_segments = segments[1:]
    
    # Match segments to verses
    verse_timings = []
    
    for verse in verses:
        verse_num = verse['verse']
        verse_text = verse['text']
        
        # Find matching segment (simple approach: sequential matching)
        # For production, use fuzzy matching or alignment algorithm
        
        if verse_num - 1 < len(verse_segments):
            seg = verse_segments[verse_num - 1]
            
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

def generate_timestamps(translation: str, book: str, chapter: int, model) -> bool:
    """Generate timestamps for a single chapter"""
    
    # Load audio file
    audio_file = AUDIO_DIR / translation / book / f"{chapter}.mp3"
    if not audio_file.exists():
        print(f"  X Audio file not found: {audio_file}")
        return False
    
    # Load text
    text_data = load_chapter_text(translation, book, chapter)
    if not text_data:
        print(f"  X Text file not found")
        return False
    
    # Transcribe (IMPORTANT: convert Path to string for Whisper)
    transcription = transcribe_with_timestamps(str(audio_file), model)
    
    # Match to verses
    timestamps = match_transcription_to_verses(transcription, text_data['verses'])
    
    # Save timestamps
    output_dir = TIMESTAMPS_DIR / translation / book
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = output_dir / f"{chapter}.json"
    
    timestamp_data = {
        'translation': translation,
        'book': book,
        'chapter': chapter,
        'intro': timestamps['intro'],
        'verses': timestamps['verses']
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(timestamp_data, f, ensure_ascii=False, indent=2)
    
    print(f"  OK Saved timestamps: {output_file}")
    return True

def save_progress(current, total, success, failed, elapsed, remaining):
    """Save progress to JSON file for monitoring"""
    progress_data = {
        "current": current,
        "total": total,
        "percentage": round((current / total) * 100, 1),
        "success": success,
        "failed": failed,
        "elapsed_hours": round(elapsed / 3600, 2),
        "remaining_hours": round(remaining / 3600, 2),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress_data, f, indent=2)

def process_all_chapters():
    """Process all downloaded chapters"""
    
    print(">> Whisper Timestamp Generator")
    print("="*50)
    print(f"Model: {MODEL_SIZE}")
    print(f"Language: Persian (fa)")
    print("\n.. Loading Whisper model (this may take a while)...")
    
    # Load model once
    model = whisper.load_model(MODEL_SIZE)
    print("OK Model loaded!\n")
    
    # Find all audio files
    audio_files = []
    for translation_dir in AUDIO_DIR.iterdir():
        if not translation_dir.is_dir():
            continue
        
        translation = translation_dir.name
        
        for book_dir in translation_dir.iterdir():
            if not book_dir.is_dir():
                continue
            
            book = book_dir.name
            
            for audio_file in book_dir.glob("*.mp3"):
                chapter = int(audio_file.stem)
                audio_files.append((translation, book, chapter))
    
    total = len(audio_files)
    print(f"Found {total} chapters to process\n")
    
    # Process each
    stats = {'success': 0, 'failed': 0}
    start_time = time.time()
    
    for i, (translation, book, chapter) in enumerate(audio_files, 1):
        progress = (i / total) * 100
        print(f"\n{'='*60}")
        print(f"[{progress:.1f}%] Processing {i}/{total}: {translation}/{book}/{chapter}")
        print(f"{'='*60}")
        
        try:
            success = generate_timestamps(translation, book, chapter, model)
            if success:
                stats['success'] += 1
                print(f"  >> SUCCESS! ({stats['success']} successful so far)")
            else:
                stats['failed'] += 1
                print(f"  >> FAILED ({stats['failed']} failed so far)")
        except Exception as e:
            print(f"  X Error: {e}")
            stats['failed'] += 1
        
        # Progress update every 10 chapters + save to file
        if i % 10 == 0 or i == 1:
            elapsed = time.time() - start_time
            avg_time = elapsed / i if i > 0 else 0
            remaining = (total - i) * avg_time
            
            print(f"\n{'*'*60}")
            print(f"PROGRESS UPDATE: {i}/{total} ({progress:.1f}%)")
            print(f"  Time Elapsed: {elapsed/3600:.2f}h")
            print(f"  Estimated Remaining: {remaining/3600:.2f}h")
            print(f"  Success Rate: {stats['success']}/{i} ({100*stats['success']/i if i > 0 else 0:.1f}%)")
            print(f"  Failed: {stats['failed']}")
            print(f"{'*'*60}\n")
            
            # Save progress to file
            save_progress(i, total, stats['success'], stats['failed'], elapsed, remaining)
    
    # Final stats
    elapsed = time.time() - start_time
    print("\n" + "="*50)
    print("FINAL STATISTICS:")
    print(f"   Total: {total}")
    print(f"   Success: {stats['success']} OK")
    print(f"   Failed: {stats['failed']} FAIL")
    print(f"   Time: {elapsed/3600:.1f} hours")
    print("="*50)

if __name__ == "__main__":
    process_all_chapters()
