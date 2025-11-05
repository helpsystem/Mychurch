"""
Complete Bible Extractor (Audio + Text + Versions)
==================================================
Extracts Bible audio files, text verses, and version information from bible.com archive.

Features:
- Audio file links extraction
- Text verses from multiple translations
- Version metadata (names, languages, etc.)
- Organized output structure
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
from datetime import datetime

# Configuration
CONFIG = {
    "base_dir": r"C:\Users\SamYar\Desktop\Bible\www.bible.com",
    "output_dir": "output/bible_complete",
    "output_json": "output/bible_complete/bible_data.json",
    "log_file": "output/bible_complete/extraction_log.txt"
}

# Bible books mapping
BIBLE_BOOKS = {
    # Old Testament
    "GEN": {"en": "Genesis", "fa": "پیدایش", "chapters": 50, "testament": "OT"},
    "EXO": {"en": "Exodus", "fa": "خروج", "chapters": 40, "testament": "OT"},
    "LEV": {"en": "Leviticus", "fa": "لاویان", "chapters": 27, "testament": "OT"},
    "NUM": {"en": "Numbers", "fa": "اعداد", "chapters": 36, "testament": "OT"},
    "DEU": {"en": "Deuteronomy", "fa": "تثنیه", "chapters": 34, "testament": "OT"},
    "JOS": {"en": "Joshua", "fa": "یوشع", "chapters": 24, "testament": "OT"},
    "JDG": {"en": "Judges", "fa": "داوران", "chapters": 21, "testament": "OT"},
    "RUT": {"en": "Ruth", "fa": "روت", "chapters": 4, "testament": "OT"},
    "1SA": {"en": "1 Samuel", "fa": "اول سموئیل", "chapters": 31, "testament": "OT"},
    "2SA": {"en": "2 Samuel", "fa": "دوم سموئیل", "chapters": 24, "testament": "OT"},
    "1KI": {"en": "1 Kings", "fa": "اول پادشاهان", "chapters": 22, "testament": "OT"},
    "2KI": {"en": "2 Kings", "fa": "دوم پادشاهان", "chapters": 25, "testament": "OT"},
    "1CH": {"en": "1 Chronicles", "fa": "اول تواریخ", "chapters": 29, "testament": "OT"},
    "2CH": {"en": "2 Chronicles", "fa": "دوم تواریخ", "chapters": 36, "testament": "OT"},
    "EZR": {"en": "Ezra", "fa": "عزرا", "chapters": 10, "testament": "OT"},
    "NEH": {"en": "Nehemiah", "fa": "نحمیا", "chapters": 13, "testament": "OT"},
    "EST": {"en": "Esther", "fa": "استر", "chapters": 10, "testament": "OT"},
    "JOB": {"en": "Job", "fa": "ایوب", "chapters": 42, "testament": "OT"},
    "PSA": {"en": "Psalms", "fa": "مزامیر", "chapters": 150, "testament": "OT"},
    "PRO": {"en": "Proverbs", "fa": "امثال", "chapters": 31, "testament": "OT"},
    "ECC": {"en": "Ecclesiastes", "fa": "جامعه", "chapters": 12, "testament": "OT"},
    "SNG": {"en": "Song of Solomon", "fa": "غزل غزلها", "chapters": 8, "testament": "OT"},
    "ISA": {"en": "Isaiah", "fa": "اشعیا", "chapters": 66, "testament": "OT"},
    "JER": {"en": "Jeremiah", "fa": "ارمیا", "chapters": 52, "testament": "OT"},
    "LAM": {"en": "Lamentations", "fa": "مراثی", "chapters": 5, "testament": "OT"},
    "EZK": {"en": "Ezekiel", "fa": "حزقیال", "chapters": 48, "testament": "OT"},
    "DAN": {"en": "Daniel", "fa": "دانیال", "chapters": 12, "testament": "OT"},
    "HOS": {"en": "Hosea", "fa": "هوشع", "chapters": 14, "testament": "OT"},
    "JOL": {"en": "Joel", "fa": "یوئیل", "chapters": 3, "testament": "OT"},
    "AMO": {"en": "Amos", "fa": "عاموس", "chapters": 9, "testament": "OT"},
    "OBA": {"en": "Obadiah", "fa": "عوبدیا", "chapters": 1, "testament": "OT"},
    "JON": {"en": "Jonah", "fa": "یونس", "chapters": 4, "testament": "OT"},
    "MIC": {"en": "Micah", "fa": "میکاه", "chapters": 7, "testament": "OT"},
    "NAM": {"en": "Nahum", "fa": "ناحوم", "chapters": 3, "testament": "OT"},
    "HAB": {"en": "Habakkuk", "fa": "حبقوق", "chapters": 3, "testament": "OT"},
    "ZEP": {"en": "Zephaniah", "fa": "صفنیا", "chapters": 3, "testament": "OT"},
    "HAG": {"en": "Haggai", "fa": "حجی", "chapters": 2, "testament": "OT"},
    "ZEC": {"en": "Zechariah", "fa": "زکریا", "chapters": 14, "testament": "OT"},
    "MAL": {"en": "Malachi", "fa": "ملاکی", "chapters": 4, "testament": "OT"},
    
    # New Testament
    "MAT": {"en": "Matthew", "fa": "متی", "chapters": 28, "testament": "NT"},
    "MRK": {"en": "Mark", "fa": "مرقس", "chapters": 16, "testament": "NT"},
    "LUK": {"en": "Luke", "fa": "لوقا", "chapters": 24, "testament": "NT"},
    "JHN": {"en": "John", "fa": "یوحنا", "chapters": 21, "testament": "NT"},
    "ACT": {"en": "Acts", "fa": "اعمال", "chapters": 28, "testament": "NT"},
    "ROM": {"en": "Romans", "fa": "رومیان", "chapters": 16, "testament": "NT"},
    "1CO": {"en": "1 Corinthians", "fa": "اول قرنتیان", "chapters": 16, "testament": "NT"},
    "2CO": {"en": "2 Corinthians", "fa": "دوم قرنتیان", "chapters": 13, "testament": "NT"},
    "GAL": {"en": "Galatians", "fa": "غلاطیان", "chapters": 6, "testament": "NT"},
    "EPH": {"en": "Ephesians", "fa": "افسسیان", "chapters": 6, "testament": "NT"},
    "PHP": {"en": "Philippians", "fa": "فیلیپیان", "chapters": 4, "testament": "NT"},
    "COL": {"en": "Colossians", "fa": "کولسیان", "chapters": 4, "testament": "NT"},
    "1TH": {"en": "1 Thessalonians", "fa": "اول تسالونیکیان", "chapters": 5, "testament": "NT"},
    "2TH": {"en": "2 Thessalonians", "fa": "دوم تسالونیکیان", "chapters": 3, "testament": "NT"},
    "1TI": {"en": "1 Timothy", "fa": "اول تیموتاؤس", "chapters": 6, "testament": "NT"},
    "2TI": {"en": "2 Timothy", "fa": "دوم تیموتاؤس", "chapters": 4, "testament": "NT"},
    "TIT": {"en": "Titus", "fa": "تیطس", "chapters": 3, "testament": "NT"},
    "PHM": {"en": "Philemon", "fa": "فلیمون", "chapters": 1, "testament": "NT"},
    "HEB": {"en": "Hebrews", "fa": "عبرانیان", "chapters": 13, "testament": "NT"},
    "JAS": {"en": "James", "fa": "یعقوب", "chapters": 5, "testament": "NT"},
    "1PE": {"en": "1 Peter", "fa": "اول پطرس", "chapters": 5, "testament": "NT"},
    "2PE": {"en": "2 Peter", "fa": "دوم پطرس", "chapters": 3, "testament": "NT"},
    "1JN": {"en": "1 John", "fa": "اول یوحنا", "chapters": 5, "testament": "NT"},
    "2JN": {"en": "2 John", "fa": "دوم یوحنا", "chapters": 1, "testament": "NT"},
    "3JN": {"en": "3 John", "fa": "سوم یوحنا", "chapters": 1, "testament": "NT"},
    "JUD": {"en": "Jude", "fa": "یهودا", "chapters": 1, "testament": "NT"},
    "REV": {"en": "Revelation", "fa": "مکاشفه", "chapters": 22, "testament": "NT"},
}

class CompleteBibleExtractor:
    def __init__(self):
        self.stats = {
            "versions_found": 0,
            "audio_files_found": 0,
            "text_chapters_extracted": 0,
            "total_verses": 0,
            "errors": 0
        }
        self.logs = []
        self.versions = {}
        self.audio_files = {}
        self.bible_text = {}
        
        os.makedirs(CONFIG["output_dir"], exist_ok=True)
    
    def log(self, message: str, level: str = "INFO"):
        """Add log entry"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] [{level}] {message}"
        self.logs.append(log_entry)
        # Use ASCII-safe output for Windows console
        safe_message = log_entry.encode('ascii', errors='replace').decode('ascii')
        print(safe_message)
    
    def extract_from_json(self, html_content: str) -> Optional[Dict]:
        """Extract data from __NEXT_DATA__ JSON in HTML"""
        try:
            # Find the script tag with __NEXT_DATA__
            match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html_content, re.DOTALL)
            if match:
                json_str = match.group(1)
                data = json.loads(json_str)
                return data
            return None
        except Exception as e:
            self.log(f"Error parsing JSON: {e}", "ERROR")
            return None
    
    def extract_audio_info(self, data: Dict) -> List[Dict]:
        """Extract audio file information"""
        audio_info = []
        try:
            chapter_info = data.get('props', {}).get('pageProps', {}).get('chapterInfo', {})
            audio_chapter_info = chapter_info.get('audioChapterInfo')
            
            # Check if audioChapterInfo exists and is iterable
            if audio_chapter_info and isinstance(audio_chapter_info, list):
                for audio in audio_chapter_info:
                    audio_data = {
                        "version_id": audio.get('version_id'),
                        "title": audio.get('title'),
                        "dramatized": audio.get('dramatized', False),
                        "timing_available": audio.get('timing_available', False),
                        "download_urls": audio.get('download_urls', {})
                    }
                    audio_info.append(audio_data)
        except Exception as e:
            self.log(f"Error extracting audio info: {e}", "ERROR")
        
        return audio_info
    
    def extract_verses(self, data: Dict) -> Dict[int, str]:
        """Extract verses from JSON data"""
        verses = {}
        try:
            # Navigate to content in the JSON structure
            content_html = data.get('props', {}).get('pageProps', {}).get('chapterInfo', {}).get('content', '')
            
            if content_html:
                soup = BeautifulSoup(content_html, 'html.parser')
                verse_elements = soup.find_all('span', class_='verse')
                
                for elem in verse_elements:
                    usfm = elem.get('data-usfm', '')
                    match = re.search(r'\.(\d+)$', usfm)
                    if match:
                        verse_num = int(match.group(1))
                        # Get all text from this verse span
                        content_spans = elem.find_all('span', class_='content')
                        verse_text = ' '.join([span.get_text(strip=True) for span in content_spans])
                        if verse_text:
                            verses[verse_num] = verse_text
        except Exception as e:
            self.log(f"Error extracting verses: {e}", "ERROR")
        
        return verses
    
    def extract_version_info(self, data: Dict) -> Optional[Dict]:
        """Extract Bible version metadata"""
        try:
            version_data = data.get('props', {}).get('pageProps', {}).get('versionData', {})
            if version_data:
                return {
                    "id": version_data.get('id'),
                    "title": version_data.get('local_title'),
                    "abbreviation": version_data.get('local_abbreviation'),
                    "language": version_data.get('language', {}).get('local_name'),
                    "language_code": version_data.get('language', {}).get('iso_639_1'),
                    "has_audio": version_data.get('audio', False),
                    "publisher": version_data.get('publisher', {}).get('name'),
                    "copyright": version_data.get('copyright_short', {}).get('text')
                }
        except Exception as e:
            self.log(f"Error extracting version info: {e}", "ERROR")
        return None
    
    def process_html_file(self, html_file: Path, lang: str):
        """Process a single HTML file"""
        try:
            # Parse filename: JHN.1.html -> book=JHN, chapter=1
            filename = html_file.stem
            parts = filename.split('.')
            
            if len(parts) >= 2:
                book_code = parts[0].upper()
                chapter = int(parts[1])
                
                if book_code not in BIBLE_BOOKS:
                    return
                
                # Read HTML
                with open(html_file, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                # Extract JSON data
                data = self.extract_from_json(html_content)
                if not data:
                    self.log(f"No JSON data found in {html_file}", "WARN")
                    return
                
                # Extract version info (only once per version)
                version_info = self.extract_version_info(data)
                if version_info and version_info['id'] not in self.versions:
                    self.versions[version_info['id']] = version_info
                    self.stats["versions_found"] += 1
                    self.log(f"✓ Found version: {version_info['title']} ({version_info['abbreviation']})")
                
                # Extract audio info
                audio_info = self.extract_audio_info(data)
                if audio_info:
                    version_id = version_info['id'] if version_info else "unknown"
                    if version_id not in self.audio_files:
                        self.audio_files[version_id] = {}
                    if book_code not in self.audio_files[version_id]:
                        self.audio_files[version_id][book_code] = {}
                    
                    self.audio_files[version_id][book_code][chapter] = audio_info
                    self.stats["audio_files_found"] += len(audio_info)
                
                # Extract verses
                verses = self.extract_verses(data)
                if verses:
                    version_id = version_info['id'] if version_info else "unknown"
                    if version_id not in self.bible_text:
                        self.bible_text[version_id] = {}
                    if book_code not in self.bible_text[version_id]:
                        self.bible_text[version_id][book_code] = {}
                    
                    self.bible_text[version_id][book_code][chapter] = {
                        lang: verses
                    }
                    
                    self.stats["text_chapters_extracted"] += 1
                    self.stats["total_verses"] += len(verses)
                    self.log(f"✓ {book_code} {chapter} ({version_info.get('abbreviation', 'unknown')}): {len(verses)} verses")
        
        except Exception as e:
            self.log(f"Error processing {html_file}: {e}", "ERROR")
            self.stats["errors"] += 1
    
    def scan_directory(self, lang: str = "fa"):
        """Scan directory for HTML files"""
        bible_path = Path(CONFIG["base_dir"]) / lang / "bible"
        
        if not bible_path.exists():
            self.log(f"Bible path not found: {bible_path}", "ERROR")
            return
        
        self.log(f"Scanning: {bible_path}")
        
        # Find all version directories
        version_dirs = [d for d in bible_path.iterdir() if d.is_dir() and d.name.isdigit()]
        
        for version_dir in version_dirs:
            self.log(f"Processing version: {version_dir.name}")
            html_files = list(version_dir.glob("*.html"))
            
            for html_file in html_files:
                self.process_html_file(html_file, lang)
    
    def export_to_json(self):
        """Export all data to JSON"""
        output_data = {
            "metadata": {
                "extracted_at": datetime.now().isoformat(),
                "source": "bible.com local archive",
                "stats": self.stats
            },
            "versions": self.versions,
            "audio_files": self.audio_files,
            "bible_text": self.bible_text,
            "books_info": BIBLE_BOOKS
        }
        
        with open(CONFIG["output_json"], 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        self.log(f"✓ Exported to: {CONFIG['output_json']}")
    
    def save_logs(self):
        """Save logs to file"""
        with open(CONFIG["log_file"], 'w', encoding='utf-8') as f:
            f.write('\n'.join(self.logs))
        
        self.log(f"✓ Logs saved to: {CONFIG['log_file']}")
    
    def run(self):
        """Main extraction process"""
        self.log("=" * 80)
        self.log("Complete Bible Extraction Started (Audio + Text + Versions)")
        self.log("=" * 80)
        
        # Scan Persian versions
        self.scan_directory("fa")
        
        # You can add more languages here
        # self.scan_directory("en")
        
        # Export results
        self.export_to_json()
        
        # Save logs
        self.save_logs()
        
        # Print summary
        self.log("=" * 80)
        self.log("EXTRACTION COMPLETE")
        self.log("=" * 80)
        self.log(f"Versions found: {self.stats['versions_found']}")
        self.log(f"Audio files found: {self.stats['audio_files_found']}")
        self.log(f"Text chapters extracted: {self.stats['text_chapters_extracted']}")
        self.log(f"Total verses: {self.stats['total_verses']}")
        self.log(f"Errors: {self.stats['errors']}")
        self.log(f"Output: {CONFIG['output_json']}")

if __name__ == "__main__":
    extractor = CompleteBibleExtractor()
    extractor.run()
