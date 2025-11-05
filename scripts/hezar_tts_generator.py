#!/usr/bin/env python3
"""
Hezar TTS Generator for Bible Audio
====================================
Uses Hezar library to generate Persian TTS for Bible verses

Installation:
    pip install hezar scipy pydub

Usage:
    python hezar_tts_generator.py --book EPH --chapter 1
"""

import json
import os
import argparse
from pathlib import Path
import time

def load_bible_data(json_path):
    """Load Bible data from JSON file"""
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_verse_audio(text, output_path, model=None):
    """
    Generate audio for a verse using Hezar TTS
    
    Args:
        text: Verse text in Persian
        output_path: Path to save audio file
        model: Hezar TTS model (loaded once and reused)
    
    Returns:
        tuple: (success, duration, model)
    """
    try:
        # Import here to avoid loading if not needed
        from hezar.models import Model
        
        # Load model if not provided (first time)
        if model is None:
            print("📥 Loading Hezar TTS model...")
            model = Model.load("hezarai/fastspeech2-persian-tts")
            print("✅ Model loaded successfully")
        
        # Generate speech
        print(f"🔊 Generating audio for: {text[:50]}...")
        outputs = model.predict(text)
        
        # Save audio using scipy (compatible with Python 3.14)
        from scipy.io import wavfile
        import numpy as np
        
        # Ensure output is numpy array and correct type
        audio_data = np.array(outputs[0], dtype=np.float32)
        wavfile.write(output_path, 22050, audio_data)
        
        # Calculate duration
        duration = len(outputs[0]) / 22050
        
        print(f"✅ Audio saved: {output_path} ({duration:.2f}s)")
        return True, duration, model
        
    except Exception as e:
        print(f"❌ Error generating audio: {e}")
        return False, 0, model

def generate_chapter_audio(bible_data, book_code, chapter_num, output_dir):
    """
    Generate audio files for all verses in a chapter
    
    Args:
        bible_data: Bible data dictionary
        book_code: Book code (e.g., 'EPH')
        chapter_num: Chapter number
        output_dir: Directory to save audio files
    """
    try:
        # Get chapter data
        chapter_data = bible_data['bible_text']['118'][book_code][str(chapter_num)]
        verses_fa = chapter_data.get('fa', {})
        
        if not verses_fa:
            print(f"❌ No verses found for {book_code} chapter {chapter_num}")
            return
        
        print(f"\n📖 Generating audio for {book_code} Chapter {chapter_num}")
        print(f"   Total verses: {len(verses_fa)}")
        
        # Create output directory
        chapter_output_dir = Path(output_dir) / book_code
        chapter_output_dir.mkdir(parents=True, exist_ok=True)
        
        # Load model once
        model = None
        total_duration = 0
        successful = 0
        
        # Generate audio for each verse
        for verse_num, verse_text in sorted(verses_fa.items(), key=lambda x: int(x[0])):
            output_file = chapter_output_dir / f"{chapter_num}_verse_{verse_num}.mp3"
            
            # Skip if already exists
            if output_file.exists():
                print(f"⏭️  Skipping verse {verse_num} (already exists)")
                continue
            
            success, duration, model = generate_verse_audio(
                verse_text, 
                str(output_file),
                model
            )
            
            if success:
                successful += 1
                total_duration += duration
            
            # Small delay to avoid overloading
            time.sleep(0.1)
        
        print(f"\n✅ Generation complete!")
        print(f"   Successful: {successful}/{len(verses_fa)} verses")
        print(f"   Total duration: {total_duration:.2f} seconds ({total_duration/60:.2f} minutes)")
        print(f"   Output directory: {chapter_output_dir}")
        
        return successful, total_duration
        
    except Exception as e:
        print(f"❌ Error generating chapter audio: {e}")
        import traceback
        traceback.print_exc()
        return 0, 0

def combine_verse_audio(verse_audio_dir, output_file):
    """
    Combine individual verse audio files into a single chapter file
    
    Args:
        verse_audio_dir: Directory containing verse audio files
        output_file: Path to save combined audio
    """
    try:
        from pydub import AudioSegment
        
        print(f"\n🔗 Combining verse audio files...")
        
        # Get all verse audio files
        verse_files = sorted(
            Path(verse_audio_dir).glob("*_verse_*.mp3"),
            key=lambda x: int(x.stem.split('_verse_')[1])
        )
        
        if not verse_files:
            print("❌ No verse audio files found")
            return False
        
        # Combine audio files
        combined = AudioSegment.empty()
        for verse_file in verse_files:
            audio = AudioSegment.from_mp3(str(verse_file))
            combined += audio
            # Add small pause between verses (500ms)
            combined += AudioSegment.silent(duration=500)
        
        # Export combined audio
        combined.export(output_file, format="mp3", bitrate="128k")
        
        print(f"✅ Combined audio saved: {output_file}")
        print(f"   Duration: {len(combined)/1000:.2f} seconds")
        
        return True
        
    except Exception as e:
        print(f"❌ Error combining audio: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Generate Bible audio using Hezar TTS')
    parser.add_argument('--book', required=True, help='Book code (e.g., EPH)')
    parser.add_argument('--chapter', type=int, required=True, help='Chapter number')
    parser.add_argument('--bible-json', default='../public/bible_data.json', help='Path to bible_data.json')
    parser.add_argument('--output-dir', default='../public/audio/bible/hezar', help='Output directory')
    parser.add_argument('--combine', action='store_true', help='Combine verses into single file')
    
    args = parser.parse_args()
    
    # Load Bible data
    print(f"📚 Loading Bible data from {args.bible_json}...")
    bible_data = load_bible_data(args.bible_json)
    
    # Generate audio
    successful, duration = generate_chapter_audio(
        bible_data,
        args.book,
        args.chapter,
        args.output_dir
    )
    
    # Combine if requested
    if args.combine and successful > 0:
        verse_audio_dir = Path(args.output_dir) / args.book
        combined_file = Path(args.output_dir) / args.book / f"{args.chapter}.mp3"
        combine_verse_audio(verse_audio_dir, combined_file)

if __name__ == '__main__':
    main()
