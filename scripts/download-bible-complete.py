"""
Bible.com Complete Downloader
=============================
Downloads all Bible chapters from bible.com for specified versions.

Usage:
    python download-bible-complete.py --version 118 --language fa
    python download-bible-complete.py --version 1 --language en
"""

import os
import time
import requests
from pathlib import Path
from datetime import datetime
import json
import argparse

# Bible books with chapter counts
BIBLE_BOOKS = {
    # Old Testament
    "GEN": {"chapters": 50, "name": "Genesis"},
    "EXO": {"chapters": 40, "name": "Exodus"},
    "LEV": {"chapters": 27, "name": "Leviticus"},
    "NUM": {"chapters": 36, "name": "Numbers"},
    "DEU": {"chapters": 34, "name": "Deuteronomy"},
    "JOS": {"chapters": 24, "name": "Joshua"},
    "JDG": {"chapters": 21, "name": "Judges"},
    "RUT": {"chapters": 4, "name": "Ruth"},
    "1SA": {"chapters": 31, "name": "1 Samuel"},
    "2SA": {"chapters": 24, "name": "2 Samuel"},
    "1KI": {"chapters": 22, "name": "1 Kings"},
    "2KI": {"chapters": 25, "name": "2 Kings"},
    "1CH": {"chapters": 29, "name": "1 Chronicles"},
    "2CH": {"chapters": 36, "name": "2 Chronicles"},
    "EZR": {"chapters": 10, "name": "Ezra"},
    "NEH": {"chapters": 13, "name": "Nehemiah"},
    "EST": {"chapters": 10, "name": "Esther"},
    "JOB": {"chapters": 42, "name": "Job"},
    "PSA": {"chapters": 150, "name": "Psalms"},
    "PRO": {"chapters": 31, "name": "Proverbs"},
    "ECC": {"chapters": 12, "name": "Ecclesiastes"},
    "SNG": {"chapters": 8, "name": "Song of Solomon"},
    "ISA": {"chapters": 66, "name": "Isaiah"},
    "JER": {"chapters": 52, "name": "Jeremiah"},
    "LAM": {"chapters": 5, "name": "Lamentations"},
    "EZK": {"chapters": 48, "name": "Ezekiel"},
    "DAN": {"chapters": 12, "name": "Daniel"},
    "HOS": {"chapters": 14, "name": "Hosea"},
    "JOL": {"chapters": 3, "name": "Joel"},
    "AMO": {"chapters": 9, "name": "Amos"},
    "OBA": {"chapters": 1, "name": "Obadiah"},
    "JON": {"chapters": 4, "name": "Jonah"},
    "MIC": {"chapters": 7, "name": "Micah"},
    "NAM": {"chapters": 3, "name": "Nahum"},
    "HAB": {"chapters": 3, "name": "Habakkuk"},
    "ZEP": {"chapters": 3, "name": "Zephaniah"},
    "HAG": {"chapters": 2, "name": "Haggai"},
    "ZEC": {"chapters": 14, "name": "Zechariah"},
    "MAL": {"chapters": 4, "name": "Malachi"},
    
    # New Testament
    "MAT": {"chapters": 28, "name": "Matthew"},
    "MRK": {"chapters": 16, "name": "Mark"},
    "LUK": {"chapters": 24, "name": "Luke"},
    "JHN": {"chapters": 21, "name": "John"},
    "ACT": {"chapters": 28, "name": "Acts"},
    "ROM": {"chapters": 16, "name": "Romans"},
    "1CO": {"chapters": 16, "name": "1 Corinthians"},
    "2CO": {"chapters": 13, "name": "2 Corinthians"},
    "GAL": {"chapters": 6, "name": "Galatians"},
    "EPH": {"chapters": 6, "name": "Ephesians"},
    "PHP": {"chapters": 4, "name": "Philippians"},
    "COL": {"chapters": 4, "name": "Colossians"},
    "1TH": {"chapters": 5, "name": "1 Thessalonians"},
    "2TH": {"chapters": 3, "name": "2 Thessalonians"},
    "1TI": {"chapters": 6, "name": "1 Timothy"},
    "2TI": {"chapters": 4, "name": "2 Timothy"},
    "TIT": {"chapters": 3, "name": "Titus"},
    "PHM": {"chapters": 1, "name": "Philemon"},
    "HEB": {"chapters": 13, "name": "Hebrews"},
    "JAS": {"chapters": 5, "name": "James"},
    "1PE": {"chapters": 5, "name": "1 Peter"},
    "2PE": {"chapters": 3, "name": "2 Peter"},
    "1JN": {"chapters": 5, "name": "1 John"},
    "2JN": {"chapters": 1, "name": "2 John"},
    "3JN": {"chapters": 1, "name": "3 John"},
    "JUD": {"chapters": 1, "name": "Jude"},
    "REV": {"chapters": 22, "name": "Revelation"},
}

