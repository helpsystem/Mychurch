#!/usr/bin/env python3
"""
Bible Data Extractor
====================
Extracts full Bible text from api.bible (BSB English, ID:3034)
and exports to: JSON (per-book + single), SQLite, CSV, PostgreSQL.

Usage:
    python extract_bible.py                 # Extract everything
    python extract_bible.py --book GEN      # Extract one book
    python extract_bible.py --resume        # Resume interrupted extraction
"""

import os
import sys
import json
import csv
import time
import sqlite3
import argparse
import re
import logging
from pathlib import Path
from datetime import datetime
from html.parser import HTMLParser
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import quote

# ─── Configuration ──────────────────────────────────────────────────────────
API_KEY = "mQSt6AbhCy2oUMbqw7AXWdjtpBEgErqZxrjgvG5AmaExT834"
BIBLE_ID = "3034"           # BSB English
BASE_URL = "https://api.scripture.api.bible/v1"
OUTPUT_DIR = Path(__file__).parent / "output"
RATE_LIMIT_DELAY = 0.35     # seconds between API calls (stay under limits)
MAX_RETRIES = 5

# PostgreSQL config (fill in if needed)
PG_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "bible",
    "user": "postgres",
    "password": "",
}

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(OUTPUT_DIR / "extraction.log" if (OUTPUT_DIR).exists() else "extraction.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("bible-extractor")


# ─── HTML Stripper ───────────────────────────────────────────────────────────
class HTMLStripper(HTMLParser):
    """Strip HTML tags and return clean text."""
    def __init__(self):
        super().__init__()
        self.pieces = []
        self._skip = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        # Add newline for paragraph breaks
        if tag in ("p", "div", "br"):
            self.pieces.append("\n")
        # Skip note/footnote content
        if attrs_dict.get("class", "").startswith("note"):
            self._skip = True

    def handle_endtag(self, tag):
        if tag in ("span",):
            self._skip = False

    def handle_data(self, data):
        if not self._skip:
            self.pieces.append(data)

    def get_text(self):
        return "".join(self.pieces).strip()


def strip_html(html_text: str) -> str:
    """Remove HTML tags and return clean text."""
    if not html_text:
        return ""
    s = HTMLStripper()
    s.feed(html_text)
    return s.get_text()


# ─── API Client ──────────────────────────────────────────────────────────────
def api_get(endpoint: str, params: dict = None) -> dict:
    """Make a GET request to api.bible with retries and rate limiting."""
    url = f"{BASE_URL}{endpoint}"
    if params:
        query = "&".join(f"{k}={quote(str(v))}" for k, v in params.items())
        url += f"?{query}"

    headers = {
        "api-key": API_KEY,
        "Accept": "application/json",
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            req = Request(url, headers=headers)
            with urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                time.sleep(RATE_LIMIT_DELAY)
                return data
        except HTTPError as e:
            if e.code == 429:
                wait = min(2 ** attempt, 60)
                log.warning(f"Rate limited (429). Waiting {wait}s... (attempt {attempt}/{MAX_RETRIES})")
                time.sleep(wait)
            elif e.code == 403:
                log.error(f"403 Forbidden: {url}")
                return None
            elif e.code == 404:
                log.warning(f"404 Not Found: {url}")
                return None
            else:
                log.error(f"HTTP {e.code}: {url} — {e.reason}")
                if attempt == MAX_RETRIES:
                    return None
                time.sleep(2 ** attempt)
        except (URLError, TimeoutError) as e:
            log.warning(f"Network error: {e} (attempt {attempt}/{MAX_RETRIES})")
            if attempt == MAX_RETRIES:
                return None
            time.sleep(2 ** attempt)

    return None


# ─── Bible Structure ─────────────────────────────────────────────────────────
def get_books() -> list[dict]:
    """Fetch list of all books in the Bible."""
    log.info("Fetching book list...")
    data = api_get(f"/bibles/{BIBLE_ID}/books")
    if not data:
        log.error("Failed to fetch books!")
        return []
    books = data.get("data", [])
    log.info(f"Found {len(books)} books")
    return books


def get_chapters(book_id: str) -> list[dict]:
    """Fetch list of chapters for a book."""
    data = api_get(f"/bibles/{BIBLE_ID}/books/{book_id}/chapters")
    if not data:
        return []
    return data.get("data", [])


def get_chapter_text(chapter_id: str) -> dict | None:
    """
    Fetch full chapter text.
    chapter_id format: e.g. 'GEN.1', 'PSA.119'
    """
    data = api_get(
        f"/bibles/{BIBLE_ID}/chapters/{chapter_id}",
        params={
            "content-type": "html",
            "include-notes": "false",
            "include-titles": "true",
            "include-chapter-numbers": "false",
            "include-verse-numbers": "true",
            "include-verse-spans": "true",
        },
    )
    if not data:
        return None
    return data.get("data")


def get_verses_for_chapter(chapter_id: str) -> list[dict]:
    """Fetch list of verses in a chapter."""
    data = api_get(f"/bibles/{BIBLE_ID}/chapters/{chapter_id}/verses")
    if not data:
        return []
    return data.get("data", [])


def get_verse_text(verse_id: str) -> dict | None:
    """
    Fetch individual verse text.
    verse_id format: e.g. 'GEN.1.1', 'JHN.3.16'
    """
    data = api_get(
        f"/bibles/{BIBLE_ID}/verses/{verse_id}",
        params={
            "content-type": "html",
            "include-notes": "false",
            "include-titles": "false",
            "include-chapter-numbers": "false",
            "include-verse-numbers": "false",
            "include-verse-spans": "false",
        },
    )
    if not data:
        return None
    return data.get("data")


# ─── Extraction Engine ───────────────────────────────────────────────────────
def extract_verse_number(verse_id: str) -> int:
    """Extract verse number from verse ID like 'GEN.1.1' → 1"""
    parts = verse_id.split(".")
    if len(parts) >= 3:
        # Handle ranges like 'GEN.1.1-GEN.1.2'
        try:
            return int(parts[2].split("-")[0])
        except ValueError:
            return 0
    return 0


def extract_chapter_number(chapter_id: str) -> int:
    """Extract chapter number from chapter ID like 'GEN.1' → 1"""
    parts = chapter_id.split(".")
    if len(parts) >= 2:
        try:
            return int(parts[1])
        except ValueError:
            return 0
    return 0


def extract_book(book: dict, progress_file: Path) -> dict:
    """
    Extract all verses for one book.
    Returns: {
        "book_id": "GEN",
        "book_name": "Genesis",
        "chapters": [
            {
                "chapter": 1,
                "chapter_id": "GEN.1",
                "verses": [
                    {"verse": 1, "verse_id": "GEN.1.1", "text": "In the beginning..."},
                    ...
                ]
            },
            ...
        ]
    }
    """
    book_id = book["id"]
    book_name = book.get("name", book_id)

    # Load progress
    progress = {}
    if progress_file.exists():
        progress = json.loads(progress_file.read_text(encoding="utf-8"))

    done_chapters = set(progress.get(book_id, []))

    log.info(f"📖 Extracting: {book_name} ({book_id})")

    chapters_data = get_chapters(book_id)
    if not chapters_data:
        log.error(f"  ❌ No chapters found for {book_id}")
        return {"book_id": book_id, "book_name": book_name, "chapters": []}

    # Filter out 'intro' chapters
    chapters_data = [c for c in chapters_data if "intro" not in c["id"].lower()]

    result_chapters = []

    for ch in chapters_data:
        ch_id = ch["id"]
        ch_num = extract_chapter_number(ch_id)

        if ch_id in done_chapters:
            # Load from cached file
            cache_file = OUTPUT_DIR / "cache" / f"{ch_id}.json"
            if cache_file.exists():
                cached = json.loads(cache_file.read_text(encoding="utf-8"))
                result_chapters.append(cached)
                log.info(f"  ✅ {ch_id} (cached)")
                continue

        log.info(f"  📄 Chapter {ch_id}...")

        # Get all verses in this chapter
        verses_list = get_verses_for_chapter(ch_id)
        if not verses_list:
            log.warning(f"  ⚠️ No verses found for {ch_id}")
            continue

        chapter_verses = []
        for v in verses_list:
            v_id = v["id"]
            v_num = extract_verse_number(v_id)

            # Fetch verse text
            verse_data = get_verse_text(v_id)
            if not verse_data:
                log.warning(f"    ⚠️ Failed to fetch {v_id}")
                continue

            raw_html = verse_data.get("content", "")
            clean_text = strip_html(raw_html).strip()

            # Clean up whitespace
            clean_text = re.sub(r"\s+", " ", clean_text).strip()

            if clean_text:
                chapter_verses.append({
                    "verse": v_num,
                    "verse_id": v_id,
                    "text": clean_text,
                })

        chapter_obj = {
            "chapter": ch_num,
            "chapter_id": ch_id,
            "verse_count": len(chapter_verses),
            "verses": chapter_verses,
        }

        result_chapters.append(chapter_obj)

        # Cache chapter
        cache_dir = OUTPUT_DIR / "cache"
        cache_dir.mkdir(parents=True, exist_ok=True)
        (cache_dir / f"{ch_id}.json").write_text(
            json.dumps(chapter_obj, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        # Update progress
        if book_id not in progress:
            progress[book_id] = []
        progress[book_id].append(ch_id)
        progress_file.write_text(json.dumps(progress, ensure_ascii=False), encoding="utf-8")

        log.info(f"  ✅ {ch_id}: {len(chapter_verses)} verses")

    return {
        "book_id": book_id,
        "book_name": book_name,
        "chapter_count": len(result_chapters),
        "chapters": result_chapters,
    }


# ─── Export Functions ─────────────────────────────────────────────────────────
def export_json_per_book(all_books: list[dict]):
    """Save one JSON file per book."""
    json_dir = OUTPUT_DIR / "json_books"
    json_dir.mkdir(parents=True, exist_ok=True)

    for book in all_books:
        fname = f"{book['book_id']}_{book['book_name'].replace(' ', '_')}.json"
        fpath = json_dir / fname
        fpath.write_text(json.dumps(book, ensure_ascii=False, indent=2), encoding="utf-8")

    log.info(f"📁 JSON per-book files saved to: {json_dir}")


def export_single_json(all_books: list[dict]):
    """Save complete Bible as single JSON file."""
    fpath = OUTPUT_DIR / "bible_complete.json"
    bible = {
        "bible_id": BIBLE_ID,
        "translation": "BSB (Berean Standard Bible)",
        "language": "English",
        "extracted_at": datetime.now().isoformat(),
        "book_count": len(all_books),
        "books": all_books,
    }
    fpath.write_text(json.dumps(bible, ensure_ascii=False, indent=2), encoding="utf-8")
    log.info(f"📄 Single JSON file saved to: {fpath}")


def export_sqlite(all_books: list[dict]):
    """Export to SQLite database."""
    db_path = OUTPUT_DIR / "bible.db"
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()

    # Create tables
    cur.executescript("""
        DROP TABLE IF EXISTS verses;
        DROP TABLE IF EXISTS chapters;
        DROP TABLE IF EXISTS books;

        CREATE TABLE books (
            book_id     TEXT PRIMARY KEY,
            book_name   TEXT NOT NULL,
            book_order  INTEGER,
            chapter_count INTEGER
        );

        CREATE TABLE chapters (
            chapter_id  TEXT PRIMARY KEY,
            book_id     TEXT NOT NULL,
            chapter_num INTEGER NOT NULL,
            verse_count INTEGER,
            FOREIGN KEY (book_id) REFERENCES books(book_id)
        );

        CREATE TABLE verses (
            verse_id    TEXT PRIMARY KEY,
            chapter_id  TEXT NOT NULL,
            book_id     TEXT NOT NULL,
            chapter_num INTEGER NOT NULL,
            verse_num   INTEGER NOT NULL,
            text        TEXT NOT NULL,
            FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id),
            FOREIGN KEY (book_id) REFERENCES books(book_id)
        );

        CREATE INDEX idx_verses_book ON verses(book_id);
        CREATE INDEX idx_verses_chapter ON verses(chapter_id);
        CREATE INDEX idx_verses_ref ON verses(book_id, chapter_num, verse_num);
    """)

    for order, book in enumerate(all_books, 1):
        cur.execute(
            "INSERT INTO books VALUES (?, ?, ?, ?)",
            (book["book_id"], book["book_name"], order, book.get("chapter_count", 0)),
        )

        for ch in book["chapters"]:
            cur.execute(
                "INSERT INTO chapters VALUES (?, ?, ?, ?)",
                (ch["chapter_id"], book["book_id"], ch["chapter"], ch.get("verse_count", 0)),
            )

            for v in ch["verses"]:
                cur.execute(
                    "INSERT INTO verses VALUES (?, ?, ?, ?, ?, ?)",
                    (v["verse_id"], ch["chapter_id"], book["book_id"],
                     ch["chapter"], v["verse"], v["text"]),
                )

    conn.commit()

    # Stats
    total_verses = cur.execute("SELECT COUNT(*) FROM verses").fetchone()[0]
    conn.close()

    log.info(f"🗄️ SQLite database saved to: {db_path} ({total_verses} verses)")


def export_csv(all_books: list[dict]):
    """Export to CSV files."""
    csv_dir = OUTPUT_DIR / "csv"
    csv_dir.mkdir(parents=True, exist_ok=True)

    # Single CSV with all verses
    all_csv = csv_dir / "bible_all_verses.csv"
    with open(all_csv, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["book_id", "book_name", "chapter", "verse", "verse_id", "text"])

        for book in all_books:
            for ch in book["chapters"]:
                for v in ch["verses"]:
                    writer.writerow([
                        book["book_id"],
                        book["book_name"],
                        ch["chapter"],
                        v["verse"],
                        v["verse_id"],
                        v["text"],
                    ])

    # Per-book CSV
    for book in all_books:
        fname = f"{book['book_id']}.csv"
        with open(csv_dir / fname, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(["chapter", "verse", "verse_id", "text"])
            for ch in book["chapters"]:
                for v in ch["verses"]:
                    writer.writerow([ch["chapter"], v["verse"], v["verse_id"], v["text"]])

    log.info(f"📊 CSV files saved to: {csv_dir}")


def export_postgresql(all_books: list[dict]):
    """Export to PostgreSQL. Requires psycopg2."""
    try:
        import psycopg2
    except ImportError:
        log.warning("⚠️ psycopg2 not installed. Skipping PostgreSQL export.")
        log.warning("   Install with: pip install psycopg2-binary")
        return

    if not PG_CONFIG.get("password"):
        log.warning("⚠️ PostgreSQL password not configured. Skipping.")
        return

    try:
        conn = psycopg2.connect(**PG_CONFIG)
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS bible_books (
                book_id     VARCHAR(10) PRIMARY KEY,
                book_name   VARCHAR(100) NOT NULL,
                book_order  INTEGER,
                chapter_count INTEGER
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS bible_chapters (
                chapter_id  VARCHAR(20) PRIMARY KEY,
                book_id     VARCHAR(10) NOT NULL REFERENCES bible_books(book_id),
                chapter_num INTEGER NOT NULL,
                verse_count INTEGER
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS bible_verses (
                verse_id    VARCHAR(30) PRIMARY KEY,
                chapter_id  VARCHAR(20) NOT NULL REFERENCES bible_chapters(chapter_id),
                book_id     VARCHAR(10) NOT NULL REFERENCES bible_books(book_id),
                chapter_num INTEGER NOT NULL,
                verse_num   INTEGER NOT NULL,
                text_en     TEXT NOT NULL,
                translation VARCHAR(10) DEFAULT 'BSB'
            );
        """)

        for order, book in enumerate(all_books, 1):
            cur.execute("""
                INSERT INTO bible_books VALUES (%s, %s, %s, %s)
                ON CONFLICT (book_id) DO UPDATE SET book_name=EXCLUDED.book_name
            """, (book["book_id"], book["book_name"], order, book.get("chapter_count", 0)))

            for ch in book["chapters"]:
                cur.execute("""
                    INSERT INTO bible_chapters VALUES (%s, %s, %s, %s)
                    ON CONFLICT (chapter_id) DO UPDATE SET verse_count=EXCLUDED.verse_count
                """, (ch["chapter_id"], book["book_id"], ch["chapter"], ch.get("verse_count", 0)))

                for v in ch["verses"]:
                    cur.execute("""
                        INSERT INTO bible_verses (verse_id, chapter_id, book_id, chapter_num, verse_num, text_en)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (verse_id) DO UPDATE SET text_en=EXCLUDED.text_en
                    """, (v["verse_id"], ch["chapter_id"], book["book_id"],
                          ch["chapter"], v["verse"], v["text"]))

        conn.commit()
        total = cur.execute("SELECT COUNT(*) FROM bible_verses")
        total = cur.fetchone()[0]
        cur.close()
        conn.close()

        log.info(f"🐘 PostgreSQL export done: {total} verses")

    except Exception as e:
        log.error(f"PostgreSQL error: {e}")


# ─── Statistics ──────────────────────────────────────────────────────────────
def print_stats(all_books: list[dict]):
    """Print extraction statistics."""
    total_chapters = sum(len(b["chapters"]) for b in all_books)
    total_verses = sum(
        len(ch["verses"])
        for b in all_books
        for ch in b["chapters"]
    )

    print("\n" + "=" * 60)
    print("  📊  EXTRACTION SUMMARY")
    print("=" * 60)
    print(f"  Translation : BSB (Berean Standard Bible)")
    print(f"  Bible ID    : {BIBLE_ID}")
    print(f"  Books       : {len(all_books)}")
    print(f"  Chapters    : {total_chapters}")
    print(f"  Verses      : {total_verses}")
    print(f"  Output      : {OUTPUT_DIR}")
    print("=" * 60)

    # Per-book summary
    print(f"\n  {'Book':<25} {'Chapters':>8} {'Verses':>8}")
    print(f"  {'-'*25} {'-'*8} {'-'*8}")
    for b in all_books:
        v_count = sum(len(ch["verses"]) for ch in b["chapters"])
        print(f"  {b['book_name']:<25} {len(b['chapters']):>8} {v_count:>8}")

    print()


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Bible Data Extractor")
    parser.add_argument("--book", type=str, help="Extract only one book (e.g. GEN, PSA, JHN)")
    parser.add_argument("--resume", action="store_true", help="Resume interrupted extraction")
    parser.add_argument("--no-sqlite", action="store_true", help="Skip SQLite export")
    parser.add_argument("--no-csv", action="store_true", help="Skip CSV export")
    parser.add_argument("--no-pg", action="store_true", help="Skip PostgreSQL export")
    args = parser.parse_args()

    # Create output directories
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "cache").mkdir(parents=True, exist_ok=True)

    # Update log file handler now that output dir exists
    for handler in log.handlers:
        if isinstance(handler, logging.FileHandler):
            handler.close()
            log.removeHandler(handler)
    log.addHandler(logging.FileHandler(OUTPUT_DIR / "extraction.log", encoding="utf-8"))

    progress_file = OUTPUT_DIR / "progress.json"

    print("""
╔══════════════════════════════════════════════════════════╗
║           📖  Bible Data Extractor v1.0                  ║
║           BSB (Berean Standard Bible)                    ║
║           api.bible → JSON / SQLite / CSV / PG           ║
╚══════════════════════════════════════════════════════════╝
    """)

    # Step 1: Get all books
    books = get_books()
    if not books:
        log.error("Could not fetch book list. Check API key and connection.")
        sys.exit(1)

    # Filter to single book if requested
    if args.book:
        books = [b for b in books if b["id"].upper() == args.book.upper()]
        if not books:
            log.error(f"Book '{args.book}' not found!")
            sys.exit(1)

    # Step 2: Extract each book
    all_books = []
    start = time.time()

    for i, book in enumerate(books, 1):
        print(f"\n{'─' * 50}")
        print(f"  [{i}/{len(books)}] {book.get('name', book['id'])}")
        print(f"{'─' * 50}")

        book_data = extract_book(book, progress_file)
        all_books.append(book_data)

        elapsed = time.time() - start
        rate = i / elapsed * 60 if elapsed > 0 else 0
        remaining = (len(books) - i) / rate if rate > 0 else 0
        log.info(f"Progress: {i}/{len(books)} books | {elapsed:.0f}s elapsed | ~{remaining:.0f}min remaining")

    # Step 3: Export
    print("\n\n📦 Exporting data...\n")

    export_json_per_book(all_books)
    export_single_json(all_books)

    if not args.no_sqlite:
        export_sqlite(all_books)

    if not args.no_csv:
        export_csv(all_books)

    if not args.no_pg:
        export_postgresql(all_books)

    # Step 4: Stats
    print_stats(all_books)

    elapsed = time.time() - start
    print(f"  ⏱️  Total time: {elapsed/60:.1f} minutes")
    print(f"  ✅ Done! All files in: {OUTPUT_DIR}\n")


if __name__ == "__main__":
    main()
