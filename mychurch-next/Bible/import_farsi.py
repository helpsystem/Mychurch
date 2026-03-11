"""
import_farsi.py
Import all Farsi/Persian Bible versions from JSON into bible_complete.db
"""
import json
import sqlite3
import os
import glob

DB_PATH = os.path.join(os.path.dirname(__file__), "bible_output", "bible_complete.db")
JSON_DIR = os.path.join(os.path.dirname(__file__), "bible_output", "json")

# Known Farsi version abbrs (from directory listing)
FARSI_ABBRS = {"NMV", "TPV", "PCB", "PES", "BBK", "RCPV", "POV"}

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Find all JSON files
    json_files = glob.glob(os.path.join(JSON_DIR, "bible_*_complete.json"))
    
    imported = 0
    skipped = 0

    for json_file in sorted(json_files):
        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        version_id = data.get("version_id")
        abbr = data.get("version_abbr", "")
        language = data.get("language", "en")

        # Only import Farsi versions (language == 'fa' or abbr in known list)
        is_farsi = language == "fa" or abbr.upper() in FARSI_ABBRS or "مژده" in json_file
        if not is_farsi:
            skipped += 1
            continue

        print(f"\n📖 Importing: {abbr} (ID:{version_id}, lang:{language}) — {os.path.basename(json_file)}")

        # Insert/replace version row
        cursor.execute("""
            INSERT OR REPLACE INTO versions (version_id, abbr, name, language, publisher)
            VALUES (?, ?, ?, ?, ?)
        """, (
            version_id,
            abbr,
            data.get("version_name", abbr),
            language,
            "YouVersion"
        ))

        books = data.get("books", [])
        verse_count = 0
        heading_count = 0
        audio_count = 0

        for book in books:
            book_id = book.get("book_id", "")
            book_name_en = book.get("book_name_en", "")
            book_name_fa = book.get("book_name_fa", "")
            testament = book.get("testament", "OT")
            chapter_count = book.get("chapter_count", 0)
            total_verses = book.get("total_verses", 0)

            # Upsert book row
            cursor.execute("""
                INSERT OR REPLACE INTO books (version_id, book_id, book_name_en, book_name_fa, testament, chapter_count, total_verses)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (version_id, book_id, book_name_en, book_name_fa, testament, chapter_count, total_verses))

            for chapter in book.get("chapters", []):
                chapter_num = chapter.get("chapter", 0)
                chapter_usfm = chapter.get("chapter_usfm", "")
                has_audio = chapter.get("has_audio", False)

                # Upsert chapter row
                cursor.execute("""
                    INSERT OR REPLACE INTO chapters (version_id, book_id, chapter_num, chapter_usfm, verse_count, has_audio)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (version_id, book_id, chapter_num, chapter_usfm, chapter.get("verse_count", 0), 1 if has_audio else 0))

                for verse in chapter.get("verses", []):
                    verse_num = verse.get("verse", 0)
                    text = verse.get("text", "")
                    if not text:
                        continue
                    cursor.execute("""
                        INSERT OR REPLACE INTO verses (version_id, book_id, chapter_num, verse_num, text)
                        VALUES (?, ?, ?, ?, ?)
                    """, (version_id, book_id, chapter_num, verse_num, text))
                    verse_count += 1

                for heading in chapter.get("headings", []):
                    cursor.execute("""
                        INSERT OR IGNORE INTO headings (version_id, book_id, chapter_num, before_verse, text)
                        VALUES (?, ?, ?, ?, ?)
                    """, (version_id, book_id, chapter_num, heading.get("before_verse"), heading.get("text", "")))
                    heading_count += 1

                for audio in chapter.get("audio", []):
                    mp3_url = audio.get("mp3_url") or audio.get("mp3")
                    hls_url = audio.get("hls_url") or audio.get("hls")
                    audio_version_id = audio.get("audio_version_id") or audio.get("id")
                    if mp3_url:
                        cursor.execute("""
                            INSERT OR IGNORE INTO audio (version_id, book_id, chapter_num, audio_version_id, title, dramatized, mp3_url, hls_url)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """, (version_id, book_id, chapter_num, audio_version_id,
                              audio.get("title", ""), 1 if audio.get("dramatized") else 0, mp3_url, hls_url))
                        audio_count += 1

        conn.commit()
        print(f"   ✅ {verse_count} verses | {heading_count} headings | {audio_count} audio links")
        imported += 1

    conn.close()
    print(f"\n🎉 Done! Imported {imported} Farsi versions. Skipped {skipped} English versions.")

if __name__ == "__main__":
    main()
