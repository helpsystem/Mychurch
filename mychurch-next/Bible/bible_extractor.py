#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════
  📖  YouVersion Bible Complete Extractor v2.0
═══════════════════════════════════════════════════════════════
  Extracts ALL Bible data from bible.com (YouVersion):
  
  ✅ Persian translations: NMV, TPV, مژده, PCB, POV, RCPV, BBK
  ✅ English translations: BSB, KJV, NIV, ESV, NLT, NKJV, NASB, MSG, CSB
  ✅ Full text (all 66 books, all chapters, all verses)
  ✅ Audio file links (mp3 + HLS streaming URLs)
  ✅ Section headings / titles
  ✅ Footnotes & cross-references
  ✅ Export: JSON (per-book + single), SQLite, CSV
  
  Data source: bible.com __NEXT_DATA__ JSON (embedded in HTML)
  
  Usage:
      python bible_extractor.py                       # Extract all
      python bible_extractor.py --versions 118,3034   # Specific versions
      python bible_extractor.py --book GEN            # One book only
      python bible_extractor.py --resume              # Resume interrupted
      python bible_extractor.py --list-versions       # Show version list
═══════════════════════════════════════════════════════════════
"""

import os
import sys
import json
import csv
import time
import sqlite3
import argparse
import re
import html
import logging
from pathlib import Path
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from html.parser import HTMLParser

# Fix Windows console encoding for Unicode output
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ═══════════════════════════════════════════════════════════════
#  CONFIGURATION
# ═══════════════════════════════════════════════════════════════

BASE_URL = "https://www.bible.com"
OUTPUT_DIR = Path(__file__).parent / "bible_output"
CACHE_DIR = OUTPUT_DIR / "cache"
RATE_LIMIT = 0.5           # seconds between requests
MAX_RETRIES = 5
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# ═══════════════════════════════════════════════════════════════
#  BIBLE VERSIONS
# ═══════════════════════════════════════════════════════════════

PERSIAN_VERSIONS = {
    118:  {"abbr": "NMV",   "name": "هزارۀ نو",                      "name_en": "New Millennium Version",       "lang": "fa", "publisher": "Elam Ministries"},
    181:  {"abbr": "TPV",   "name": "مژده برای عصر جدید",             "name_en": "Today's Persian Version",      "lang": "fa", "publisher": "United Bible Societies"},
    3737: {"abbr": "مژده",  "name": "مژده برای عصر جدید - ویرایش ۲۰۲۳", "name_en": "TPV 2023 Edition",            "lang": "fa", "publisher": "United Bible Societies"},
    1619: {"abbr": "PCB",   "name": "ترجمۀ معاصر",                    "name_en": "Persian Contemporary Bible",   "lang": "fa", "publisher": "Biblica, Inc."},
    136:  {"abbr": "POV",   "name": "ترجمۀ قدیم",                     "name_en": "Persian Old Version",          "lang": "fa", "publisher": "Elam Ministries"},
    4205: {"abbr": "RCPV",  "name": "ترجمه کلاسیک بازنگری شده",       "name_en": "Revised Classic Persian",      "lang": "fa", "publisher": "Korpu Company"},
    4204: {"abbr": "BBK",   "name": "کتاب مقدس به زبان بندری",        "name_en": "Bandari Bible",                "lang": "fa", "publisher": "Korpu Company"},
    3950: {"abbr": "PES",   "name": "Bandari Bible - Korpu",          "name_en": "Bandari Bible Korpu",          "lang": "fa", "publisher": "The Seed Company"},
}

ENGLISH_VERSIONS = {
    3034: {"abbr": "BSB",   "name": "Berean Standard Bible",          "lang": "en", "publisher": "BSB Publishing"},
    1:    {"abbr": "KJV",   "name": "King James Version",             "lang": "en", "publisher": "Cambridge Univ. Press"},
    111:  {"abbr": "NIV",   "name": "New International Version",      "lang": "en", "publisher": "Biblica, Inc."},
    59:   {"abbr": "ESV",   "name": "English Standard Version 2025",  "lang": "en", "publisher": "Crossway"},
    116:  {"abbr": "NLT",   "name": "New Living Translation",         "lang": "en", "publisher": "Tyndale House"},
    114:  {"abbr": "NKJV",  "name": "New King James Version",         "lang": "en", "publisher": "Thomas Nelson"},
    100:  {"abbr": "NASB1995", "name": "NASB 1995",                   "lang": "en", "publisher": "The Lockman Foundation"},
    2692: {"abbr": "NASB2020", "name": "NASB 2020",                   "lang": "en", "publisher": "The Lockman Foundation"},
    97:   {"abbr": "MSG",   "name": "The Message",                    "lang": "en", "publisher": "Tyndale House"},
    1713: {"abbr": "CSB",   "name": "Christian Standard Bible",       "lang": "en", "publisher": "LifeWay"},
    12:   {"abbr": "ASV",   "name": "American Standard Version",      "lang": "en", "publisher": "Public Domain"},
    72:   {"abbr": "HCSB",  "name": "Holman Christian Standard Bible", "lang": "en", "publisher": "LifeWay"},
    90:   {"abbr": "LEB",   "name": "Lexham English Bible",           "lang": "en", "publisher": "Logos Bible Software"},
    206:  {"abbr": "WEB",   "name": "World English Bible",            "lang": "en", "publisher": "eBible.org"},
    68:   {"abbr": "GNT",   "name": "Good News Translation",          "lang": "en", "publisher": "American Bible Society"},
    2079: {"abbr": "EASY",  "name": "EasyEnglish Bible 2024",         "lang": "en", "publisher": "MissionAssist"},
}

ALL_VERSIONS = {**PERSIAN_VERSIONS, **ENGLISH_VERSIONS}

# ═══════════════════════════════════════════════════════════════
#  BIBLE BOOKS (Standard 66)
# ═══════════════════════════════════════════════════════════════

BIBLE_BOOKS = [
    # Old Testament (39 books)
    {"id": "GEN", "name_en": "Genesis",        "name_fa": "پیدایش",       "chapters": 50, "testament": "OT"},
    {"id": "EXO", "name_en": "Exodus",         "name_fa": "خروج",         "chapters": 40, "testament": "OT"},
    {"id": "LEV", "name_en": "Leviticus",      "name_fa": "لاویان",       "chapters": 27, "testament": "OT"},
    {"id": "NUM", "name_en": "Numbers",        "name_fa": "اعداد",        "chapters": 36, "testament": "OT"},
    {"id": "DEU", "name_en": "Deuteronomy",    "name_fa": "تثنیه",        "chapters": 34, "testament": "OT"},
    {"id": "JOS", "name_en": "Joshua",         "name_fa": "یوشع",         "chapters": 24, "testament": "OT"},
    {"id": "JDG", "name_en": "Judges",         "name_fa": "داوران",       "chapters": 21, "testament": "OT"},
    {"id": "RUT", "name_en": "Ruth",           "name_fa": "روت",          "chapters": 4,  "testament": "OT"},
    {"id": "1SA", "name_en": "1 Samuel",       "name_fa": "اول سموئیل",   "chapters": 31, "testament": "OT"},
    {"id": "2SA", "name_en": "2 Samuel",       "name_fa": "دوم سموئیل",   "chapters": 24, "testament": "OT"},
    {"id": "1KI", "name_en": "1 Kings",        "name_fa": "اول پادشاهان", "chapters": 22, "testament": "OT"},
    {"id": "2KI", "name_en": "2 Kings",        "name_fa": "دوم پادشاهان", "chapters": 25, "testament": "OT"},
    {"id": "1CH", "name_en": "1 Chronicles",   "name_fa": "اول تواریخ",   "chapters": 29, "testament": "OT"},
    {"id": "2CH", "name_en": "2 Chronicles",   "name_fa": "دوم تواریخ",   "chapters": 36, "testament": "OT"},
    {"id": "EZR", "name_en": "Ezra",           "name_fa": "عزرا",         "chapters": 10, "testament": "OT"},
    {"id": "NEH", "name_en": "Nehemiah",       "name_fa": "نحمیا",        "chapters": 13, "testament": "OT"},
    {"id": "EST", "name_en": "Esther",         "name_fa": "استر",         "chapters": 10, "testament": "OT"},
    {"id": "JOB", "name_en": "Job",            "name_fa": "ایوب",         "chapters": 42, "testament": "OT"},
    {"id": "PSA", "name_en": "Psalms",         "name_fa": "مزامیر",       "chapters": 150,"testament": "OT"},
    {"id": "PRO", "name_en": "Proverbs",       "name_fa": "امثال",        "chapters": 31, "testament": "OT"},
    {"id": "ECC", "name_en": "Ecclesiastes",   "name_fa": "جامعه",        "chapters": 12, "testament": "OT"},
    {"id": "SNG", "name_en": "Song of Solomon","name_fa": "غزل غزلها",    "chapters": 8,  "testament": "OT"},
    {"id": "ISA", "name_en": "Isaiah",         "name_fa": "اشعیا",        "chapters": 66, "testament": "OT"},
    {"id": "JER", "name_en": "Jeremiah",       "name_fa": "ارمیا",        "chapters": 52, "testament": "OT"},
    {"id": "LAM", "name_en": "Lamentations",   "name_fa": "مراثی",        "chapters": 5,  "testament": "OT"},
    {"id": "EZK", "name_en": "Ezekiel",        "name_fa": "حزقیال",       "chapters": 48, "testament": "OT"},
    {"id": "DAN", "name_en": "Daniel",         "name_fa": "دانیال",       "chapters": 12, "testament": "OT"},
    {"id": "HOS", "name_en": "Hosea",          "name_fa": "هوشع",         "chapters": 14, "testament": "OT"},
    {"id": "JOL", "name_en": "Joel",           "name_fa": "یوئیل",        "chapters": 3,  "testament": "OT"},
    {"id": "AMO", "name_en": "Amos",           "name_fa": "عاموس",        "chapters": 9,  "testament": "OT"},
    {"id": "OBA", "name_en": "Obadiah",        "name_fa": "عوبدیا",       "chapters": 1,  "testament": "OT"},
    {"id": "JON", "name_en": "Jonah",          "name_fa": "یونس",         "chapters": 4,  "testament": "OT"},
    {"id": "MIC", "name_en": "Micah",          "name_fa": "میکاه",        "chapters": 7,  "testament": "OT"},
    {"id": "NAM", "name_en": "Nahum",          "name_fa": "ناحوم",        "chapters": 3,  "testament": "OT"},
    {"id": "HAB", "name_en": "Habakkuk",       "name_fa": "حبقوق",        "chapters": 3,  "testament": "OT"},
    {"id": "ZEP", "name_en": "Zephaniah",      "name_fa": "صفنیا",        "chapters": 3,  "testament": "OT"},
    {"id": "HAG", "name_en": "Haggai",         "name_fa": "حجی",          "chapters": 2,  "testament": "OT"},
    {"id": "ZEC", "name_en": "Zechariah",      "name_fa": "زکریا",        "chapters": 14, "testament": "OT"},
    {"id": "MAL", "name_en": "Malachi",        "name_fa": "ملاکی",        "chapters": 4,  "testament": "OT"},
    # New Testament (27 books)
    {"id": "MAT", "name_en": "Matthew",        "name_fa": "متی",          "chapters": 28, "testament": "NT"},
    {"id": "MRK", "name_en": "Mark",           "name_fa": "مرقس",         "chapters": 16, "testament": "NT"},
    {"id": "LUK", "name_en": "Luke",           "name_fa": "لوقا",         "chapters": 24, "testament": "NT"},
    {"id": "JHN", "name_en": "John",           "name_fa": "یوحنا",        "chapters": 21, "testament": "NT"},
    {"id": "ACT", "name_en": "Acts",           "name_fa": "اعمال رسولان", "chapters": 28, "testament": "NT"},
    {"id": "ROM", "name_en": "Romans",         "name_fa": "رومیان",       "chapters": 16, "testament": "NT"},
    {"id": "1CO", "name_en": "1 Corinthians",  "name_fa": "اول قرنتیان",  "chapters": 16, "testament": "NT"},
    {"id": "2CO", "name_en": "2 Corinthians",  "name_fa": "دوم قرنتیان",  "chapters": 13, "testament": "NT"},
    {"id": "GAL", "name_en": "Galatians",      "name_fa": "غلاطیان",      "chapters": 6,  "testament": "NT"},
    {"id": "EPH", "name_en": "Ephesians",      "name_fa": "افسسیان",      "chapters": 6,  "testament": "NT"},
    {"id": "PHP", "name_en": "Philippians",    "name_fa": "فیلیپیان",     "chapters": 4,  "testament": "NT"},
    {"id": "COL", "name_en": "Colossians",     "name_fa": "کولسیان",      "chapters": 4,  "testament": "NT"},
    {"id": "1TH", "name_en": "1 Thessalonians","name_fa": "اول تسالونیکیان","chapters": 5, "testament": "NT"},
    {"id": "2TH", "name_en": "2 Thessalonians","name_fa": "دوم تسالونیکیان","chapters": 3, "testament": "NT"},
    {"id": "1TI", "name_en": "1 Timothy",      "name_fa": "اول تیموتائوس","chapters": 6,  "testament": "NT"},
    {"id": "2TI", "name_en": "2 Timothy",      "name_fa": "دوم تیموتائوس","chapters": 4,  "testament": "NT"},
    {"id": "TIT", "name_en": "Titus",          "name_fa": "تیتوس",        "chapters": 3,  "testament": "NT"},
    {"id": "PHM", "name_en": "Philemon",       "name_fa": "فیلیمون",      "chapters": 1,  "testament": "NT"},
    {"id": "HEB", "name_en": "Hebrews",        "name_fa": "عبرانیان",     "chapters": 13, "testament": "NT"},
    {"id": "JAS", "name_en": "James",          "name_fa": "یعقوب",        "chapters": 5,  "testament": "NT"},
    {"id": "1PE", "name_en": "1 Peter",        "name_fa": "اول پطرس",     "chapters": 5,  "testament": "NT"},
    {"id": "2PE", "name_en": "2 Peter",        "name_fa": "دوم پطرس",     "chapters": 3,  "testament": "NT"},
    {"id": "1JN", "name_en": "1 John",         "name_fa": "اول یوحنا",    "chapters": 5,  "testament": "NT"},
    {"id": "2JN", "name_en": "2 John",         "name_fa": "دوم یوحنا",    "chapters": 1,  "testament": "NT"},
    {"id": "3JN", "name_en": "3 John",         "name_fa": "سوم یوحنا",    "chapters": 1,  "testament": "NT"},
    {"id": "JUD", "name_en": "Jude",           "name_fa": "یهودا",        "chapters": 1,  "testament": "NT"},
    {"id": "REV", "name_en": "Revelation",     "name_fa": "مکاشفه",       "chapters": 22, "testament": "NT"},
]

TOTAL_CHAPTERS = sum(b["chapters"] for b in BIBLE_BOOKS)  # 1189


# ═══════════════════════════════════════════════════════════════
#  LOGGING
# ═══════════════════════════════════════════════════════════════

def setup_logging():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(OUTPUT_DIR / "extraction.log", encoding="utf-8"),
        ],
    )
    return logging.getLogger("bible")


# ═══════════════════════════════════════════════════════════════
#  HTML PARSER — Extract verses from YouVersion HTML
# ═══════════════════════════════════════════════════════════════

class VerseExtractor(HTMLParser):
    """
    Parses YouVersion chapter HTML. Extracts:
    - Verses (number + text)
    - Section headings
    - Footnotes
    """
    def __init__(self):
        super().__init__()
        self.verses = {}        # {verse_num: text}
        self.headings = []      # [{"before_verse": N, "text": "..."}]
        self.footnotes = []     # [{"verse": N, "text": "..."}]
        
        self._current_verse = None
        self._in_content = False
        self._in_heading = False
        self._in_note = False
        self._in_label = False
        self._heading_text = ""
        self._note_text = ""
        self._label_text = ""
        self._depth = 0
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        cls = attrs_dict.get("class", "")
        usfm = attrs_dict.get("data-usfm", "")
        
        # Verse span: <span class="verse v1" data-usfm="GEN.1.1">
        if "verse" in cls and usfm:
            parts = usfm.split(".")
            if len(parts) >= 3:
                try:
                    v_num = int(parts[2].split("-")[0])
                    self._current_verse = v_num
                    if v_num not in self.verses:
                        self.verses[v_num] = ""
                except ValueError:
                    pass
        
        # Content span
        if cls == "content":
            self._in_content = True
        
        # Label (verse number display)
        if cls == "label":
            self._in_label = True
            self._label_text = ""
        
        # Section heading
        if cls == "heading":
            self._in_heading = True
            self._heading_text = ""
        
        # Footnote
        if "note" in cls and tag == "span":
            self._in_note = True
            self._note_text = ""
        
        # Line break
        if tag in ("br",) and self._in_content and self._current_verse:
            self.verses[self._current_verse] += " "
            
    def handle_endtag(self, tag):
        if tag == "span":
            if self._in_heading:
                self._in_heading = False
                if self._heading_text.strip():
                    self.headings.append({
                        "before_verse": self._current_verse or 1,
                        "text": self._heading_text.strip(),
                    })
            if self._in_note:
                self._in_note = False
                if self._note_text.strip():
                    self.footnotes.append({
                        "verse": self._current_verse,
                        "text": self._note_text.strip(),
                    })
            if self._in_label:
                self._in_label = False
            self._in_content = False
    
    def handle_data(self, data):
        if self._in_label:
            self._label_text += data
            return
            
        if self._in_heading:
            self._heading_text += data
            return
            
        if self._in_note:
            self._note_text += data
            return
            
        if self._in_content and self._current_verse is not None:
            self.verses[self._current_verse] += data
    
    def handle_entityref(self, name):
        char = html.unescape(f"&{name};")
        if self._in_content and self._current_verse is not None:
            self.verses[self._current_verse] += char
        elif self._in_heading:
            self._heading_text += char
        elif self._in_note:
            self._note_text += char
    
    def handle_charref(self, name):
        char = html.unescape(f"&#{name};")
        if self._in_content and self._current_verse is not None:
            self.verses[self._current_verse] += char
        elif self._in_heading:
            self._heading_text += char
        elif self._in_note:
            self._note_text += char
    
    def get_results(self):
        """Return cleaned-up results."""
        clean_verses = []
        for v_num in sorted(self.verses.keys()):
            text = self.verses[v_num]
            # Normalize whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            if text:
                clean_verses.append({"verse": v_num, "text": text})
        
        return {
            "verses": clean_verses,
            "headings": self.headings,
            "footnotes": self.footnotes,
        }


def parse_chapter_html(html_content: str) -> dict:
    """Parse YouVersion chapter HTML and extract structured data."""
    if not html_content:
        return {"verses": [], "headings": [], "footnotes": []}
    
    # Decode HTML entities in the content first
    content = html.unescape(html_content)
    
    parser = VerseExtractor()
    try:
        parser.feed(content)
    except Exception:
        pass
    
    return parser.get_results()


# ═══════════════════════════════════════════════════════════════
#  WEB FETCHER
# ═══════════════════════════════════════════════════════════════

def fetch_page(url: str, retries: int = MAX_RETRIES) -> str | None:
    """Fetch a web page and return HTML content."""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
    }
    
    for attempt in range(1, retries + 1):
        try:
            req = Request(url, headers=headers)
            with urlopen(req, timeout=20) as resp:
                data = resp.read().decode("utf-8")
                time.sleep(RATE_LIMIT)
                return data
        except HTTPError as e:
            if e.code == 429:
                wait = min(2 ** attempt * 2, 120)
                log.warning(f"  ⏳ Rate limited (429). Waiting {wait}s... [{attempt}/{retries}]")
                time.sleep(wait)
            elif e.code in (403, 404):
                log.warning(f"  ⚠️ HTTP {e.code}: {url}")
                return None
            else:
                log.error(f"  ❌ HTTP {e.code}: {url}")
                if attempt == retries:
                    return None
                time.sleep(2 ** attempt)
        except (URLError, TimeoutError, OSError) as e:
            log.warning(f"  🔄 Network error: {e} [{attempt}/{retries}]")
            if attempt == retries:
                return None
            time.sleep(2 ** attempt)
    
    return None


def extract_next_data(html_content: str) -> dict:
    """Extract __NEXT_DATA__ JSON from a YouVersion page."""
    match = re.search(
        r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
        html_content, re.DOTALL
    )
    if not match:
        return {}
    
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        return {}


# ═══════════════════════════════════════════════════════════════
#  CHAPTER EXTRACTOR
# ═══════════════════════════════════════════════════════════════

def extract_chapter(version_id: int, book_id: str, chapter: int, version_abbr: str) -> dict | None:
    """
    Extract a single chapter from YouVersion.
    Returns structured data with text, audio, headings, footnotes.
    """
    cache_file = CACHE_DIR / str(version_id) / f"{book_id}.{chapter}.json"
    
    # Check cache
    if cache_file.exists():
        try:
            cached = json.loads(cache_file.read_text(encoding="utf-8"))
            if cached.get("verses"):  # Valid cache
                return cached
        except (json.JSONDecodeError, KeyError):
            pass
    
    # Fetch the chapter page (URL-encode abbr for non-ASCII like مژده)
    encoded_abbr = quote(version_abbr, safe='')
    url = f"{BASE_URL}/bible/{version_id}/{book_id}.{chapter}.{encoded_abbr}"
    page_html = fetch_page(url)
    
    if not page_html:
        return None
    
    # Extract __NEXT_DATA__
    next_data = extract_next_data(page_html)
    if not next_data:
        log.warning(f"    No __NEXT_DATA__ in {book_id}.{chapter}")
        return None
    
    props = next_data.get("props", {}).get("pageProps", {})
    chapter_info = props.get("chapterInfo") or {}
    
    # 1. Parse chapter text HTML
    content_html = chapter_info.get("content", "")
    parsed = parse_chapter_html(content_html)
    
    # 2. Extract audio info
    audio_info = []
    audio_chapter = chapter_info.get("audioChapterInfo")
    if audio_chapter:
        for aci in audio_chapter:
            dl = aci.get("download_urls", {})
            mp3_url = dl.get("format_mp3_32k", "")
            hls_url = dl.get("format_hls", "")
            
            # Make URLs absolute
            if mp3_url and mp3_url.startswith("//"):
                mp3_url = "https:" + mp3_url
            if hls_url and hls_url.startswith("//"):
                hls_url = "https:" + hls_url
            
            audio_info.append({
                "audio_version_id": aci.get("id"),
                "title": aci.get("title", ""),
                "dramatized": aci.get("dramatized", False),
                "timing_available": aci.get("timing_available", False),
                "mp3_url": mp3_url,
                "hls_url": hls_url,
            })
    
    # 3. Get version data
    version_data = props.get("versionData", {})
    
    # Build result
    result = {
        "book_id": book_id,
        "chapter": chapter,
        "chapter_usfm": f"{book_id}.{chapter}",
        "version_id": version_id,
        "version_abbr": version_abbr,
        "verses": parsed["verses"],
        "verse_count": len(parsed["verses"]),
        "headings": parsed["headings"],
        "footnotes": parsed["footnotes"],
        "audio": audio_info,
        "has_audio": len(audio_info) > 0,
        "raw_html": content_html if len(content_html) < 100000 else "",  # Skip very large HTML
    }
    
    # Cache it
    cache_file.parent.mkdir(parents=True, exist_ok=True)
    cache_file.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    
    return result


# ═══════════════════════════════════════════════════════════════
#  BOOK EXTRACTOR
# ═══════════════════════════════════════════════════════════════

def extract_book(version_id: int, book: dict, version_info: dict, progress: dict) -> dict:
    """Extract all chapters of one book for one version."""
    book_id = book["id"]
    v_abbr = version_info["abbr"]
    total_ch = book["chapters"]
    
    done_key = f"{version_id}:{book_id}"
    done_chapters = set(progress.get(done_key, []))
    
    chapters = []
    
    for ch in range(1, total_ch + 1):
        ch_key = f"{book_id}.{ch}"
        
        ch_data = extract_chapter(version_id, book_id, ch, v_abbr)
        
        if ch_data:
            chapters.append(ch_data)
            v_count = ch_data.get("verse_count", 0)
            has_audio = "🔊" if ch_data.get("has_audio") else "  "
            log.info(f"    ✅ {ch_key} — {v_count} verses {has_audio}")
        else:
            log.warning(f"    ❌ {ch_key} — failed")
        
        # Update progress
        if done_key not in progress:
            progress[done_key] = []
        if ch_key not in progress[done_key]:
            progress[done_key].append(ch_key)
    
    return {
        "book_id": book_id,
        "book_name_en": book["name_en"],
        "book_name_fa": book["name_fa"],
        "testament": book["testament"],
        "version_id": version_id,
        "version_abbr": v_abbr,
        "version_name": version_info.get("name", v_abbr),
        "language": version_info.get("lang", ""),
        "chapter_count": len(chapters),
        "total_verses": sum(c.get("verse_count", 0) for c in chapters),
        "chapters": chapters,
    }


# ═══════════════════════════════════════════════════════════════
#  FULL EXTRACTION
# ═══════════════════════════════════════════════════════════════

def run_extraction(version_ids: list[int], book_filter: str | None, resume: bool) -> dict:
    """
    Main extraction loop.
    Returns: { version_id: { "version_info": ..., "books": [...] } }
    """
    progress_file = OUTPUT_DIR / "progress.json"
    progress = {}
    if resume and progress_file.exists():
        progress = json.loads(progress_file.read_text(encoding="utf-8"))
        log.info(f"📂 Resuming from previous progress ({len(progress)} entries)")
    
    results = {}
    
    total_versions = len(version_ids)
    
    for vi, version_id in enumerate(version_ids, 1):
        version_info = ALL_VERSIONS.get(version_id)
        if not version_info:
            log.error(f"Unknown version ID: {version_id}")
            continue
        
        v_abbr = version_info["abbr"]
        v_name = version_info.get("name", v_abbr)
        lang = version_info.get("lang", "?")
        
        print(f"\n{'═' * 60}")
        print(f"  [{vi}/{total_versions}] {v_name} ({v_abbr}) — {lang.upper()}")
        print(f"  Version ID: {version_id}")
        print(f"{'═' * 60}")
        
        books_data = []
        books_to_process = BIBLE_BOOKS
        
        if book_filter:
            books_to_process = [b for b in BIBLE_BOOKS if b["id"].upper() == book_filter.upper()]
            if not books_to_process:
                log.error(f"Book '{book_filter}' not found!")
                continue
        
        for bi, book in enumerate(books_to_process, 1):
            print(f"\n  📖 [{bi}/{len(books_to_process)}] {book['name_en']} ({book['name_fa']}) — {book['chapters']} chapters")
            
            book_data = extract_book(version_id, book, version_info, progress)
            books_data.append(book_data)
            
            # Save progress
            progress_file.write_text(json.dumps(progress, ensure_ascii=False), encoding="utf-8")
            
            total_v = book_data.get("total_verses", 0)
            log.info(f"  📊 {book['name_en']}: {book_data['chapter_count']} chapters, {total_v} verses")
        
        results[version_id] = {
            "version_id": version_id,
            "version_info": version_info,
            "books": books_data,
        }
    
    return results


# ═══════════════════════════════════════════════════════════════
#  EXPORT — JSON
# ═══════════════════════════════════════════════════════════════

def export_json(results: dict):
    """Export JSON files: per-book and single complete file per version."""
    
    for vid, vdata in results.items():
        v_abbr = vdata["version_info"]["abbr"]
        v_name = vdata["version_info"].get("name", v_abbr)
        lang = vdata["version_info"].get("lang", "unknown")
        
        # Per-book JSON
        book_dir = OUTPUT_DIR / "json" / f"{vid}_{v_abbr}"
        book_dir.mkdir(parents=True, exist_ok=True)
        
        for book in vdata["books"]:
            # Remove raw_html from export to save space
            export_book = json.loads(json.dumps(book))
            for ch in export_book.get("chapters", []):
                ch.pop("raw_html", None)
            
            fname = f"{book['book_id']}_{book['book_name_en'].replace(' ', '_')}.json"
            (book_dir / fname).write_text(
                json.dumps(export_book, ensure_ascii=False, indent=2), encoding="utf-8"
            )
        
        # Single complete JSON
        complete = {
            "version_id": vid,
            "version_abbr": v_abbr,
            "version_name": v_name,
            "language": lang,
            "extracted_at": datetime.now().isoformat(),
            "book_count": len(vdata["books"]),
            "total_chapters": sum(b.get("chapter_count", 0) for b in vdata["books"]),
            "total_verses": sum(b.get("total_verses", 0) for b in vdata["books"]),
            "books": [],
        }
        for book in vdata["books"]:
            export_book = json.loads(json.dumps(book))
            for ch in export_book.get("chapters", []):
                ch.pop("raw_html", None)
            complete["books"].append(export_book)
        
        fpath = OUTPUT_DIR / "json" / f"bible_{vid}_{v_abbr}_complete.json"
        fpath.write_text(json.dumps(complete, ensure_ascii=False, indent=2), encoding="utf-8")
        
        log.info(f"  📁 JSON exported: {v_abbr} ({vid}) — {book_dir}")


# ═══════════════════════════════════════════════════════════════
#  EXPORT — SQLite
# ═══════════════════════════════════════════════════════════════

def export_sqlite(results: dict):
    """Export all data to a single SQLite database."""
    db_path = OUTPUT_DIR / "bible_complete.db"
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()
    
    cur.executescript("""
        DROP TABLE IF EXISTS audio;
        DROP TABLE IF EXISTS footnotes;
        DROP TABLE IF EXISTS headings;
        DROP TABLE IF EXISTS verses;
        DROP TABLE IF EXISTS chapters;
        DROP TABLE IF EXISTS books;
        DROP TABLE IF EXISTS versions;
        
        CREATE TABLE versions (
            version_id   INTEGER PRIMARY KEY,
            abbr         TEXT NOT NULL,
            name         TEXT NOT NULL,
            language     TEXT,
            publisher    TEXT
        );
        
        CREATE TABLE books (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            version_id   INTEGER NOT NULL,
            book_id      TEXT NOT NULL,
            book_name_en TEXT,
            book_name_fa TEXT,
            testament    TEXT,
            book_order   INTEGER,
            chapter_count INTEGER,
            total_verses INTEGER,
            FOREIGN KEY (version_id) REFERENCES versions(version_id),
            UNIQUE(version_id, book_id)
        );
        
        CREATE TABLE chapters (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            version_id   INTEGER NOT NULL,
            book_id      TEXT NOT NULL,
            chapter_num  INTEGER NOT NULL,
            chapter_usfm TEXT,
            verse_count  INTEGER,
            has_audio    BOOLEAN DEFAULT 0,
            FOREIGN KEY (version_id) REFERENCES versions(version_id),
            UNIQUE(version_id, book_id, chapter_num)
        );
        
        CREATE TABLE verses (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            version_id   INTEGER NOT NULL,
            book_id      TEXT NOT NULL,
            chapter_num  INTEGER NOT NULL,
            verse_num    INTEGER NOT NULL,
            verse_usfm   TEXT,
            text         TEXT NOT NULL,
            FOREIGN KEY (version_id) REFERENCES versions(version_id),
            UNIQUE(version_id, book_id, chapter_num, verse_num)
        );
        
        CREATE TABLE headings (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            version_id   INTEGER NOT NULL,
            book_id      TEXT NOT NULL,
            chapter_num  INTEGER NOT NULL,
            before_verse INTEGER,
            text         TEXT,
            FOREIGN KEY (version_id) REFERENCES versions(version_id)
        );
        
        CREATE TABLE footnotes (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            version_id   INTEGER NOT NULL,
            book_id      TEXT NOT NULL,
            chapter_num  INTEGER NOT NULL,
            verse_num    INTEGER,
            text         TEXT,
            FOREIGN KEY (version_id) REFERENCES versions(version_id)
        );
        
        CREATE TABLE audio (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            version_id      INTEGER NOT NULL,
            book_id         TEXT NOT NULL,
            chapter_num     INTEGER NOT NULL,
            audio_version_id INTEGER,
            title           TEXT,
            dramatized      BOOLEAN DEFAULT 0,
            mp3_url         TEXT,
            hls_url         TEXT,
            FOREIGN KEY (version_id) REFERENCES versions(version_id),
            UNIQUE(version_id, book_id, chapter_num, audio_version_id)
        );
        
        CREATE INDEX idx_verses_ref ON verses(version_id, book_id, chapter_num, verse_num);
        CREATE INDEX idx_verses_book ON verses(book_id);
        CREATE INDEX idx_verses_version ON verses(version_id);
        CREATE INDEX idx_audio_ref ON audio(version_id, book_id, chapter_num);
    """)
    
    for vid, vdata in results.items():
        vi = vdata["version_info"]
        cur.execute("INSERT OR REPLACE INTO versions VALUES (?,?,?,?,?)",
                    (vid, vi["abbr"], vi.get("name", vi["abbr"]),
                     vi.get("lang", ""), vi.get("publisher", "")))
        
        for order, book in enumerate(vdata["books"], 1):
            cur.execute(
                "INSERT OR REPLACE INTO books (version_id, book_id, book_name_en, book_name_fa, testament, book_order, chapter_count, total_verses) VALUES (?,?,?,?,?,?,?,?)",
                (vid, book["book_id"], book["book_name_en"], book["book_name_fa"],
                 book["testament"], order, book["chapter_count"], book["total_verses"])
            )
            
            for ch in book["chapters"]:
                ch_num = ch["chapter"]
                cur.execute(
                    "INSERT OR REPLACE INTO chapters (version_id, book_id, chapter_num, chapter_usfm, verse_count, has_audio) VALUES (?,?,?,?,?,?)",
                    (vid, book["book_id"], ch_num, ch.get("chapter_usfm", ""),
                     ch.get("verse_count", 0), 1 if ch.get("has_audio") else 0)
                )
                
                for v in ch.get("verses", []):
                    cur.execute(
                        "INSERT OR REPLACE INTO verses (version_id, book_id, chapter_num, verse_num, verse_usfm, text) VALUES (?,?,?,?,?,?)",
                        (vid, book["book_id"], ch_num, v["verse"],
                         f"{book['book_id']}.{ch_num}.{v['verse']}", v["text"])
                    )
                
                for h in ch.get("headings", []):
                    cur.execute(
                        "INSERT INTO headings (version_id, book_id, chapter_num, before_verse, text) VALUES (?,?,?,?,?)",
                        (vid, book["book_id"], ch_num, h.get("before_verse"), h.get("text", ""))
                    )
                
                for fn in ch.get("footnotes", []):
                    cur.execute(
                        "INSERT INTO footnotes (version_id, book_id, chapter_num, verse_num, text) VALUES (?,?,?,?,?)",
                        (vid, book["book_id"], ch_num, fn.get("verse"), fn.get("text", ""))
                    )
                
                for aud in ch.get("audio", []):
                    cur.execute(
                        "INSERT OR REPLACE INTO audio (version_id, book_id, chapter_num, audio_version_id, title, dramatized, mp3_url, hls_url) VALUES (?,?,?,?,?,?,?,?)",
                        (vid, book["book_id"], ch_num, aud.get("audio_version_id"),
                         aud.get("title", ""), 1 if aud.get("dramatized") else 0,
                         aud.get("mp3_url", ""), aud.get("hls_url", ""))
                    )
    
    conn.commit()
    
    total = cur.execute("SELECT COUNT(*) FROM verses").fetchone()[0]
    total_audio = cur.execute("SELECT COUNT(*) FROM audio WHERE mp3_url != ''").fetchone()[0]
    conn.close()
    
    log.info(f"  🗄️ SQLite: {db_path} — {total} verses, {total_audio} audio links")


# ═══════════════════════════════════════════════════════════════
#  EXPORT — CSV
# ═══════════════════════════════════════════════════════════════

def export_csv(results: dict):
    """Export CSV files."""
    csv_dir = OUTPUT_DIR / "csv"
    csv_dir.mkdir(parents=True, exist_ok=True)
    
    # All verses CSV
    all_csv = csv_dir / "all_verses.csv"
    with open(all_csv, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["version_id", "version_abbr", "language", "book_id", "book_name_en",
                     "book_name_fa", "testament", "chapter", "verse", "usfm", "text"])
        
        for vid, vdata in results.items():
            vi = vdata["version_info"]
            for book in vdata["books"]:
                for ch in book["chapters"]:
                    for v in ch.get("verses", []):
                        w.writerow([
                            vid, vi["abbr"], vi.get("lang", ""),
                            book["book_id"], book["book_name_en"], book["book_name_fa"],
                            book["testament"], ch["chapter"], v["verse"],
                            f"{book['book_id']}.{ch['chapter']}.{v['verse']}", v["text"]
                        ])
    
    # Audio links CSV
    audio_csv = csv_dir / "all_audio_links.csv"
    with open(audio_csv, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["version_id", "version_abbr", "book_id", "chapter",
                     "audio_title", "dramatized", "mp3_url", "hls_url"])
        
        for vid, vdata in results.items():
            vi = vdata["version_info"]
            for book in vdata["books"]:
                for ch in book["chapters"]:
                    for aud in ch.get("audio", []):
                        w.writerow([
                            vid, vi["abbr"], book["book_id"], ch["chapter"],
                            aud.get("title", ""), aud.get("dramatized", False),
                            aud.get("mp3_url", ""), aud.get("hls_url", "")
                        ])
    
    # Headings CSV
    headings_csv = csv_dir / "all_headings.csv"
    with open(headings_csv, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["version_id", "version_abbr", "book_id", "chapter", "before_verse", "heading_text"])
        
        for vid, vdata in results.items():
            vi = vdata["version_info"]
            for book in vdata["books"]:
                for ch in book["chapters"]:
                    for h in ch.get("headings", []):
                        w.writerow([
                            vid, vi["abbr"], book["book_id"], ch["chapter"],
                            h.get("before_verse"), h.get("text", "")
                        ])
    
    # Footnotes CSV
    fn_csv = csv_dir / "all_footnotes.csv"
    with open(fn_csv, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["version_id", "version_abbr", "book_id", "chapter", "verse", "footnote_text"])
        
        for vid, vdata in results.items():
            vi = vdata["version_info"]
            for book in vdata["books"]:
                for ch in book["chapters"]:
                    for fn in ch.get("footnotes", []):
                        w.writerow([
                            vid, vi["abbr"], book["book_id"], ch["chapter"],
                            fn.get("verse"), fn.get("text", "")
                        ])
    
    log.info(f"  📊 CSV files: {csv_dir}")


# ═══════════════════════════════════════════════════════════════
#  STATISTICS
# ═══════════════════════════════════════════════════════════════

def print_stats(results: dict):
    """Print extraction statistics."""
    
    print("\n" + "═" * 70)
    print("  📊  EXTRACTION SUMMARY")
    print("═" * 70)
    
    grand_verses = 0
    grand_audio = 0
    
    for vid, vdata in results.items():
        vi = vdata["version_info"]
        total_v = sum(b.get("total_verses", 0) for b in vdata["books"])
        total_ch = sum(b.get("chapter_count", 0) for b in vdata["books"])
        total_aud = sum(
            1 for b in vdata["books"]
            for c in b["chapters"]
            if c.get("has_audio")
        )
        grand_verses += total_v
        grand_audio += total_aud
        
        lang_icon = "🇮🇷" if vi.get("lang") == "fa" else "🇺🇸"
        
        print(f"\n  {lang_icon} {vi['abbr']} ({vid}) — {vi.get('name', vi['abbr'])}")
        print(f"     Books: {len(vdata['books'])}  |  Chapters: {total_ch}  |  Verses: {total_v}  |  Audio: {total_aud} chapters")
    
    print(f"\n  {'─' * 50}")
    print(f"  TOTAL: {grand_verses:,} verses across {len(results)} translations")
    print(f"  AUDIO: {grand_audio:,} chapters with audio links")
    print(f"  OUTPUT: {OUTPUT_DIR}")
    print("═" * 70 + "\n")


# ═══════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════

def main():
    global log
    
    parser = argparse.ArgumentParser(
        description="📖 YouVersion Bible Complete Extractor",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                                  Extract all versions (FA + EN)
  %(prog)s --versions 118,3034              Only NMV Persian + BSB English
  %(prog)s --versions 118 --book JHN        Only John in NMV
  %(prog)s --persian-only                   Only Persian translations
  %(prog)s --english-only                   Only English translations
  %(prog)s --resume                         Resume interrupted extraction
  %(prog)s --list-versions                  Show all available versions
        """,
    )
    parser.add_argument("--versions", type=str, help="Comma-separated version IDs (e.g. 118,3034)")
    parser.add_argument("--book", type=str, help="Extract only one book (e.g. GEN, PSA, JHN)")
    parser.add_argument("--persian-only", action="store_true", help="Only Persian translations")
    parser.add_argument("--english-only", action="store_true", help="Only English translations")
    parser.add_argument("--resume", action="store_true", help="Resume from cache")
    parser.add_argument("--no-sqlite", action="store_true", help="Skip SQLite export")
    parser.add_argument("--no-csv", action="store_true", help="Skip CSV export")
    parser.add_argument("--list-versions", action="store_true", help="List versions and exit")
    args = parser.parse_args()
    
    # Setup
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    log = setup_logging()
    
    # List versions
    if args.list_versions:
        print("\n  🇮🇷 PERSIAN (فارسی) VERSIONS:")
        print(f"  {'ID':<6} {'Abbr':<8} {'Name'}")
        print(f"  {'─'*6} {'─'*8} {'─'*40}")
        for vid, vi in sorted(PERSIAN_VERSIONS.items()):
            print(f"  {vid:<6} {vi['abbr']:<8} {vi['name']}")
        
        print("\n  🇺🇸 ENGLISH VERSIONS:")
        print(f"  {'ID':<6} {'Abbr':<10} {'Name'}")
        print(f"  {'─'*6} {'─'*10} {'─'*40}")
        for vid, vi in sorted(ENGLISH_VERSIONS.items()):
            print(f"  {vid:<6} {vi['abbr']:<10} {vi['name']}")
        
        print(f"\n  📚 Total: {len(ALL_VERSIONS)} versions")
        print(f"  📖 Books: {len(BIBLE_BOOKS)} (OT: 39, NT: 27)")
        print(f"  📄 Chapters: {TOTAL_CHAPTERS}")
        return
    
    # Determine which versions to extract
    if args.versions:
        version_ids = [int(v.strip()) for v in args.versions.split(",")]
    elif args.persian_only:
        version_ids = list(PERSIAN_VERSIONS.keys())
    elif args.english_only:
        version_ids = list(ENGLISH_VERSIONS.keys())
    else:
        # Default: all versions
        version_ids = list(PERSIAN_VERSIONS.keys()) + list(ENGLISH_VERSIONS.keys())
    
    # Calculate total work
    books_count = len(BIBLE_BOOKS) if not args.book else 1
    if args.book:
        matching = [b for b in BIBLE_BOOKS if b["id"].upper() == args.book.upper()]
        total_ch = sum(b["chapters"] for b in matching) if matching else 0
    else:
        total_ch = TOTAL_CHAPTERS
    
    total_requests = total_ch * len(version_ids)
    est_time = total_requests * RATE_LIMIT / 60
    
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║           📖  YouVersion Bible Complete Extractor v2.0       ║
║           Persian 🇮🇷 + English 🇺🇸 + Audio 🔊                ║
╚══════════════════════════════════════════════════════════════╝

  📋 Plan:
     Versions  : {len(version_ids)}
     Books     : {books_count}
     Chapters  : {total_ch} per version
     Total     : ~{total_requests:,} page requests
     Est. Time : ~{est_time:.0f} minutes (with {RATE_LIMIT}s delay)
     Output    : {OUTPUT_DIR}
     Resume    : {'Yes' if args.resume else 'No (use --resume to continue)'}
    """)
    
    start = time.time()
    
    # Run extraction
    results = run_extraction(version_ids, args.book, args.resume)
    
    # Export
    print("\n\n📦 Exporting data...\n")
    
    export_json(results)
    
    if not args.no_sqlite:
        export_sqlite(results)
    
    if not args.no_csv:
        export_csv(results)
    
    # Stats
    print_stats(results)
    
    elapsed = time.time() - start
    print(f"  ⏱️  Total time: {elapsed/60:.1f} minutes")
    print(f"  ✅  All files saved to: {OUTPUT_DIR}")
    print()


if __name__ == "__main__":
    main()
