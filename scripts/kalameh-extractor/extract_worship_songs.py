#!/usr/bin/env python3
"""
Worship Songs Archive Extractor
Parses saved HTML from www.kalameh.com and generates normalized outputs
"""

import os
import re
import json
import csv
import hashlib
from pathlib import Path
from typing import List, Dict, Any
from bs4 import BeautifulSoup

try:
    from mutagen.mp3 import MP3
    HAS_MUTAGEN = True
except ImportError:
    HAS_MUTAGEN = False
    print("⚠️ mutagen not installed - MP3 duration will be 0")

# ========== CONFIG ==========
ROOTS = [
    r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.kalameh.com",
]

EXPORT_DIR = Path(__file__).parent / "export"
EXPORT_DIR.mkdir(exist_ok=True)

LOG_FILE = EXPORT_DIR / "parse_log.txt"

PERSIAN_ALPHABET = list("اآبپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی")

# ========== UTILITIES ==========
def normalize_ws(s: str) -> str:
    """Normalize whitespace"""
    return re.sub(r"\s+", " ", s or "").strip()

def first_persian_letter(s: str) -> str:
    """Extract first Persian letter from string"""
    for ch in normalize_ws(s):
        if ch in PERSIAN_ALPHABET:
            return ch
    return s[:1] if s else "#"

def get_mp3_duration(path: str) -> float:
    """Get MP3 duration in seconds"""
    if not HAS_MUTAGEN:
        return 0.0
    try:
        if os.path.exists(path):
            audio = MP3(path)
            return float(audio.info.length)
    except Exception as e:
        log(f"MP3 duration error for {path}: {e}")
    return 0.0

def log(msg: str):
    """Append to log file"""
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg)

def make_absolute_url(href: str, base_html: str) -> str:
    """Convert relative URLs to absolute file paths"""
    if not href or href.startswith(("http://", "https://", "/")):
        return href
    
    # Relative path - try to resolve from HTML location
    html_dir = Path(base_html).parent
    candidate = html_dir / href
    if candidate.exists():
        return str(candidate.resolve()).replace("\\", "/")
    
    return href

