#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🎵 Kalameh Song Archive Extractor
==================================
Extracts Persian Christian songs from offline Kalameh.com archive
and creates structured JSON/SQL database for modern web player.

Author: AI Data Engineer
Date: 2025
"""

import os
import re
import json
import csv
import sqlite3
from pathlib import Path
from urllib.parse import unquote, urljoin
from bs4 import BeautifulSoup
from collections import defaultdict
import hashlib

# Configuration
BASE_DIR = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.kalameh.com"
EXPORT_DIR = os.path.join(BASE_DIR, "export")
SONG_FOLDER = os.path.join(BASE_DIR, "song")
SONG_ARCHIVE_FOLDER = os.path.join(BASE_DIR, "song-archive")

# Persian alphabet for categorization
PERSIAN_LETTERS = [
    'آ', 'ا', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح', 'خ', 
    'د', 'ذ', 'ر', 'ز', 'ژ', 'س', 'ش', 'ص', 'ض', 'ط', 
    'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن', 
    'و', 'ه', 'ی'
]

def ensure_export_dir():
    """Create export directory if it doesn't exist"""
    os.makedirs(EXPORT_DIR, exist_ok=True)
    print(f"✅ Export directory ready: {EXPORT_DIR}")

def get_letter_from_title(title):
    """Extract first Persian letter from title for categorization"""
    if not title:
        return 'Other'
    
    first_char = title.strip()[0]
    
    # Normalize some characters
    if first_char in ['أ', 'إ', 'آ']:
        return 'آ'
    elif first_char == 'ا':
        return 'ا'
    
    if first_char in PERSIAN_LETTERS:
        return first_char
    
    return 'Other'

def extract_audio_duration(audio_path):
    """Extract duration from MP3 file (requires mutagen)"""
    try:
        from mutagen.mp3 import MP3
        audio = MP3(audio_path)
        duration_seconds = int(audio.info.length)
        minutes = duration_seconds // 60
        seconds = duration_seconds % 60
        return f"{minutes:02d}:{seconds:02d}"
    except Exception as e:
        return "00:00"

def clean_filename(filename):
    """Clean and normalize filename"""
    # Remove .html, .z extensions
    filename = re.sub(r'\.(html|htm|z)$', '', filename, flags=re.IGNORECASE)
    # Decode URL encoding
    filename = unquote(filename)
    return filename

