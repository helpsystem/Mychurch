"""
Bible Content Uploader to Supabase
===================================
Uploads extracted Bible data to Supabase database.

Features:
- Reads JSON from extraction script
- Creates/updates tables in Supabase
- Handles both audio and text entries
- Batch uploads for performance
- Full error handling and logging
"""

import json
import os
from datetime import datetime
from typing import List, Dict
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

# Configuration
CONFIG = {
    "input_json": "output/bible_data/bible_complete_index.json",
    "log_file": "output/bible_data/upload_log.txt",
    "batch_size": 100
}

class SupabaseUploader:
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("Missing Supabase credentials in .env file!")
        
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.logs = []
        self.stats = {
            "total_entries": 0,
            "uploaded": 0,
            "updated": 0,
            "errors": 0,
            "skipped": 0
        }
    
    def log(self, message: str, level: str = "INFO"):
        """Add log entry"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] [{level}] {message}"
        self.logs.append(log_entry)
        print(log_entry)
    
    def load_json(self) -> Dict:
        """Load extracted Bible data from JSON"""
        try:
            with open(CONFIG["input_json"], 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.log(f"✅ Loaded {data['total_entries']} entries from JSON")
            return data
        except FileNotFoundError:
            self.log(f"❌ JSON file not found: {CONFIG['input_json']}", "ERROR")
            raise
        except Exception as e:
            self.log(f"❌ Error loading JSON: {e}", "ERROR")
            raise
    
    def create_tables(self):
        """Create necessary tables in Supabase (SQL)"""
        sql_script = """
-- Bible Books Table
CREATE TABLE IF NOT EXISTS bible_books (
    id SERIAL PRIMARY KEY,
    book_name VARCHAR(100) NOT NULL,
    book_name_fa VARCHAR(100),
    book_iso VARCHAR(10) UNIQUE,
    book_number INTEGER,
    testament VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bible Chapters Table
CREATE TABLE IF NOT EXISTS bible_chapters (
    id SERIAL PRIMARY KEY,
    book_iso VARCHAR(10) NOT NULL,
    chapter_number INTEGER NOT NULL,
    language VARCHAR(20) NOT NULL,
    text_content TEXT,
    audio_url VARCHAR(500),
    audio_path VARCHAR(500),
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(book_iso, chapter_number, language)
);

-- Bible Audio Files Table
CREATE TABLE IF NOT EXISTS bible_audio_files (
    id SERIAL PRIMARY KEY,
    book_iso VARCHAR(10),
    chapter_number INTEGER,
    language VARCHAR(20) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL UNIQUE,
    file_size INTEGER,
    duration INTEGER,
    url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chapters_book ON bible_chapters(book_iso);
CREATE INDEX IF NOT EXISTS idx_chapters_lang ON bible_chapters(language);
CREATE INDEX IF NOT EXISTS idx_audio_book ON bible_audio_files(book_iso);
"""
        
        self.log("📋 SQL script for table creation:")
        self.log(sql_script)
        self.log("⚠️  Please run this SQL in Supabase SQL Editor manually!")
        
        # Save SQL to file
        sql_file = "output/bible_data/create_tables.sql"
        with open(sql_file, 'w', encoding='utf-8') as f:
            f.write(sql_script)
        self.log(f"✅ SQL saved to: {sql_file}")
    
    def upload_audio_files(self, entries: List[Dict]):
        """Upload audio file metadata to Supabase"""
        self.log("Uploading audio files...")
        
        audio_entries = [e for e in entries if e.get('audio_path')]
        self.log(f"Found {len(audio_entries)} audio files")
        
        # Process in batches
        for i in range(0, len(audio_entries), CONFIG["batch_size"]):
            batch = audio_entries[i:i + CONFIG["batch_size"]]
            
            for entry in batch:
                try:
                    data = {
                        "book_iso": entry.get("book_iso"),
                        "chapter_number": entry.get("chapter"),
                        "language": entry.get("language"),
                        "filename": entry.get("filename"),
                        "filepath": entry.get("audio_path"),
                        "file_size": entry.get("file_size"),
                        "url": entry.get("url")
                    }
                    
                    # Upsert (insert or update)
                    response = self.client.table("bible_audio_files").upsert(
                        data,
                        on_conflict="filepath"
                    ).execute()
                    
                    self.stats["uploaded"] += 1
                    
                except Exception as e:
                    self.log(f"Error uploading {entry.get('filename')}: {e}", "ERROR")
                    self.stats["errors"] += 1
            
            self.log(f"Uploaded batch {i//CONFIG['batch_size'] + 1}/{(len(audio_entries) + CONFIG['batch_size'] - 1)//CONFIG['batch_size']}")
        
        self.log(f"✅ Uploaded {self.stats['uploaded']} audio files")
    
    def upload_chapters(self, entries: List[Dict]):
        """Upload chapter text content to Supabase"""
        self.log("Uploading chapter text content...")
        
        text_entries = [e for e in entries if e.get('text_content')]
        self.log(f"Found {len(text_entries)} text entries")
        
        # Group by book/chapter/language
        chapters_map = {}
        
        for entry in text_entries:
            if not entry.get('book_iso') or not entry.get('chapter'):
                continue
            
            key = f"{entry['book_iso']}_{entry['chapter']}_{entry['language']}"
            
            if key not in chapters_map:
                chapters_map[key] = {
                    "book_iso": entry['book_iso'],
                    "chapter_number": entry['chapter'],
                    "language": entry['language'],
                    "text_content": entry['text_content']
                }
        
        # Upload
        for key, data in chapters_map.items():
            try:
                response = self.client.table("bible_chapters").upsert(
                    data,
                    on_conflict="book_iso,chapter_number,language"
                ).execute()
                
                self.stats["updated"] += 1
                
            except Exception as e:
                self.log(f"Error uploading chapter {key}: {e}", "ERROR")
                self.stats["errors"] += 1
        
        self.log(f"✅ Uploaded {self.stats['updated']} chapters")
    
    def save_logs(self):
        """Save logs to file"""
        try:
            with open(CONFIG["log_file"], 'w', encoding='utf-8') as f:
                f.write("\n".join(self.logs))
            
            self.log(f"✅ Saved logs: {CONFIG['log_file']}")
        except Exception as e:
            print(f"Error saving logs: {e}")
    
    def generate_report(self):
        """Generate upload report"""
        report = f"""
╔════════════════════════════════════════════════════════════════╗
║          Supabase Upload Report                                ║
╚════════════════════════════════════════════════════════════════╝

📊 Statistics:
   • Total Entries: {self.stats['total_entries']}
   • Audio Files Uploaded: {self.stats['uploaded']}
   • Chapters Updated: {self.stats['updated']}
   • Errors: {self.stats['errors']}
   • Skipped: {self.stats['skipped']}

📁 Log File:
   • {CONFIG['log_file']}

✅ Upload Complete!
"""
        print(report)
        self.log(report)
    
    def run(self):
        """Main execution"""
        self.log("="*70)
        self.log("Starting Supabase Upload")
        self.log("="*70)
        
        # Load data
        data = self.load_json()
        entries = data.get('entries', [])
        self.stats['total_entries'] = len(entries)
        
        # Create tables (manual step)
        self.create_tables()
        
        # Upload data
        self.upload_audio_files(entries)
        self.upload_chapters(entries)
        
        # Save logs and report
        self.save_logs()
        self.generate_report()


if __name__ == "__main__":
    try:
        uploader = SupabaseUploader()
        uploader.run()
    except Exception as e:
        print(f"❌ Fatal error: {e}")