# ========== PARSER ==========
def parse_html_file(html_path: str) -> List[Dict[str, Any]]:
    """Parse a single HTML file for song data"""
    songs = []
    
    try:
        with open(html_path, "r", encoding="utf-8", errors="ignore") as f:
            soup = BeautifulSoup(f.read(), "html.parser")
    except Exception as e:
        log(f"❌ Failed to read {html_path}: {e}")
        return songs

    # Find accordion headers (song titles)
    headers = soup.select("h3.views-accordion-songs_and_video-page-header, h3.ui-accordion-header")
    
    log(f"📄 Parsing {html_path} - Found {len(headers)} songs")
    
    for h in headers:
        try:
            # Extract title link
            a = h.find("a", href=True)
            if not a:
                continue
            
            # Song metadata from header
            title_fa = normalize_ws(a.find("span", class_="song_title").get_text() if a.find("span", class_="song_title") else "")
            title_en = normalize_ws(a.find("span", class_="song_author").get_text() if a.find("span", class_="song_author") else "")
            composer = normalize_ws(a.find("span", class_="song_compositor").get_text() if a.find("span", class_="song_compositor") else "")
            
            anchor = a.get("href", "").lstrip("#")
            
            # Find content panel
            panel = soup.find(id=anchor) if anchor else None
            
            # Default values
            chord_base = ""
            chord_mode = ""
            chord_view = ""
            ppt_link = ""
            video_link = ""
            lyric_audio_link = ""
            audio_download = ""
            audio_stream = ""
            lyrics_text = ""
            
            if panel:
                # Chord information
                chord_select = panel.select_one("select.acordesSelect")
                if chord_select:
                    chord_base = chord_select.get("chord_base", "")
                
                mm_val = panel.select_one(".major-minor-value")
                if mm_val:
                    chord_mode = normalize_ws(mm_val.get_text())
                
                # Chord view link
                chord_view_a = panel.select_one('a[id="goChordButton"], a[href*="/node/"][target="_blank"]')
                if chord_view_a and chord_view_a.has_attr("href"):
                    chord_view = make_absolute_url(chord_view_a["href"], html_path)
                
                # PowerPoint
                ppt_a = panel.select_one('.views-field-field-powerpoint a[href$=".pptx"], .views-field-field-powerpoint a')
                if ppt_a and ppt_a.has_attr("href"):
                    ppt_link = make_absolute_url(ppt_a["href"], html_path)
                
                # Video (YouTube)
                video_a = panel.select_one('.views-field-field-video a[href*="youtube.com"], .views-field-field-lyrics-with-audio a[href*="youtube.com"]')
                if video_a and video_a.has_attr("href"):
                    video_link = video_a["href"]
                
                # Audio download
                audio_dl = panel.select_one('.views-field-field-song-audio-1 a[href*="file/"], .views-field-field-song-audio-1 a:contains("Download")')
                if audio_dl and audio_dl.has_attr("href"):
                    audio_download = make_absolute_url(audio_dl["href"], html_path)
                
                # Audio stream source
                audio_src = panel.select_one('.views-field-field-song-audio-2 audio source[src$=".mp3"]')
                if audio_src and audio_src.has_attr("src"):
                    audio_stream = make_absolute_url(audio_src["src"], html_path)
                
                # Lyrics with audio link
                lyr_a = panel.select_one('.views-field-field-lyrics-with-audio a')
                if lyr_a and lyr_a.has_attr("href"):
                    lyric_audio_link = make_absolute_url(lyr_a["href"], html_path)
                
                # Try to extract lyrics text
                lyrics_div = panel.select_one('.lyrics-text, .song-lyrics, .field-type-text-with-summary')
                if lyrics_div:
                    lyrics_text = normalize_ws(lyrics_div.get_text())
            
            # Try to find local MP3 file
            mp3_local = ""
            duration = 0.0
            
            for candidate in [audio_stream, audio_download]:
                if candidate and os.path.exists(candidate):
                    mp3_local = candidate
                    duration = get_mp3_duration(mp3_local)
                    break
            
            # Create song entry
            song_id = hashlib.md5(f"{title_fa}{title_en}{audio_stream}".encode()).hexdigest()[:12]
            
            songs.append({
                "id": song_id,
                "slug": re.sub(r'[^\w\-]+', '-', (title_fa or title_en).lower())[:50],
                "title_fa": title_fa,
                "title_en": title_en,
                "composer": composer,
                "letter": first_persian_letter(title_fa),
                "chord_base": chord_base,
                "chord_mode": chord_mode,
                "chord_view": chord_view,
                "ppt": ppt_link,
                "video": video_link,
                "lyric_audio_link": lyric_audio_link,
                "audio_download": audio_download,
                "audio_stream": audio_stream,
                "mp3_local": mp3_local,
                "duration_sec": round(duration, 2),
                "lyrics_fa": lyrics_text,
                "lyrics_en": "",
                "source_html": html_path.replace("\\", "/"),
                "artist": composer  # For compatibility
            })
            
        except Exception as e:
            log(f"⚠️ Error parsing song in {html_path}: {e}")
            continue
    
    return songs

def walk_and_parse(roots: List[str]) -> List[Dict[str, Any]]:
    """Walk through roots and parse all HTML files"""
    all_songs = []
    
    for root in roots:
        root_path = Path(root)
        
        if root_path.is_file():
            # Single file
            if root_path.suffix.lower() in ['.html', '.htm']:
                all_songs.extend(parse_html_file(str(root_path)))
        else:
            # Directory - walk recursively
            for html_file in root_path.rglob("*.htm*"):
                all_songs.extend(parse_html_file(str(html_file)))
    
    return all_songs

# ========== OUTPUT GENERATORS ==========
def write_json_outputs(songs: List[Dict[str, Any]]):
    """Generate JSON outputs"""
    # Flat list
    flat_path = EXPORT_DIR / "worship_songs_flat.json"
    with open(flat_path, "w", encoding="utf-8") as f:
        json.dump(songs, f, ensure_ascii=False, indent=2)
    log(f"✅ Written: {flat_path}")
    
    # Hierarchical by letter
    by_letter = {}
    for song in songs:
        letter = song["letter"]
        by_letter.setdefault(letter, []).append(song)
    
    index_path = EXPORT_DIR / "worship_songs_index.json"
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump({
            "total_songs": len(songs),
            "letters": len(by_letter),
            "data": by_letter
        }, f, ensure_ascii=False, indent=2)
    log(f"✅ Written: {index_path}")