def parse_song_html_file(filepath):
    """Parse individual song HTML file and extract metadata"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            soup = BeautifulSoup(content, 'html.parser')
            
            song_data = {
                'title_fa': '',
                'title_en': '',
                'artist': '',
                'lyrics': '',
                'audio': [],
                'video': [],
                'ppt': [],
                'chord': [],
                'category': ''
            }
            
            # Extract title from <title> tag or h1
            title_tag = soup.find('title')
            if title_tag:
                song_data['title_fa'] = title_tag.get_text().strip().replace('| کلمه', '').strip()
            
            h1_tag = soup.find('h1')
            if h1_tag and not song_data['title_fa']:
                song_data['title_fa'] = h1_tag.get_text().strip()
            
            # Extract lyrics from main content
            content_div = soup.find('div', class_=['node-content', 'field-items', 'content'])
            if content_div:
                # Remove script and style tags
                for script in content_div(['script', 'style']):
                    script.decompose()
                song_data['lyrics'] = content_div.get_text(separator='\n').strip()
            
            # Find all links
            links = soup.find_all('a', href=True)
            
            for link in links:
                href = link['href'].lower()
                
                if '.mp3' in href or '.m4a' in href:
                    song_data['audio'].append(link['href'])
                elif '.mp4' in href or '.webm' in href or '.avi' in href:
                    song_data['video'].append(link['href'])
                elif '.ppt' in href or '.pptx' in href:
                    song_data['ppt'].append(link['href'])
                elif 'chord' in href or 'akord' in href:
                    song_data['chord'].append(link['href'])
            
            # Extract artist from specific div or meta tags
            artist_div = soup.find('div', class_=['field-name-field-artist', 'artist'])
            if artist_div:
                song_data['artist'] = artist_div.get_text().strip()
            
            return song_data
            
    except Exception as e:
        print(f"❌ Error parsing {filepath}: {e}")
        return None

def scan_song_archive_index(html_file):
    """Scan the main song-archive index HTML files"""
    songs_by_letter = defaultdict(list)
    
    try:
        with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Find all song links
            # Kalameh uses <a> tags with href to song pages
            song_links = soup.find_all('a', href=True)
            
            for link in song_links:
                href = link['href']
                
                # Filter only song pages
                if '/song/' in href or 'song/' in href:
                    title = link.get_text().strip()
                    if title:
                        letter = get_letter_from_title(title)
                        
                        songs_by_letter[letter].append({
                            'title_fa': title,
                            'url': href,
                            'html_file': href
                        })
            
    except Exception as e:
        print(f"❌ Error scanning {html_file}: {e}")
    
    return dict(songs_by_letter)

def scan_all_song_files():
    """Recursively scan all song HTML files"""
    all_songs = []
    
    print(f"🔍 Scanning song folder: {SONG_FOLDER}")
    
    if not os.path.exists(SONG_FOLDER):
        print(f"❌ Song folder not found: {SONG_FOLDER}")
        return all_songs
    
    # Get all HTML files in song folder
    song_files = []
    for root, dirs, files in os.walk(SONG_FOLDER):
        for file in files:
            if file.endswith('.html') and not file.endswith('.z'):
                song_files.append(os.path.join(root, file))
    
    print(f"📄 Found {len(song_files)} song HTML files")
    
    # Parse each song file
    for idx, filepath in enumerate(song_files, 1):
        if idx % 50 == 0:
            print(f"   Processing: {idx}/{len(song_files)}...")
        
        song_data = parse_song_html_file(filepath)
        
        if song_data and song_data['title_fa']:
            # Add metadata
            song_data['id'] = idx
            song_data['letter'] = get_letter_from_title(song_data['title_fa'])
            song_data['slug'] = clean_filename(os.path.basename(filepath))
            song_data['file_path'] = filepath.replace(BASE_DIR, '').replace('\\', '/')
            
            # Convert lists to strings for simplicity
            song_data['audio'] = song_data['audio'][0] if song_data['audio'] else ''
            song_data['video'] = song_data['video'][0] if song_data['video'] else ''
            song_data['ppt'] = song_data['ppt'][0] if song_data['ppt'] else ''
            song_data['chord'] = song_data['chord'][0] if song_data['chord'] else ''
            
            all_songs.append(song_data)
    
    print(f"✅ Extracted {len(all_songs)} songs with metadata")
    return all_songs

def export_to_json(songs, filename='songs_index.json'):
    """Export songs to JSON format"""
    output_path = os.path.join(EXPORT_DIR, filename)
    
    # Group by letter
    songs_by_letter = defaultdict(list)
    for song in songs:
        songs_by_letter[song['letter']].append(song)
    
    # Sort letters
    sorted_data = {
        'total_songs': len(songs),
        'letters': len(songs_by_letter),
        'data': {}
    }
    
    for letter in PERSIAN_LETTERS + ['Other']:
        if letter in songs_by_letter:
            sorted_data['data'][letter] = sorted(
                songs_by_letter[letter],
                key=lambda x: x['title_fa']
            )
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(sorted_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Exported JSON: {output_path}")
    return output_path

def export_to_sql(songs, filename='songs_index.sql'):
    """Export songs to SQL format"""
    output_path = os.path.join(EXPORT_DIR, filename)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        # Create table
        f.write("""-- Kalameh Songs Database Schema
-- Generated automatically from offline archive

DROP TABLE IF EXISTS songs;

CREATE TABLE songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  letter TEXT NOT NULL,
  title_fa TEXT NOT NULL,
  title_en TEXT,
  artist TEXT,
  slug TEXT UNIQUE,
  audio TEXT,
  video TEXT,
  ppt TEXT,
  chord TEXT,
  lyrics TEXT,
  duration TEXT DEFAULT '00:00',
  file_path TEXT,
  category TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_songs_letter ON songs(letter);
CREATE INDEX idx_songs_title ON songs(title_fa);
CREATE INDEX idx_songs_artist ON songs(artist);
CREATE INDEX idx_songs_slug ON songs(slug);

-- Insert data
""")
        
        # Insert statements
        for song in songs:
            values = (
                song.get('letter', ''),
                song.get('title_fa', '').replace("'", "''"),
                song.get('title_en', '').replace("'", "''"),
                song.get('artist', '').replace("'", "''"),
                song.get('slug', '').replace("'", "''"),
                song.get('audio', ''),
                song.get('video', ''),
                song.get('ppt', ''),
                song.get('chord', ''),
                song.get('lyrics', '').replace("'", "''")[:5000],  # Limit lyrics length
                song.get('duration', '00:00'),
                song.get('file_path', ''),
                song.get('category', '')
            )
            
            insert_sql = f"""INSERT INTO songs (letter, title_fa, title_en, artist, slug, audio, video, ppt, chord, lyrics, duration, file_path, category) 