class BibleDownloader:
    def __init__(self, version_id: int, language: str, output_dir: str):
        self.version_id = version_id
        self.language = language
        self.output_dir = Path(output_dir)
        self.base_url = "https://www.bible.com"
        
        self.stats = {
            "total_chapters": 0,
            "downloaded": 0,
            "failed": 0,
            "skipped": 0,
            "start_time": datetime.now()
        }
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        })
        
        # Create output directory
        self.bible_dir = self.output_dir / self.language / "bible" / str(version_id)
        self.bible_dir.mkdir(parents=True, exist_ok=True)
        
        # Calculate total chapters
        for book_info in BIBLE_BOOKS.values():
            self.stats["total_chapters"] += book_info["chapters"]
        
        print(f"📖 Bible Downloader Initialized")
        print(f"   Version: {version_id}")
        print(f"   Language: {language}")
        print(f"   Output: {self.bible_dir}")
        print(f"   Total chapters to download: {self.stats['total_chapters']}")
        print("=" * 60)
    
    def download_chapter(self, book_code: str, chapter: int, retry: int = 3) -> bool:
        """Download a single chapter"""
        filename = f"{book_code}.{chapter}.html"
        output_path = self.bible_dir / filename
        
        # Skip if already exists
        if output_path.exists():
            file_size = output_path.stat().st_size
            if file_size > 1000:  # Only skip if file is substantial
                self.stats["skipped"] += 1
                return True
        
        url = f"{self.base_url}/{self.language}/bible/{self.version_id}/{book_code}.{chapter}"
        
        for attempt in range(retry):
            try:
                response = self.session.get(url, timeout=30)
                
                if response.status_code == 200:
                    # Save the HTML
                    with open(output_path, 'w', encoding='utf-8') as f:
                        f.write(response.text)
                    
                    self.stats["downloaded"] += 1
                    return True
                    
                elif response.status_code == 404:
                    print(f"   ❌ Not found: {book_code} {chapter}")
                    self.stats["failed"] += 1
                    return False
                    
                else:
                    print(f"   ⚠️  HTTP {response.status_code}: {book_code} {chapter}")
                    
            except Exception as e:
                if attempt == retry - 1:
                    print(f"   ❌ Error downloading {book_code} {chapter}: {e}")
                    self.stats["failed"] += 1
                    return False
                else:
                    time.sleep(2)  # Wait before retry
        
        return False
    
    def download_book(self, book_code: str):
        """Download all chapters of a book"""
        book_info = BIBLE_BOOKS[book_code]
        book_name = book_info["name"]
        total_chapters = book_info["chapters"]
        
        print(f"\n📚 {book_name} ({book_code}) - {total_chapters} chapters")
        print("-" * 60)
        
        for chapter in range(1, total_chapters + 1):
            # Progress indicator
            progress = (self.stats["downloaded"] + self.stats["failed"] + self.stats["skipped"]) / self.stats["total_chapters"] * 100
            print(f"   [{progress:5.1f}%] Downloading {book_code} {chapter}...", end='\r')
            
            self.download_chapter(book_code, chapter)
            
            # Small delay to be respectful
            time.sleep(0.5)
        
        print(f"   ✅ {book_name} complete!" + " " * 30)
    
    def download_all(self, testament: str = "both"):
        """Download entire Bible or specific testament"""
        ot_books = list(BIBLE_BOOKS.keys())[:39]
        nt_books = list(BIBLE_BOOKS.keys())[39:]
        
        if testament == "ot":
            books = ot_books
            print("\n📜 Downloading OLD TESTAMENT only")
        elif testament == "nt":
            books = nt_books
            print("\n✝️  Downloading NEW TESTAMENT only")
        else:
            books = list(BIBLE_BOOKS.keys())
            print("\n📖 Downloading COMPLETE BIBLE")
        
        print("=" * 60)
        
        for book_code in books:
            self.download_book(book_code)
        
        self.print_summary()
    
    def print_summary(self):
        """Print download summary"""
        duration = (datetime.now() - self.stats["start_time"]).total_seconds()
        
        print("\n" + "=" * 60)
        print("📊 DOWNLOAD SUMMARY")
        print("=" * 60)
        print(f"Total chapters:     {self.stats['total_chapters']}")
        print(f"✅ Downloaded:      {self.stats['downloaded']}")
        print(f"⏭️  Skipped (exist): {self.stats['skipped']}")
        print(f"❌ Failed:          {self.stats['failed']}")
        print(f"⏱️  Duration:        {duration:.1f} seconds")
        print(f"📁 Output folder:   {self.bible_dir}")
        print("=" * 60)
        
        # Save stats
        stats_file = self.bible_dir / "download_stats.json"
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump({
                **self.stats,
                "start_time": self.stats["start_time"].isoformat(),
                "end_time": datetime.now().isoformat(),
                "duration_seconds": duration
            }, f, indent=2, ensure_ascii=False)

def main():
    parser = argparse.ArgumentParser(description='Download Bible chapters from bible.com')
    parser.add_argument('--version', type=int, required=True, help='Bible version ID (e.g., 118 for Persian NMV)')
    parser.add_argument('--language', type=str, required=True, help='Language code (e.g., fa, en)')
    parser.add_argument('--testament', type=str, choices=['ot', 'nt', 'both'], default='both', 
                        help='Which testament to download (ot=Old, nt=New, both=Complete)')
    parser.add_argument('--output', type=str, default='C:/Users/SamYar/Desktop/Bible/www.bible.com',
                        help='Output directory')
    parser.add_argument('--book', type=str, help='Download single book only (e.g., GEN, JHN)')
    
    args = parser.parse_args()
    
    downloader = BibleDownloader(args.version, args.language, args.output)
    
    if args.book:
        if args.book.upper() in BIBLE_BOOKS:
            downloader.download_book(args.book.upper())
        else:
            print(f"❌ Invalid book code: {args.book}")
            print(f"Valid codes: {', '.join(BIBLE_BOOKS.keys())}")
    else:
        downloader.download_all(args.testament)

if __name__ == "__main__":
    main()