def write_csv_output(songs: List[Dict[str, Any]]):
    """Generate CSV output"""
    csv_path = EXPORT_DIR / "worship_songs.csv"
    
    if not songs:
        return
    
    fieldnames = list(songs[0].keys())
    
    with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(songs)
    
    log(f"✅ Written: {csv_path}")

def write_sql_output(songs: List[Dict[str, Any]]):
    """Generate SQL output"""
    sql_path = EXPORT_DIR / "worship_songs.sql"
    
    with open(sql_path, "w", encoding="utf-8") as f:
        # Create table
        f.write("""-- Worship Songs Database Schema
CREATE TABLE IF NOT EXISTS worship_songs (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    letter TEXT,
    title_fa TEXT,
    title_en TEXT,
    composer TEXT,
    artist TEXT,
    chord_base TEXT,
    chord_mode TEXT,
    chord_view TEXT,
    ppt TEXT,
    video TEXT,
    lyric_audio_link TEXT,
    audio_download TEXT,
    audio_stream TEXT,
    mp3_local TEXT,
    duration_sec REAL,
    lyrics_fa TEXT,
    lyrics_en TEXT,
    source_html TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_letter ON worship_songs(letter);
CREATE INDEX IF NOT EXISTS idx_title_fa ON worship_songs(title_fa);
CREATE INDEX IF NOT EXISTS idx_composer ON worship_songs(composer);

""")
        
        # Insert records
        for song in songs:
            def esc(val):
                if val is None:
                    return "NULL"
                return "'" + str(val).replace("'", "''") + "'"
            
            values = [
                esc(song.get('id')),
                esc(song.get('slug')),
                esc(song.get('letter')),
                esc(song.get('title_fa')),
                esc(song.get('title_en')),
                esc(song.get('composer')),
                esc(song.get('artist')),
                esc(song.get('chord_base')),
                esc(song.get('chord_mode')),
                esc(song.get('chord_view')),
                esc(song.get('ppt')),
                esc(song.get('video')),
                esc(song.get('lyric_audio_link')),
                esc(song.get('audio_download')),
                esc(song.get('audio_stream')),
                esc(song.get('mp3_local')),
                str(song.get('duration_sec', 0)),
                esc(song.get('lyrics_fa')),
                esc(song.get('lyrics_en')),
                esc(song.get('source_html'))
            ]
            
            f.write(f"INSERT INTO worship_songs (id,slug,letter,title_fa,title_en,composer,artist,chord_base,chord_mode,chord_view,ppt,video,lyric_audio_link,audio_download,audio_stream,mp3_local,duration_sec,lyrics_fa,lyrics_en,source_html) VALUES ({','.join(values)});\n")
    
    log(f"✅ Written: {sql_path}")

# ========== MAIN ==========
def main():
    log("\n" + "="*60)
    log("🎵 Worship Songs Archive Extractor")
    log("="*60)
    
    # Clear previous log
    if LOG_FILE.exists():
        LOG_FILE.unlink()
    
    # Parse HTML files
    log("\n📖 Parsing HTML files...")
    songs = walk_and_parse(ROOTS)
    
    # Remove empty entries
    songs = [s for s in songs if s.get("title_fa") or s.get("title_en")]
    
    # Deduplicate based on (title_fa, audio_stream)
    seen = set()
    unique_songs = []
    for song in songs:
        key = (song.get("title_fa"), song.get("audio_stream"), song.get("audio_download"))
        if key not in seen:
            seen.add(key)
            unique_songs.append(song)
    
    log(f"\n📊 Statistics:")
    log(f"   Total parsed: {len(songs)}")
    log(f"   Unique songs: {len(unique_songs)}")
    log(f"   Letters: {len(set(s['letter'] for s in unique_songs))}")
    
    # Generate outputs
    log("\n📝 Generating outputs...")
    write_json_outputs(unique_songs)
    write_csv_output(unique_songs)
    write_sql_output(unique_songs)
    
    log(f"\n✅ Export complete!")
    log(f"📂 Output directory: {EXPORT_DIR}")
    log(f"📋 Log file: {LOG_FILE}")
    log("="*60 + "\n")

if __name__ == "__main__":
    main()