VALUES ('{values[0]}', '{values[1]}', '{values[2]}', '{values[3]}', '{values[4]}', '{values[5]}', '{values[6]}', '{values[7]}', '{values[8]}', '{values[9]}', '{values[10]}', '{values[11]}', '{values[12]}');\n"""
            
            f.write(insert_sql)
    
    print(f"✅ Exported SQL: {output_path}")
    return output_path

def export_to_csv(songs, filename='songs_manifest.csv'):
    """Export songs to CSV format"""
    output_path = os.path.join(EXPORT_DIR, filename)
    
    fieldnames = ['id', 'letter', 'title_fa', 'title_en', 'artist', 'slug', 
                  'audio', 'video', 'ppt', 'chord', 'has_lyrics', 'file_path']
    
    with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for song in songs:
            row = {
                'id': song.get('id', ''),
                'letter': song.get('letter', ''),
                'title_fa': song.get('title_fa', ''),
                'title_en': song.get('title_en', ''),
                'artist': song.get('artist', ''),
                'slug': song.get('slug', ''),
                'audio': '✓' if song.get('audio') else '',
                'video': '✓' if song.get('video') else '',
                'ppt': '✓' if song.get('ppt') else '',
                'chord': '✓' if song.get('chord') else '',
                'has_lyrics': '✓' if song.get('lyrics') else '',
                'file_path': song.get('file_path', '')
            }
            writer.writerow(row)
    
    print(f"✅ Exported CSV: {output_path}")
    return output_path

def create_sqlite_database(songs, filename='songs.db'):
    """Create SQLite database"""
    db_path = os.path.join(EXPORT_DIR, filename)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            letter TEXT NOT NULL,
            title_fa TEXT NOT NULL,
            title_en TEXT,
            artist TEXT,
            slug TEXT UNIQUE,
            audio TEXT,
            video TEXT,
            ppt TEXT,
            chord TEXT,
            lyrics TEXT,
            duration TEXT DEFAULT '00:00',
            file_path TEXT,
            category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_songs_letter ON songs(letter)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title_fa)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist)")
    
    # Insert data
    for song in songs:
        cursor.execute("""
            INSERT INTO songs (letter, title_fa, title_en, artist, slug, audio, video, ppt, chord, lyrics, duration, file_path, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            song.get('letter', ''),
            song.get('title_fa', ''),
            song.get('title_en', ''),
            song.get('artist', ''),
            song.get('slug', ''),
            song.get('audio', ''),
            song.get('video', ''),
            song.get('ppt', ''),
            song.get('chord', ''),
            song.get('lyrics', ''),
            song.get('duration', '00:00'),
            song.get('file_path', ''),
            song.get('category', '')
        ))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Created SQLite database: {db_path}")
    return db_path

def generate_summary_report(songs):
    """Generate summary statistics"""
    print("\n" + "="*80)
    print("📊 KALAMEH SONG ARCHIVE EXTRACTION SUMMARY")
    print("="*80)
    
    total_songs = len(songs)
    songs_by_letter = defaultdict(int)
    songs_with_audio = 0
    songs_with_video = 0
    songs_with_ppt = 0
    songs_with_lyrics = 0
    songs_with_chords = 0
    
    for song in songs:
        songs_by_letter[song.get('letter', 'Other')] += 1
        if song.get('audio'): songs_with_audio += 1
        if song.get('video'): songs_with_video += 1
        if song.get('ppt'): songs_with_ppt += 1
        if song.get('lyrics'): songs_with_lyrics += 1
        if song.get('chord'): songs_with_chords += 1
    
    print(f"\n📈 Total Songs: {total_songs}")
    print(f"   🎧 With Audio: {songs_with_audio} ({songs_with_audio/total_songs*100:.1f}%)")
    print(f"   📽️  With Video: {songs_with_video} ({songs_with_video/total_songs*100:.1f}%)")
    print(f"   🖥️  With PowerPoint: {songs_with_ppt} ({songs_with_ppt/total_songs*100:.1f}%)")
    print(f"   📝 With Lyrics: {songs_with_lyrics} ({songs_with_lyrics/total_songs*100:.1f}%)")
    print(f"   🎵 With Chords: {songs_with_chords} ({songs_with_chords/total_songs*100:.1f}%)")
    
    print(f"\n📚 Songs by Letter:")
    for letter in PERSIAN_LETTERS:
        if letter in songs_by_letter:
            count = songs_by_letter[letter]
            print(f"   {letter}: {count} songs")
    
    if 'Other' in songs_by_letter:
        print(f"   Other: {songs_by_letter['Other']} songs")
    
    print("\n" + "="*80 + "\n")

def main():
    """Main extraction pipeline"""
    print("\n🎵 Kalameh Song Archive Extractor")
    print("=" * 80)
    print(f"📂 Source: {BASE_DIR}")
    print(f"📂 Export: {EXPORT_DIR}")
    print("=" * 80 + "\n")
    
    # Step 1: Ensure export directory
    ensure_export_dir()
    
    # Step 2: Scan and extract all songs
    print("\n🔍 STEP 1: Scanning and extracting song data...")
    all_songs = scan_all_song_files()
    
    if not all_songs:
        print("❌ No songs found. Check the BASE_DIR path.")
        return
    
    # Step 3: Generate summary
    generate_summary_report(all_songs)
    
    # Step 4: Export to multiple formats
    print("📦 STEP 2: Exporting data...")
    export_to_json(all_songs)
    export_to_sql(all_songs)
    export_to_csv(all_songs)
    create_sqlite_database(all_songs)
    
    print("\n✅ Extraction complete!")
    print(f"📂 Check exports in: {EXPORT_DIR}")
    print("\n" + "=" * 80 + "\n")

if __name__ == "__main__":
    main()
