"""
Automatic Background Bible Audio Generator with Whisper Alignment
Generates audio files and word-level timing data automatically
Runs continuously in background with progress tracking
"""
import asyncio
import edge_tts
import os
import json
import time
from datetime import datetime
import sys

# Try to import whisper (optional)
try:
    import whisper
    import torch
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    # Use ASCII-safe message
    sys.stdout.reconfigure(encoding='utf-8')
    print("WARNING: Whisper not available - using synthetic timing")

class BackgroundBibleAudioGenerator:
    def __init__(self, output_dir='public/audio/bible/auto-generated'):
        self.output_dir = output_dir
        self.alignment_dir = 'public/data/alignments'
        self.progress_file = 'audio_generation_progress.json'
        self.log_file = 'audio_generation_log.txt'
        
        # Whisper model (load once)
        self.whisper_model = None
        if WHISPER_AVAILABLE:
            print("🔄 Loading Whisper model...")
            self.whisper_model = whisper.load_model("base")
            print("✅ Whisper model loaded")
        
        # Create directories
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(self.alignment_dir, exist_ok=True)
        
        # Load progress
        self.progress = self.load_progress()
        
    def load_progress(self):
        """Load generation progress from file"""
        if os.path.exists(self.progress_file):
            with open(self.progress_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            'last_book': None,
            'last_chapter': 0,
            'total_generated': 0,
            'started_at': None,
            'last_updated': None
        }
    
    def save_progress(self):
        """Save generation progress to file"""
        self.progress['last_updated'] = datetime.now().isoformat()
        with open(self.progress_file, 'w', encoding='utf-8') as f:
            json.dump(self.progress, f, indent=2, ensure_ascii=False)
    
    def log(self, message):
        """Log message to file and console"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_message = f"[{timestamp}] {message}"
        print(log_message)
        
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(log_message + '\n')
    
    def generate_synthetic_alignment(self, text, language='en'):
        """Generate synthetic word timing (fallback method)"""
        words = text.split()
        wpm = 150 if language == 'en' else 120  # words per minute
        estimated_duration = (len(words) / wpm) * 60
        time_per_word = estimated_duration / len(words)
        
        alignment = []
        current_time = 0.0
        
        for idx, word in enumerate(words):
            # Add slight variation
            word_duration = time_per_word * (0.8 + (idx % 3) * 0.2)
            alignment.append({
                'word': word,
                'start': round(current_time, 3),
                'end': round(current_time + word_duration, 3),
                'index': idx
            })
            current_time += word_duration
        
        return alignment
    
    def generate_whisper_alignment(self, audio_path, language='en'):
        """Generate alignment using Whisper"""
        if not self.whisper_model:
            return None
        
        try:
            result = self.whisper_model.transcribe(
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
            
            return words
        except Exception as e:
            self.log(f"❌ Whisper error: {e}")
            return None
    
    async def generate_audio_with_alignment(self, text, language, book, chapter, verse=None):
        """Generate audio file and alignment data"""
        # Determine voice - using more spiritual/clerical voices
        if language == 'en':
            voice = 'en-US-GuyNeural'  # Deep, authoritative male voice
        else:
            # Persian: Use male voice (FaridNeural) for more clerical/spiritual tone
            voice = 'fa-IR-FaridNeural'  # Male voice, better for religious content
        
        # Create filename
        if verse:
            filename = f"{book}_{chapter}_{verse}_{language}.mp3"
        else:
            filename = f"{book}_{chapter}_{language}.mp3"
        
        audio_path = os.path.join(self.output_dir, filename)
        
        # Skip if already exists
        if os.path.exists(audio_path):
            self.log(f"⏭️ Skipping {filename} (already exists)")
            return True
        
        try:
            # Generate audio
            self.log(f"🎵 Generating {filename}...")
            tts = edge_tts.Communicate(text, voice, rate='+0%')
            await tts.save(audio_path)
            self.log(f"✅ Audio saved: {filename}")
            
            # Generate alignment
            alignment = None
            method = 'synthetic'
            
            if WHISPER_AVAILABLE and self.whisper_model:
                self.log(f"🔍 Running Whisper alignment for {filename}...")
                alignment = self.generate_whisper_alignment(audio_path, language)
                if alignment:
                    method = 'whisper'
                    self.log(f"✅ Whisper alignment complete ({len(alignment)} words)")
            
            if not alignment:
                self.log(f"📊 Using synthetic alignment for {filename}...")
                alignment = self.generate_synthetic_alignment(text, language)
                method = 'synthetic'
            
            # Save alignment
            alignment_filename = filename.replace('.mp3', '_alignment.json')
            alignment_path = os.path.join(self.alignment_dir, alignment_filename)
            
            alignment_data = {
                'verses': [{
                    'verse': verse if verse else 1,
                    'words': alignment,
                    'totalDuration': alignment[-1]['end'] if alignment else 0
                }],
                'language': language,
                'metadata': {
                    'book': book,
                    'chapter': chapter,
                    'method': method,
                    'generatedAt': datetime.now().isoformat()
                }
            }
            
            with open(alignment_path, 'w', encoding='utf-8') as f:
                json.dump(alignment_data, f, indent=2, ensure_ascii=False)
            
            self.log(f"✅ Alignment saved: {alignment_filename}")
            
            # Update progress
            self.progress['total_generated'] += 1
            self.save_progress()
            
            return True
            
        except Exception as e:
            self.log(f"❌ Error generating {filename}: {e}")
            return False
    
    async def fetch_bible_text(self, book, chapter):
        """Fetch Bible text from backend API"""
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                url = f"http://localhost:3001/api/bible/content/{book}/{chapter}"
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data
                    else:
                        self.log(f"❌ API error for {book} {chapter}: {response.status}")
                        return None
        except Exception as e:
            self.log(f"❌ Failed to fetch {book} {chapter}: {e}")
            return None
    
    async def generate_chapter(self, book, chapter):
        """Generate audio for entire chapter"""
        self.log(f"\n{'='*60}")
        self.log(f"📖 Processing {book} Chapter {chapter}")
        self.log(f"{'='*60}")
        
        # Fetch text from API
        data = await self.fetch_bible_text(book, chapter)
        if not data:
            return False
        
        verses_en = data.get('verses', {}).get('en', [])
        verses_fa = data.get('verses', {}).get('fa', [])
        
        if not verses_en or not verses_fa:
            self.log(f"❌ No verses found for {book} {chapter}")
            return False
        
        # Combine all verses into single text
        text_en = ' '.join(verses_en)
        text_fa = ' '.join(verses_fa)
        
        # Generate English
        success_en = await self.generate_audio_with_alignment(
            text_en, 'en', book, chapter
        )
        
        # Small delay between requests
        await asyncio.sleep(0.5)
        
        # Generate Persian
        success_fa = await self.generate_audio_with_alignment(
            text_fa, 'fa', book, chapter
        )
        
        # Update progress
        if success_en and success_fa:
            self.progress['last_book'] = book
            self.progress['last_chapter'] = chapter
            self.save_progress()
            self.log(f"✅ Completed {book} {chapter}")
            return True
        else:
            self.log(f"⚠️ Partial success for {book} {chapter}")
            return False
    
    async def run_continuous(self, books_list):
        """Run continuous generation in background"""
        self.log("\n" + "="*60)
        self.log("🚀 Starting Automatic Bible Audio Generator")
        self.log("="*60)
        self.log(f"Output: {self.output_dir}")
        self.log(f"Alignments: {self.alignment_dir}")
        self.log(f"Whisper: {'✅ Enabled' if WHISPER_AVAILABLE else '❌ Disabled'}")
        self.log("="*60 + "\n")
        
        self.progress['started_at'] = datetime.now().isoformat()
        
        total_chapters = 0
        successful_chapters = 0
        
        for book_info in books_list:
            book = book_info['code']
            chapters = book_info['chapters']
            
            for chapter in range(1, chapters + 1):
                total_chapters += 1
                
                # Check if already processed
                if (self.progress['last_book'] == book and 
                    chapter <= self.progress['last_chapter']):
                    self.log(f"⏭️ Skipping {book} {chapter} (already processed)")
                    continue
                
                success = await self.generate_chapter(book, chapter)
                if success:
                    successful_chapters += 1
                
                # Delay between chapters (prevent rate limiting)
                await asyncio.sleep(1.0)
        
        # Final summary
        self.log("\n" + "="*60)
        self.log("🎉 Generation Complete!")
        self.log("="*60)
        self.log(f"Total Chapters: {total_chapters}")
        self.log(f"Successful: {successful_chapters}")
        self.log(f"Failed: {total_chapters - successful_chapters}")
        self.log(f"Output Directory: {self.output_dir}")
        self.log(f"Alignment Directory: {self.alignment_dir}")
        self.log("="*60 + "\n")

async def main():
    # Bible books list (Old Testament sample)
    books = [
        {'code': 'GEN', 'chapters': 50, 'name': 'Genesis'},
        {'code': 'EXO', 'chapters': 40, 'name': 'Exodus'},
        {'code': 'LEV', 'chapters': 27, 'name': 'Leviticus'},
        {'code': 'NUM', 'chapters': 36, 'name': 'Numbers'},
        {'code': 'DEU', 'chapters': 34, 'name': 'Deuteronomy'},
        # Add more books as needed
    ]
    
    generator = BackgroundBibleAudioGenerator()
    await generator.run_continuous(books)

if __name__ == '__main__':
    print("🎵 Bible Audio Generator - Background Mode")
    print("Press Ctrl+C to stop\n")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⏹️ Generator stopped by user")
        sys.exit(0)
