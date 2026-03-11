import os
import sqlite3
import argparse
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse

# --- Configuration ---
DB_PATH = Path(r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\mychurch-next\Bible\bible_output\bible_complete.db")
OUTPUT_BASE_DIR = Path(r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\mychurch-next\Bible\audio_backup")
MAX_WORKERS = 10 # Number of concurrent downloads
MAX_RETRIES = 3

def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)

def download_file(url: str, dest_path: Path, retry_count=0) -> bool:
    if dest_path.exists():
        return True # Already downloaded
    
    try:
        response = requests.get(url, stream=True, timeout=15)
        response.raise_for_status()
        
        # Write to temporary file first to prevent corrupted partial files on crash
        temp_path = dest_path.with_suffix('.tmp')
        with open(temp_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                
        # Rename to final filename
        temp_path.rename(dest_path)
        return True
    
    except Exception as e:
        # Cleanup partial file
        if 'temp_path' in locals() and temp_path.exists():
            temp_path.unlink()
            
        if retry_count < MAX_RETRIES:
            time.sleep(1) # Wait before retry
            return download_file(url, dest_path, retry_count + 1)
        print(f"Failed to download {url}: {e}")
        return False

def process_audio_row(row, total_rows: int, current_idx: int):
    # row = (version_id, book_id, chapter_num, mp3_url, hls_url)
    v_id, b_id, c_num, mp3_url, hls_url = row
    
    if not mp3_url:
        return False
        
    # Example mp3_url layout: .../1-c0e8ee2f928bd7fcf63612b92c3d94a6.mp3?version_id=3034
    
    # Create directory structure: Output/VersionID/BookID/
    version_dir = OUTPUT_BASE_DIR / str(v_id)
    book_dir = version_dir / b_id
    ensure_dir(book_dir)
    
    # Prettify the filename: "1.mp3" instead of the hash
    filename = f"{c_num}.mp3"
    dest_path = book_dir / filename
    
    success = download_file(mp3_url, dest_path)
    
    # Rudimentary progress logging
    if current_idx % 100 == 0 or current_idx == total_rows:
        print(f"Progress: {current_idx}/{total_rows} ({current_idx/total_rows*100:.1f}%)")
        
    return success

def main():
    print(f"Connecting to DB: {DB_PATH}")
    if not DB_PATH.exists():
        print("Database not found!")
        return
        
    ensure_dir(OUTPUT_BASE_DIR)
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Fetch all audio rows with an MP3 URL
    print("Fetching audio URLs...")
    cursor.execute("""
        SELECT version_id, book_id, chapter_num, mp3_url, hls_url 
        FROM audio 
        WHERE mp3_url IS NOT NULL AND mp3_url != ''
    """)
    rows = cursor.fetchall()
    total_rows = len(rows)
    print(f"Found {total_rows} audio files to download.")
    
    # Use ThreadPoolExecutor for massive concurrent downloads
    print(f"Starting downloads with {MAX_WORKERS} concurrent workers...")
    print(f"Output directory: {OUTPUT_BASE_DIR}")
    
    success_count = 0
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Map futures to rows to track index for progress
        futures = {
            executor.submit(process_audio_row, row, total_rows, i+1): row 
            for i, row in enumerate(rows)
        }
        
        for future in as_completed(futures):
            if future.result():
                success_count += 1
                
    elapsed = time.time() - start_time
    print(f"\n===== DOWNLOAD COMPLETE =====")
    print(f"Successfully downloaded: {success_count} / {total_rows}")
    print(f"Time taken: {elapsed/60:.2f} minutes")
    print(f"Output saved to: {OUTPUT_BASE_DIR}")

if __name__ == "__main__":
    main()
