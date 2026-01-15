
import os
import shutil

# Map index 1..66 to Book Codes
BIBLE_BOOKS = [
    'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST',
    'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM',
    'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
    'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT',
    'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
]

SOURCE_DIR = 'temp/temp_downloads'
TARGET_BASE = 'public/bible_data/audio/MOJDEH'

def organize():
    if not os.path.exists(TARGET_BASE):
        os.makedirs(TARGET_BASE)
        
    print(f"📂 Organizing Audio from {SOURCE_DIR} to {TARGET_BASE}...")
    
    count = 0
    
    for i in range(1, 67):
        book_code = BIBLE_BOOKS[i-1]
        # Source pattern: temp/temp_downloads/extracted_1/1/1.mp3
        # Note: sometimes extraction might vary, checking path
        src_folder = f"{SOURCE_DIR}/extracted_{i}/{i}"
        
        target_folder = f"{TARGET_BASE}/{book_code}"
        
        if os.path.exists(src_folder):
            if not os.path.exists(target_folder):
                os.makedirs(target_folder)
                
            # Move files
            files = os.listdir(src_folder)
            for f in files:
                if f.endswith('.mp3'):
                    src = os.path.join(src_folder, f)
                    dst = os.path.join(target_folder, f)
                    shutil.copy2(src, dst) # Copy, don't move incase we need to retry
                    count += 1
            print(f"✅ Processed {book_code} ({len(files)} files)")
        else:
             print(f"⚠️ Skipped {book_code} (Source not found: {src_folder})")

    print(f"🎉 Done! Moved {count} audio files.")

if __name__ == '__main__':
    organize()
