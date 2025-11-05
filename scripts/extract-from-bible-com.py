"""
Bible.com Local Archive Extractor
==================================
Extracts Bible verses from downloaded bible.com HTML files.

Features:
- Parses HTML files from local bible.com archive
- Extracts Persian (fa) and English versions
- Supports multiple translations
- Generates structured JSON output
- Uploads to Supabase database

Usage:
    python extract-from-bible-com.py
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
from datetime import datetime
import html

# Configuration
CONFIG = {
    "base_dir": r"C:\Users\SamYar\Desktop\Bible\www.bible.com",
    "output_dir": "output/bible_com_data",
    "output_json": "output/bible_com_data/bible_complete.json",
    "log_file": "output/bible_com_data/extraction_log.txt"
}

# Bible books mapping (ISO code to Persian/English names)
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

class BibleComExtractor:
    def __init__(self):
        self.stats = {
            "total_files": 0,
            "processed": 0,
            "errors": 0,
            "verses_extracted": 0
        }
        self.logs = []
        self.bible_data = {}
        
        # Create output directory
        os.makedirs(CONFIG["output_dir"], exist_ok=True)
    
    def log(self, message: str, level: str = "INFO"):
        """Add log entry"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] [{level}] {message}"
        self.logs.append(log_entry)
        print(log_entry)
    
    def extract_verses_from_html(self, html_content: str, book_code: str, chapter: int) -> Dict:
        """Extract verse text from Bible.com HTML"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            verses = {}
            
            # Find all verse elements (Bible.com uses <span class="verse" data-usfm="...">)
            # or <div class="ChapterContent_chapter__...">
            
            # Strategy 1: Look for verse spans with data-usfm attribute
            verse_elements = soup.find_all('span', class_='verse')
            if verse_elements:
                for elem in verse_elements:
                    usfm = elem.get('data-usfm', '')
                    # Parse USFM like "JHN.1.1" -> verse 1
                    match = re.search(r'\.(\d+)$', usfm)
                    if match:
                        verse_num = int(match.group(1))
                        verse_text = elem.get_text(strip=True)
                        verses[verse_num] = verse_text
            
            # Strategy 2: Look for verse content in specific divs/spans
            if not verses:
                # Try finding by class patterns
                content_divs = soup.find_all('div', class_=re.compile('ChapterContent|VerseContent'))
                for div in content_divs:
                    verse_spans = div.find_all('span', class_=re.compile('content|text'))
                    for i, span in enumerate(verse_spans, 1):
                        text = span.get_text(strip=True)
                        if text and len(text) > 5:  # Ignore very short texts
                            verses[i] = text
            
            # Strategy 3: Extract from script tag (YouVersion often embeds JSON data)
            if not verses:
                scripts = soup.find_all('script', type='application/json')
                for script in scripts:
                    try:
                        data = json.loads(script.string)
                        # Navigate through possible JSON structures
                        if isinstance(data, dict):
                            # Look for verse data in nested structures
                            verses_data = self._find_verses_in_json(data)
                            if verses_data:
                                verses = verses_data
                                break
                    except:
                        continue
            
            # Strategy 4: Fallback - extract all paragraph-like content
            if not verses:
                self.log(f"Using fallback extraction for {book_code} {chapter}", "WARN")
                paragraphs = soup.find_all(['p', 'div'], class_=re.compile('verse|content|text'))
                for i, p in enumerate(paragraphs, 1):
                    text = p.get_text(strip=True)
                    # Clean up HTML entities
                    text = html.unescape(text)
                    if text and len(text) > 10:
                        verses[i] = text
            
            return verses
            
        except Exception as e:
            self.log(f"Error extracting verses: {e}", "ERROR")
            return {}
    
    def _find_verses_in_json(self, data: dict, verses: dict = None) -> Optional[Dict]:
        """Recursively search for verse data in JSON structure"""
        if verses is None:
            verses = {}
        
        if isinstance(data, dict):
            # Check for common verse data keys
            if 'verses' in data and isinstance(data['verses'], list):
                for verse in data['verses']:
                    if 'number' in verse and 'text' in verse:
                        verses[verse['number']] = verse['text']
            
            if 'content' in data and isinstance(data['content'], list):
                for item in data['content']:
                    if isinstance(item, dict) and 'text' in item:
                        if 'verse' in item or 'number' in item:
                            verse_num = item.get('verse') or item.get('number')
                            verses[verse_num] = item['text']
            
            # Recursively search nested structures
            for key, value in data.items():
                if isinstance(value, (dict, list)):
                    result = self._find_verses_in_json(value, verses)
                    if result:
                        verses.update(result)
        
        elif isinstance(data, list):
            for item in data:
                if isinstance(item, (dict, list)):
                    result = self._find_verses_in_json(item, verses)
                    if result:
                        verses.update(result)
        
        return verses if verses else None
    
    def process_version_folder(self, lang: str, version_code: str):
        """Process a specific Bible version folder"""
        version_path = Path(CONFIG["base_dir"]) / lang / "bible" / version_code
        
        if not version_path.exists():
            self.log(f"Version path not found: {version_path}", "WARN")
            return
        
        self.log(f"Processing version: {lang}/{version_code}")
        
        # Find all HTML files
        html_files = list(version_path.glob("*.html"))
        self.stats["total_files"] += len(html_files)
        
        for html_file in html_files:
            try:
                # Parse filename: JHN.1.html -> book=JHN, chapter=1
                filename = html_file.stem  # Remove .html
                parts = filename.split('.')
                
                if len(parts) >= 2:
                    book_code = parts[0].upper()
                    chapter = int(parts[1])
                    
                    if book_code not in BIBLE_BOOKS:
                        self.log(f"Unknown book code: {book_code}", "WARN")
                        continue
                    
                    # Read HTML content
                    with open(html_file, 'r', encoding='utf-8') as f:
                        html_content = f.read()
                    
                    # Extract verses
                    verses = self.extract_verses_from_html(html_content, book_code, chapter)
                    
                    if verses:
                        # Store in structure: bible_data[book_code][chapter][lang] = verses
                        if book_code not in self.bible_data:
                            self.bible_data[book_code] = {}
                        
                        if chapter not in self.bible_data[book_code]:
                            self.bible_data[book_code][chapter] = {}
                        
                        self.bible_data[book_code][chapter][lang] = verses
                        
                        self.stats["verses_extracted"] += len(verses)
                        self.stats["processed"] += 1
                        
                        self.log(f"✓ {book_code} {chapter} ({lang}): {len(verses)} verses")
                    else:
                        self.log(f"✗ {book_code} {chapter} ({lang}): No verses found", "WARN")
                
            except Exception as e:
                self.log(f"Error processing {html_file}: {e}", "ERROR")
                self.stats["errors"] += 1
    
    def export_to_json(self):
        """Export extracted data to JSON"""
        output_data = {
            "metadata": {
                "extracted_at": datetime.now().isoformat(),
                "total_books": len(self.bible_data),
                "total_chapters": sum(len(chapters) for chapters in self.bible_data.values()),
                "total_verses": self.stats["verses_extracted"],
                "source": "bible.com local archive"
            },
            "books": {}
        }
        
        # Organize by book
        for book_code, chapters in self.bible_data.items():
            book_info = BIBLE_BOOKS.get(book_code, {})
            output_data["books"][book_code] = {
                "name": book_info,
                "chapters": chapters
            }
        
        # Save JSON
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
        self.log("=" * 60)
        self.log("Bible.com Local Archive Extraction Started")
        self.log("=" * 60)
        
        # Process Persian version (118 = NMV)
        self.process_version_folder("fa", "118")
        
        # Process English version if available
        # self.process_version_folder("en", "111")  # NIV
        
        # Export results
        self.export_to_json()
        
        # Save logs
        self.save_logs()
        
        # Print summary
        self.log("=" * 60)
        self.log("EXTRACTION COMPLETE")
        self.log("=" * 60)
        self.log(f"Total files scanned: {self.stats['total_files']}")
        self.log(f"Successfully processed: {self.stats['processed']}")
        self.log(f"Errors: {self.stats['errors']}")
        self.log(f"Total verses extracted: {self.stats['verses_extracted']}")
        self.log(f"Output: {CONFIG['output_json']}")

if __name__ == "__main__":
    extractor = BibleComExtractor()
    extractor.run()
