"""
Convert YouVersion Bible Audio Data to Audio-Text Sync System
=============================================================
Converts extracted YouVersion audio links and text to the format needed for
BibleAudioTextSync component with precise word-level timing.

Features:
- Extracts audio URLs from bible_data.json
- Matches text verses with audio timing
- Creates word-level alignment data
- Generates timing files for each chapter
- Supports both English and Persian
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

# Configuration
CONFIG = {
    "input_json": "output/bible_complete/bible_data.json",
    "output_dir": "public/audio/bible/youversion",
    "alignments_dir": "public/data/alignments/youversion",
    "log_file": "output/youversion_conversion.log"
}

class YouVersionAudioConverter:
    def __init__(self):
        self.data = None
        self.log_messages = []
        self.stats = {
            "chapters_processed": 0,
            "audio_files_created": 0,
            "alignment_files_created": 0,
            "errors": 0
        }
        
    def log(self, message: str):
        """Log message with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        self.log_messages.append(log_entry)
        print(log_entry)
        
    def load_data(self):
        """Load extracted Bible data"""
        try:
            with open(CONFIG["input_json"], 'r', encoding='utf-8') as f:
                self.data = json.load(f)
            self.log(f"✅ Loaded data: {self.data['metadata']['stats']['audio_files_found']} audio files")
            return True
        except Exception as e:
            self.log(f"❌ Error loading data: {e}")
            return False
            
    def create_output_directories(self):
        """Create output directories"""
        os.makedirs(CONFIG["output_dir"], exist_ok=True)
        os.makedirs(CONFIG["alignments_dir"], exist_ok=True)
        os.makedirs(os.path.dirname(CONFIG["log_file"]), exist_ok=True)
        self.log("✅ Output directories created")
        
    def split_into_words(self, text: str, language: str = 'fa') -> List[str]:
        """
        Split text into words intelligently based on language
        """
        if not text or text.strip() == '':
            return []
            
        # Clean text
        text = text.strip()
        
        if language == 'fa':
            # Persian: split by spaces and remove punctuation markers
            # Keep Persian characters and numbers
            words = []
            for word in text.split():
                # Remove punctuation but keep the word
                clean_word = re.sub(r'[^\w\u0600-\u06FF\s]', '', word)
                if clean_word:
                    words.append(clean_word)
            return words
        else:
            # English: split by spaces and punctuation
            words = re.findall(r'\b\w+\b', text)
            return words
            
    def estimate_word_timing(self, words: List[str], total_duration: float) -> List[Dict]:
        """
        Estimate timing for each word based on total duration
        This is a simple estimation - real timing would come from audio analysis
        """
        if not words or total_duration <= 0:
            return []
            
        # Calculate average time per word
        time_per_word = total_duration / len(words)
        
        word_timings = []
        current_time = 0.0
        
        for index, word in enumerate(words):
            # Adjust timing based on word length
            # Longer words get slightly more time
            word_length_factor = len(word) / 5.0  # Normalize by average word length
            word_duration = time_per_word * (0.8 + 0.4 * word_length_factor)
            
            word_timings.append({
                "word": word,
                "start": round(current_time, 3),
                "end": round(current_time + word_duration, 3),
                "index": index
            })
            
            current_time += word_duration
            
        return word_timings
        
    def process_chapter(self, book_code: str, chapter: int, version_id: str = "118"):
        """
        Process a single chapter and create alignment data
        """
        try:
            # Get audio files for this chapter
            if version_id not in self.data["audio_files"]:
                self.log(f"⚠️  Version {version_id} not found in audio_files")
                return False
                
            audio_data = self.data["audio_files"][version_id]
            
            if book_code not in audio_data:
                self.log(f"⚠️  Book {book_code} not found in audio data")
                return False
                
            book_audio = audio_data[book_code]
            chapter_str = str(chapter)
            
            if chapter_str not in book_audio:
                self.log(f"⚠️  Chapter {chapter} not found in {book_code}")
                return False
                
            chapter_audio_list = book_audio[chapter_str]
            
            # Get text verses for this chapter
            if version_id not in self.data["bible_text"]:
                self.log(f"⚠️  Version {version_id} not found in bible_text")
                return False
                
            text_data = self.data["bible_text"][version_id]
            
            if book_code not in text_data:
                self.log(f"⚠️  Book {book_code} not found in text data")
                return False
                
            book_text = text_data[book_code]
            
            if chapter_str not in book_text:
                self.log(f"⚠️  Chapter {chapter} not found in {book_code} text")
                return False
                
            chapter_verses = book_text[chapter_str]
            
            # Check if verses is a dict (with 'fa' and 'en' keys) or list
            if isinstance(chapter_verses, dict):
                # Extract Persian verses
                verses_fa = chapter_verses.get('fa', {})
                verses_en = chapter_verses.get('en', {})
            else:
                # Fallback to list format
                verses_fa = {str(i+1): v for i, v in enumerate(chapter_verses)}
                verses_en = {}
            
            # Process each audio version (English and Persian)
            for audio_info in chapter_audio_list:
                # Determine language from version
                # Version 42 = English, 1533 = Persian
                lang = 'en' if 'New Millenium' in audio_info.get('title', '') else 'fa'
                
                # Get audio URL
                download_urls = audio_info.get('download_urls', {})
                audio_url = download_urls.get('format_mp3_32k', '')
                
                if not audio_url:
                    self.log(f"⚠️  No audio URL for {book_code} {chapter} ({lang})")
                    continue
                    
                # Add https: protocol if missing
                if audio_url.startswith('//'):
                    audio_url = 'https:' + audio_url
                    
                # Create verse timings
                verses_data = []
                
                # Select verses based on language
                verses_to_process = verses_fa if lang == 'fa' else (verses_en if verses_en else verses_fa)
                
                # Estimate total duration (we don't have actual duration from data)
                # Average: 3 minutes per chapter, adjust based on verse count
                estimated_duration = len(verses_to_process) * 10.0  # 10 seconds per verse average
                
                current_time = 0.0
                
                for verse_num_str, verse_text in sorted(verses_to_process.items(), key=lambda x: int(x[0])):
                    verse_num = int(verse_num_str)
                    if not verse_text or verse_text.strip() == '':
                        continue
                        
                    # Split verse into words
                    words = self.split_into_words(verse_text, lang)
                    
                    if not words:
                        continue
                        
                    # Estimate verse duration based on word count
                    verse_duration = len(words) * 0.4  # 0.4 seconds per word average
                    
                    # Create word timings for this verse
                    word_timings = self.estimate_word_timing(words, verse_duration)
                    
                    # Adjust timings to be relative to chapter start
                    for word_timing in word_timings:
                        word_timing['start'] += current_time
                        word_timing['end'] += current_time
                        
                    verses_data.append({
                        "verse": verse_num,
                        "words": word_timings,
                        "totalDuration": round(verse_duration, 3)
                    })
                    
                    current_time += verse_duration
                    
                # Create alignment data structure
                alignment_data = {
                    "verses": verses_data,
                    "language": lang,
                    "metadata": {
                        "book": book_code,
                        "chapter": chapter,
                        "version_id": audio_info.get('version_id'),
                        "title": audio_info.get('title'),
                        "audio_url": audio_url,
                        "method": "estimated",  # Since we're estimating, not using Whisper
                        "total_duration": round(current_time, 3),
                        "word_count": sum(len(v['words']) for v in verses_data),
                        "generatedAt": datetime.now().isoformat()
                    }
                }
                
                # Save alignment file
                alignment_filename = f"{book_code}_{chapter}_{lang}_alignment.json"
                alignment_path = os.path.join(CONFIG["alignments_dir"], alignment_filename)
                
                with open(alignment_path, 'w', encoding='utf-8') as f:
                    json.dump(alignment_data, f, ensure_ascii=False, indent=2)
                    
                self.stats["alignment_files_created"] += 1
                self.log(f"✅ Created: {alignment_filename} ({len(verses_data)} verses, {alignment_data['metadata']['word_count']} words)")
                
                # Save audio URL mapping
                audio_mapping_file = os.path.join(CONFIG["output_dir"], f"{book_code}_{chapter}_{lang}_url.json")
                with open(audio_mapping_file, 'w', encoding='utf-8') as f:
                    json.dump({
                        "book": book_code,
                        "chapter": chapter,
                        "language": lang,
                        "audio_url": audio_url,
                        "alignment_file": alignment_filename
                    }, f, ensure_ascii=False, indent=2)
                    
                self.stats["audio_files_created"] += 1
                
            self.stats["chapters_processed"] += 1
            return True
            
        except Exception as e:
            self.log(f"❌ Error processing {book_code} {chapter}: {e}")
            self.stats["errors"] += 1
            return False
            
    def process_all_books(self, book_codes: Optional[List[str]] = None):
        """
        Process all books and chapters
        """
        if not book_codes:
            # Process all books found in audio data
            version_id = "118"  # Persian version
            if version_id in self.data["audio_files"]:
                book_codes = list(self.data["audio_files"][version_id].keys())
            else:
                self.log("❌ No books found in audio data")
                return
                
        self.log(f"📚 Processing {len(book_codes)} books...")
        
        for book_code in book_codes:
            # Get number of chapters for this book
            version_id = "118"
            if version_id in self.data["audio_files"] and book_code in self.data["audio_files"][version_id]:
                chapters = self.data["audio_files"][version_id][book_code]
                
                self.log(f"\n📖 Processing {book_code} ({len(chapters)} chapters)...")
                
                for chapter_num in sorted([int(c) for c in chapters.keys()]):
                    self.process_chapter(book_code, chapter_num, version_id)
                    
        self.log("\n" + "="*60)
        self.log("✅ Conversion Complete!")
        self.log(f"📊 Stats:")
        self.log(f"   Chapters processed: {self.stats['chapters_processed']}")
        self.log(f"   Audio mappings created: {self.stats['audio_files_created']}")
        self.log(f"   Alignment files created: {self.stats['alignment_files_created']}")
        self.log(f"   Errors: {self.stats['errors']}")
        
    def save_log(self):
        """Save log to file"""
        with open(CONFIG["log_file"], 'w', encoding='utf-8') as f:
            f.write('\n'.join(self.log_messages))
        print(f"\n💾 Log saved to: {CONFIG['log_file']}")

def main():
    """Main execution"""
    print("\n" + "="*60)
    print("📖 YouVersion Audio to Audio-Text Sync Converter")
    print("="*60 + "\n")
    
    converter = YouVersionAudioConverter()
    
    # Load data
    if not converter.load_data():
        print("❌ Failed to load data")
        return
        
    # Create directories
    converter.create_output_directories()
    
    # Process first few books for testing
    test_books = ["MAT", "MRK", "LUK", "JHN"]  # Start with Gospels
    
    print(f"\n🔬 Processing test books: {', '.join(test_books)}")
    print("Press Enter to continue or Ctrl+C to cancel...")
    input()
    
    # Process books
    converter.process_all_books(test_books)
    
    # Save log
    converter.save_log()
    
    print("\n✅ Done! Check output directories:")
    print(f"   Audio URLs: {CONFIG['output_dir']}")
    print(f"   Alignments: {CONFIG['alignments_dir']}")

if __name__ == "__main__":
    main()
