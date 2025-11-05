#!/usr/bin/env python3
"""
Edge TTS Generator for Bible Audio
===================================
Uses Microsoft Edge TTS to generate Persian audio for Bible verses

Installation:
    py -3.12 -m pip install edge-tts

Usage:
    py -3.12 edge_tts_generator.py --book EPH --chapter 1
    py -3.12 edge_tts_generator.py --book EPH --chapter 1 --combine
    py -3.12 edge_tts_generator.py --book EPH --chapter 1 --voice fa-IR-DilaraNeural
"""

import json
import os
import argparse
from pathlib import Path
import asyncio
import edge_tts

def load_bible_data(json_path):
    """Load Bible data from JSON file"""
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

async def generate_verse_audio(text, output_path, voice="fa-IR-FaridNeural"):
    """
    Generate audio for a verse using Edge TTS
    
    Args:
        text: Verse text in Persian
        output_path: Path to save audio file
        voice: Voice to use (fa-IR-FaridNeural or fa-IR-DilaraNeural)
    
    Returns:
        bool: Success status
    """
    try:
        # Create communicate object
        communicate = edge_tts.Communicate(text, voice)
        
        # Save audio
        await communicate.save(str(output_path))
        
        return True
        
    except Exception as e:
        print(f"❌ Error generating audio: {e}")
        return False

async def generate_chapter_audio(bible_data, book_code, chapter_num, output_dir, voice="fa-IR-FaridNeural"):
    """
    Generate audio files for all verses in a chapter
    
    Args:
        bible_data: Bible data dictionary
        book_code: Book code (e.g., 'EPH')
        chapter_num: Chapter number
        output_dir: Directory to save audio files
        voice: Voice to use
    """
    try:
        # Get chapter data
        chapter_data = bible_data['bible_text']['118'][book_code][str(chapter_num)]
        verses_fa = chapter_data.get('fa', {})
        
        if not verses_fa:
            print(f"❌ No verses found for {book_code} chapter {chapter_num}")
            return False
        
        # Create output directory
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"\n📖 {book_code} Chapter {chapter_num}")
        print(f"📊 Total verses: {len(verses_fa)}")
        print(f"🎤 Voice: {voice}")
        print(f"📁 Output: {output_dir}\n")
        
        # Generate audio for each verse
        total_duration = 0
        success_count = 0
        
        for verse_num, verse_text in verses_fa.items():
            output_file = output_dir / f"{verse_num}.mp3"
            
            # Skip if file exists
            if output_file.exists():
                print(f"⏭️  Verse {verse_num}: Already exists")
                success_count += 1
                continue
            
            print(f"🔊 Verse {verse_num}: {verse_text[:50]}...")
            
            success = await generate_verse_audio(verse_text, output_file, voice)
            
            if success:
                # Get file size instead of duration (no ffmpeg needed)
                try:
                    file_size = output_file.stat().st_size / 1024  # KB
                    print(f"✅ Verse {verse_num}: {file_size:.1f}KB")
                    success_count += 1
                except:
                    print(f"✅ Verse {verse_num}: Generated")
                    success_count += 1
            else:
                print(f"❌ Verse {verse_num}: Failed")
        
        print(f"\n📊 Summary:")
        print(f"   ✓ Generated: {success_count}/{len(verses_fa)} verses")
        
        return success_count > 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def list_voices():
    """List available Persian voices"""
    print("\n🎤 Available Persian voices:\n")
    voices = await edge_tts.list_voices()
    fa_voices = [v for v in voices if v['Locale'].startswith('fa')]
    
    for v in fa_voices:
        print(f"  • {v['ShortName']}")
        print(f"    Gender: {v['Gender']}")
        print(f"    Name: {v['FriendlyName']}")
        print()
    
    return fa_voices

async def main():
    parser = argparse.ArgumentParser(description='Generate Bible audio using Edge TTS')
    parser.add_argument('--book', help='Book code (e.g., EPH, GEN, MAT)')
    parser.add_argument('--chapter', type=int, help='Chapter number')
    parser.add_argument('--voice', default='fa-IR-FaridNeural',
                       help='Voice to use (fa-IR-FaridNeural or fa-IR-DilaraNeural)')
    parser.add_argument('--output-dir', default='../public/audio/bible/edge-tts',
                       help='Output directory for audio files')
    parser.add_argument('--combine', action='store_true',
                       help='Combine verses into single chapter file')
    parser.add_argument('--list-voices', action='store_true',
                       help='List available Persian voices')
    
    args = parser.parse_args()
    
    # List voices if requested
    if args.list_voices:
        await list_voices()
        return
    
    # Validate arguments
    if not args.book or not args.chapter:
        print("❌ Error: --book and --chapter are required")
        print("Usage: py -3.12 edge_tts_generator.py --book EPH --chapter 1")
        return
    
    # Load Bible data
    bible_json_path = Path(__file__).parent.parent / 'public' / 'bible_data.json'
    
    if not bible_json_path.exists():
        print(f"❌ Error: {bible_json_path} not found")
        return
    
    print("📚 Loading Bible data...")
    bible_data = load_bible_data(bible_json_path)
    
    # Set up output directory
    output_dir = Path(args.output_dir) / args.book / str(args.chapter)
    
    # Generate audio
    success = await generate_chapter_audio(
        bible_data,
        args.book,
        args.chapter,
        output_dir,
        args.voice
    )
    
    if not success:
        print("\n❌ Failed to generate audio")
        return
    
    # Note: Combining requires ffmpeg (not included)
    if args.combine:
        print("\n⚠️  Combining requires ffmpeg to be installed")
        print("   Install ffmpeg from: https://ffmpeg.org/")
        print("   Or use verses individually")
    
    print("\n✅ Done!")

if __name__ == '__main__':
    asyncio.run(main())
