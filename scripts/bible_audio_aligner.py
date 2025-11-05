#!/usr/bin/env python3
"""
Bible Audio Alignment Generator
Generates word-level timing data for Bible audio files using Whisper or forced alignment
"""

import os
import json
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional
import subprocess
import sys

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    print("⚠️  Whisper not installed. Install with: pip install openai-whisper")

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

class BibleAudioAligner:
    """
    Advanced audio alignment system for Bible verses
    Supports multiple alignment methods:
    1. Whisper with word timestamps
    2. Forced alignment with existing transcript
    3. Synthetic alignment (fallback)
    """
    
    def __init__(self, model_name: str = "base"):
        self.model_name = model_name
        self.model = None
        
        if WHISPER_AVAILABLE and TORCH_AVAILABLE:
            print(f"🔊 Loading Whisper model: {model_name}")
            self.model = whisper.load_model(model_name)
            print("✅ Whisper model loaded")
        else:
            print("⚠️  Whisper not available, using synthetic alignment")
    
    def align_with_whisper(
        self,
        audio_path: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Use Whisper to transcribe and get word-level timestamps
        """
        if not self.model:
            raise Exception("Whisper model not loaded")
        
        print(f"🎤 Transcribing: {audio_path}")
        
        result = self.model.transcribe(
            audio_path,
            language=language,
            word_timestamps=True,
            verbose=False
        )
        
        words = []
        word_index = 0
        
        for segment in result.get('segments', []):
            for word_data in segment.get('words', []):
                words.append({
                    'word': word_data['word'].strip(),
                    'start': word_data['start'],
                    'end': word_data['end'],
                    'index': word_index
                })
                word_index += 1
        
        return {
            'text': result.get('text', '').strip(),
            'words': words,
            'language': language,
            'method': 'whisper',
            'duration': result.get('segments', [{}])[-1].get('end', 0)
        }
    
    def align_with_transcript(
        self,
        audio_path: str,
        transcript: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Align existing transcript with audio using forced alignment
        (Requires aeneas or similar tool)
        """
        # Check if aeneas is available
        try:
            subprocess.run(['aeneas_tools', '--version'], capture_output=True, check=True)
            return self._align_with_aeneas(audio_path, transcript, language)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("⚠️  Aeneas not available, using synthetic alignment")
            return self._synthetic_alignment(transcript, language)
    
    def _align_with_aeneas(
        self,
        audio_path: str,
        transcript: str,
        language: str
    ) -> Dict[str, Any]:
        """
        Use Aeneas for forced alignment
        """
        import tempfile
        
        # Create temporary text file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(transcript)
            text_file = f.name
        
        # Create output JSON file
        output_file = tempfile.mktemp(suffix='.json')
        
        # Aeneas language mapping
        lang_map = {'en': 'eng', 'fa': 'fas'}
        aeneas_lang = lang_map.get(language, 'eng')
        
        # Run aeneas
        cmd = [
            'python', '-m', 'aeneas.tools.execute_task',
            audio_path,
            text_file,
            f'task_language={aeneas_lang}|is_text_type=plain|os_task_file_format=json',
            output_file
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            
            # Read alignment results
            with open(output_file, 'r', encoding='utf-8') as f:
                alignment = json.load(f)
            
            words = []
            word_index = 0
            
            for fragment in alignment.get('fragments', []):
                text = fragment.get('lines', [''])[0].strip()
                start = float(fragment.get('begin', 0))
                end = float(fragment.get('end', 0))
                
                # Split text into words
                for word in text.split():
                    words.append({
                        'word': word,
                        'start': start,
                        'end': end,
                        'index': word_index
                    })
                    word_index += 1
            
            return {
                'text': transcript,
                'words': words,
                'language': language,
                'method': 'aeneas',
                'duration': words[-1]['end'] if words else 0
            }
        
        finally:
            # Cleanup
            os.unlink(text_file)
            if os.path.exists(output_file):
                os.unlink(output_file)
    
    def _synthetic_alignment(
        self,
        transcript: str,
        language: str,
        estimated_duration: float = 60.0
    ) -> Dict[str, Any]:
        """
        Generate synthetic alignment based on word count
        (Fallback method when no other tool is available)
        """
        words_list = transcript.split()
        word_count = len(words_list)
        
        if word_count == 0:
            return {
                'text': transcript,
                'words': [],
                'language': language,
                'method': 'synthetic',
                'duration': 0
            }
        
        # Estimate timing (average speaking rate)
        # English: ~150 words/min, Persian: ~120 words/min
        wpm = 150 if language == 'en' else 120
        estimated_duration = (word_count / wpm) * 60
        
        time_per_word = estimated_duration / word_count
        
        words = []
        current_time = 0.0
        
        for idx, word in enumerate(words_list):
            # Add slight variation for realism
            word_duration = time_per_word * (0.8 + (idx % 3) * 0.2)
            
            words.append({
                'word': word,
                'start': round(current_time, 3),
                'end': round(current_time + word_duration, 3),
                'index': idx
            })
            
            current_time += word_duration
        
        return {
            'text': transcript,
            'words': words,
            'language': language,
            'method': 'synthetic',
            'duration': round(current_time, 3)
        }
    
    def align_bible_verse(
        self,
        audio_path: str,
        verse_text: str,
        verse_number: int,
        language: str = "en",
        use_whisper: bool = True
    ) -> Dict[str, Any]:
        """
        Align a single Bible verse
        """
        if use_whisper and self.model:
            alignment = self.align_with_whisper(audio_path, language)
        else:
            alignment = self.align_with_transcript(audio_path, verse_text, language)
        
        return {
            'verse': verse_number,
            'words': alignment['words'],
            'totalDuration': alignment['duration']
        }
    
    def align_bible_chapter(
        self,
        audio_dir: str,
        verses_data: List[Dict[str, Any]],
        language: str = "en",
        use_whisper: bool = True
    ) -> Dict[str, Any]:
        """
        Align entire Bible chapter
        """
        verses = []
        
        for verse_info in verses_data:
            verse_num = verse_info['verse']
            verse_text = verse_info['text']
            
            # Find audio file for this verse
            audio_patterns = [
                f"verse_{verse_num}.mp3",
                f"v{verse_num}.mp3",
                f"{verse_num:02d}.mp3",
            ]
            
            audio_path = None
            for pattern in audio_patterns:
                test_path = os.path.join(audio_dir, pattern)
                if os.path.exists(test_path):
                    audio_path = test_path
                    break
            
            if not audio_path:
                print(f"⚠️  Audio not found for verse {verse_num}, skipping")
                continue
            
            print(f"📖 Processing verse {verse_num}...")
            verse_alignment = self.align_bible_verse(
                audio_path,
                verse_text,
                verse_num,
                language,
                use_whisper
            )
            
            verses.append(verse_alignment)
        
        return {
            'verses': verses,
            'language': language
        }


def main():
    parser = argparse.ArgumentParser(description='Generate Bible audio alignment data')
    parser.add_argument('--audio', required=True, help='Audio file or directory')
    parser.add_argument('--text', required=True, help='Text file (JSON or plain text)')
    parser.add_argument('--output', required=True, help='Output JSON file')
    parser.add_argument('--language', default='en', choices=['en', 'fa'], help='Language code')
    parser.add_argument('--model', default='base', help='Whisper model size')
    parser.add_argument('--method', default='auto', choices=['auto', 'whisper', 'forced', 'synthetic'], help='Alignment method')
    parser.add_argument('--book', help='Book name')
    parser.add_argument('--chapter', type=int, help='Chapter number')
    
    args = parser.parse_args()
    
    # Initialize aligner
    aligner = BibleAudioAligner(model_name=args.model)
    
    # Load text data
    with open(args.text, 'r', encoding='utf-8') as f:
        if args.text.endswith('.json'):
            text_data = json.load(f)
        else:
            text_data = {'text': f.read(), 'verses': []}
    
    # Determine alignment method
    use_whisper = (args.method in ['auto', 'whisper']) and WHISPER_AVAILABLE
    
    # Process audio
    if os.path.isfile(args.audio):
        # Single file
        alignment = aligner.align_with_whisper(args.audio, args.language) if use_whisper else \
                    aligner.align_with_transcript(args.audio, text_data['text'], args.language)
        
        result = {
            'verses': [{
                'verse': 1,
                'words': alignment['words'],
                'totalDuration': alignment['duration']
            }],
            'language': args.language,
            'metadata': {
                'book': args.book or 'Unknown',
                'chapter': args.chapter or 1,
                'method': alignment.get('method', 'unknown')
            }
        }
    else:
        # Directory with multiple verses
        result = aligner.align_bible_chapter(
            args.audio,
            text_data.get('verses', []),
            args.language,
            use_whisper
        )
        
        result['metadata'] = {
            'book': args.book or 'Unknown',
            'chapter': args.chapter or 1,
            'totalVerses': len(result['verses'])
        }
    
    # Save output
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Alignment saved to: {args.output}")
    print(f"📊 Total verses: {len(result['verses'])}")
    print(f"🎯 Method: {result.get('metadata', {}).get('method', 'N/A')}")


if __name__ == '__main__':
    main()
