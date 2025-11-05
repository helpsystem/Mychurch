#!/usr/bin/env python3
"""
Generate timing data for Bible chapters
Creates word-level timing based on verse duration estimates
"""

import json
import re
from pathlib import Path

def calculate_word_timings(verses, total_duration=None):
    """
    Calculate approximate word timings based on verse length
    
    Args:
        verses: Dictionary of verse number -> verse text
        total_duration: Total audio duration in seconds (if known)
    
    Returns:
        Dictionary with timing data
    """
    # Count total words
    all_words = []
    verse_word_counts = {}
    
    for verse_num, verse_text in verses.items():
        # Split into words (handle Persian text)
        words = verse_text.split()
        verse_word_counts[verse_num] = len(words)
        
        for word in words:
            all_words.append({
                'word': word,
                'verse': verse_num
            })
    
    total_words = len(all_words)
    
    # Estimate duration if not provided (average Persian speech: 2-3 words/second)
    if total_duration is None:
        words_per_second = 2.5
        total_duration = total_words / words_per_second
    
    # Calculate time per word
    time_per_word = total_duration / total_words if total_words > 0 else 0
    
    # Generate word timings
    word_timings = []
    current_time = 0.0
    
    for word_data in all_words:
        # Add slight pause between verses (0.5 seconds)
        if len(word_timings) > 0 and word_data['verse'] != word_timings[-1]['verse']:
            current_time += 0.5
        
        word_start = current_time
        word_end = current_time + time_per_word
        
        word_timings.append({
            'word': word_data['word'],
            'verse': word_data['verse'],
            'start': round(word_start, 2),
            'end': round(word_end, 2)
        })
        
        current_time = word_end
    
    # Generate verse timings
    verse_timings = []
    current_verse = None
    verse_start = 0.0
    
    for i, word in enumerate(word_timings):
        if word['verse'] != current_verse:
            if current_verse is not None:
                verse_timings.append({
                    'number': int(current_verse),
                    'start': verse_start,
                    'end': word_timings[i-1]['end']
                })
            current_verse = word['verse']
            verse_start = word['start']
    
    # Add last verse
    if current_verse is not None and word_timings:
        verse_timings.append({
            'number': int(current_verse),
            'start': verse_start,
            'end': word_timings[-1]['end']
        })
    
    return {
        'words': word_timings,
        'verses': verse_timings,
        'metadata': {
            'total_words': total_words,
            'total_verses': len(verses),
            'estimated_duration': round(current_time, 2)
        }
    }


def generate_timing_for_chapter(bible_data, version_id, book_code, chapter_num):
    """
    Generate timing data for a specific chapter
    
    Args:
        bible_data: Full Bible data dictionary
        version_id: Bible version ID (e.g., '118')
        book_code: Book code (e.g., 'JHN')
        chapter_num: Chapter number
    
    Returns:
        Timing data dictionary or None if not found
    """
    try:
        # Get verses
        verses = bible_data['bible_text'][version_id][book_code][str(chapter_num)]['fa']
        
        # Get audio info if available
        audio_info = bible_data.get('audio_files', {}).get(version_id, {}).get(book_code, {}).get(str(chapter_num))
        
        # Get duration from audio metadata if available
        total_duration = None
        if audio_info and len(audio_info) > 0:
            # We don't have duration in the data, estimate it
            total_duration = None
        
        # Calculate timings
        timing_data = calculate_word_timings(verses, total_duration)
        
        # Add chapter info
        timing_data['chapter_info'] = {
            'version': version_id,
            'book': book_code,
            'chapter': int(chapter_num)
        }
        
        return timing_data
        
    except (KeyError, TypeError) as e:
        print(f"❌ Error generating timing for {book_code} {chapter_num}: {e}")
        return None


def generate_all_timings(bible_data_path, output_dir):
    """
    Generate timing files for all chapters
    
    Args:
        bible_data_path: Path to bible_data.json
        output_dir: Directory to save timing files
    """
    # Load Bible data
    print("📖 Loading Bible data...")
    with open(bible_data_path, 'r', encoding='utf-8') as f:
        bible_data = json.load(f)
    
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    version_id = '118'  # New Millennium Version
    
    # Get all books and chapters
    bible_text = bible_data.get('bible_text', {}).get(version_id, {})
    
    total_chapters = 0
    generated = 0
    
    print(f"\n🔄 Generating timing files...")
    
    for book_code, chapters in bible_text.items():
        for chapter_num in chapters.keys():
            total_chapters += 1
            
            # Generate timing
            timing_data = generate_timing_for_chapter(
                bible_data, version_id, book_code, chapter_num
            )
            
            if timing_data:
                # Save to file
                filename = f"bible_{book_code}_{chapter_num}_timing.json"
                output_file = output_path / filename
                
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(timing_data, f, ensure_ascii=False, indent=2)
                
                generated += 1
                
                if generated % 100 == 0:
                    print(f"  ✅ Generated {generated}/{total_chapters} files...")
    
    print(f"\n✅ Complete!")
    print(f"📊 Generated {generated} timing files")
    print(f"📁 Saved to: {output_path}")


def generate_single_timing(bible_data_path, book_code, chapter_num, output_file=None):
    """
    Generate timing for a single chapter (for testing)
    
    Args:
        bible_data_path: Path to bible_data.json
        book_code: Book code (e.g., 'JHN')
        chapter_num: Chapter number
        output_file: Output file path (optional)
    """
    # Load Bible data
    print(f"📖 Loading Bible data...")
    with open(bible_data_path, 'r', encoding='utf-8') as f:
        bible_data = json.load(f)
    
    # Generate timing
    print(f"🔄 Generating timing for {book_code} {chapter_num}...")
    timing_data = generate_timing_for_chapter(
        bible_data, '118', book_code, str(chapter_num)
    )
    
    if timing_data:
        if output_file:
            # Save to file
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(timing_data, f, ensure_ascii=False, indent=2)
            print(f"✅ Saved to: {output_file}")
        
        # Print summary
        print(f"\n📊 Summary:")
        print(f"  📝 Total words: {timing_data['metadata']['total_words']}")
        print(f"  📄 Total verses: {timing_data['metadata']['total_verses']}")
        print(f"  ⏱️  Estimated duration: {timing_data['metadata']['estimated_duration']:.1f} seconds")
        print(f"\n🎯 First 5 words with timing:")
        for word in timing_data['words'][:5]:
            print(f"  {word['start']:.2f}s - {word['end']:.2f}s: {word['word']} (verse {word['verse']})")
        
        return timing_data
    else:
        print("❌ Failed to generate timing")
        return None


if __name__ == '__main__':
    import sys
    
    bible_data_path = 'output/bible_complete/bible_data.json'
    
    if len(sys.argv) > 1:
        if sys.argv[1] == 'all':
            # Generate all timing files
            output_dir = 'public/bible-timings'
            generate_all_timings(bible_data_path, output_dir)
        else:
            # Generate single chapter for testing
            book = sys.argv[1] if len(sys.argv) > 1 else 'JHN'
            chapter = sys.argv[2] if len(sys.argv) > 2 else '1'
            output = f'public/bible-timings/bible_{book}_{chapter}_timing.json'
            
            generate_single_timing(bible_data_path, book, chapter, output)
    else:
        # Default: Generate John 1 for testing
        print("📖 Default: Generating timing for John 1")
        print("Usage:")
        print("  python generate-bible-timing.py JHN 1        # Single chapter")
        print("  python generate-bible-timing.py all          # All chapters")
        print()
        
        generate_single_timing(bible_data_path, 'JHN', '1', 
                             'public/bible-timings/bible_JHN_1_timing.json')
