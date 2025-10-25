"""
Populate worship_songs.json with data extracted from Kalameh HTML files
This script reads the downloaded Kalameh HTML files and extracts:
- PowerPoint URLs
- MP3 audio URLs  
- Lyrics (if available)
- PDF URLs
"""

import os
import json
import re
from pathlib import Path
from html.parser import HTMLParser

# Path to Kalameh downloaded website
KALAMEH_ROOT = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.kalameh.com"

# Path to worship songs JSON
WORSHIP_JSON = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\public\worship\data\worship_songs.json"

# Base URL for constructing full URLs
KALAMEH_BASE = "https://www.kalameh.com/"

class KalamehSongParser(HTMLParser):
    """Parse individual song HTML to extract media URLs"""
    
    def __init__(self):
        super().__init__()
        self.song_data = {
            'title': '',
            'artist': '',
            'composer': '',
            'chord': '',
            'mode': '',
            'powerpoint_url': '',
            'audio_url': '',
            'pdf_url': '',
            'video_youtube_id': '',
            'lyrics_fa': ''
        }
        self.in_title = False
        self.in_artist = False
        self.in_composer = False
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        
        # Extract PowerPoint link
        if tag == 'a' and 'href' in attrs_dict:
            href = attrs_dict['href']
            if 'powerpoints' in href and href.endswith('.pptx'):
                self.song_data['powerpoint_url'] = href
            elif 'pdf' in href and href.endswith('.pdf'):
                self.song_data['pdf_url'] = href
        
        # Extract audio source
        if tag == 'source' and 'src' in attrs_dict:
            src = attrs_dict['src']
            if 'mp3' in src:
                self.song_data['audio_url'] = src
        
        # Extract YouTube video ID
        if tag == 'a' and 'href' in attrs_dict:
            href = attrs_dict['href']
            youtube_match = re.search(r'youtube\.com/embed/([a-zA-Z0-9_-]+)', href)
            if youtube_match:
                self.song_data['video_youtube_id'] = youtube_match.group(1)
        
        # Check for title/artist/composer spans
        if tag == 'span' and 'class' in attrs_dict:
            if 'song_title' in attrs_dict['class']:
                self.in_title = True
            elif 'song_author' in attrs_dict['class']:
                self.in_artist = True
            elif 'song_compositor' in attrs_dict['class']:
                self.in_composer = True
    
    def handle_data(self, data):
        data = data.strip()
        if self.in_title and data:
            self.song_data['title'] = data
        elif self.in_artist and data:
            self.song_data['artist'] = data
        elif self.in_composer and data:
            self.song_data['composer'] = data
    
    def handle_endtag(self, tag):
        if tag == 'span':
            self.in_title = False
            self.in_artist = False
            self.in_composer = False


def extract_songs_from_archive_html(html_path):
    """Extract all songs from a Kalameh archive page"""
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    songs = []
    
    # Find all song entries in accordion structure
    # Pattern: <h3 class="views-accordion..."><span class="song_title">...</span>
    title_pattern = r'<span class="song_title">(.*?)</span>'
    artist_pattern = r'<span class="song_author">(.*?)</span>'
    composer_pattern = r'<span class="song_compositor">(.*?)</span>'
    pptx_pattern = r'href="(sites/default/files/songs/powerpoints/[^"]+\.pptx)"'
    mp3_pattern = r'<source src="(sites/default/files/songs/mp3/[^"]+\.mp3)"'
    youtube_pattern = r"youtube\.com/embed/([a-zA-Z0-9_-]+)\?"
    chord_pattern = r'chord_base="([A-G][#b]?)"'
    mode_pattern = r'<p class="major-minor-value">(.*?)</p>'
    
    # Split by song sections (each h3 header starts a new song)
    sections = re.split(r'<h3 class="views-accordion', html_content)
    
    for section in sections[1:]:  # Skip first split (before first h3)
        song = {}
        
        # Extract title
        title_match = re.search(title_pattern, section)
        if title_match:
            song['title_fa'] = title_match.group(1).strip()
        
        # Extract artist
        artist_match = re.search(artist_pattern, section)
        if artist_match:
            song['artist'] = artist_match.group(1).strip()
        
        # Extract composer
        composer_match = re.search(composer_pattern, section)
        if composer_match:
            song['composer'] = composer_match.group(1).strip()
        
        # Extract PowerPoint URL
        pptx_match = re.search(pptx_pattern, section)
        if pptx_match:
            song['presentationFileUrl'] = KALAMEH_BASE + pptx_match.group(1)
        
        # Extract MP3 URL
        mp3_match = re.search(mp3_pattern, section)
        if mp3_match:
            song['audioUrl'] = KALAMEH_BASE + mp3_match.group(1)
        
        # Extract YouTube ID
        youtube_match = re.search(youtube_pattern, section)
        if youtube_match:
            song['youtubeId'] = youtube_match.group(1)
        
        # Extract chord
        chord_match = re.search(chord_pattern, section)
        if chord_match:
            song['chord'] = chord_match.group(1)
        
        # Extract mode
        mode_match = re.search(mode_pattern, section)
        if mode_match:
            song['mode'] = mode_match.group(1).strip()
        
        if 'title_fa' in song:
            songs.append(song)
    
    return songs


def match_and_update_songs():
    """Match Kalameh songs with existing worship_songs.json and update empty fields"""
    
    # Load existing worship songs
    with open(WORSHIP_JSON, 'r', encoding='utf-8') as f:
        worship_songs = json.load(f)
    
    print(f"Loaded {len(worship_songs)} existing worship songs")
    
    # Find all Kalameh archive HTML files
    kalameh_htmls = []
    if os.path.exists(KALAMEH_ROOT):
        for root, dirs, files in os.walk(KALAMEH_ROOT):
            for file in files:
                if file.startswith('song-archive') and file.endswith('.html'):
                    kalameh_htmls.append(os.path.join(root, file))
    
    print(f"Found {len(kalameh_htmls)} Kalameh archive HTML files")
    
    # Extract all Kalameh songs
    all_kalameh_songs = []
    for html_file in kalameh_htmls:
        try:
            songs = extract_songs_from_archive_html(html_file)
            all_kalameh_songs.extend(songs)
            print(f"  Extracted {len(songs)} songs from {os.path.basename(html_file)}")
        except Exception as e:
            print(f"  Error processing {os.path.basename(html_file)}: {e}")
    
    print(f"\nTotal Kalameh songs extracted: {len(all_kalameh_songs)}")
    
    # Create lookup dictionary by normalized title
    kalameh_lookup = {}
    for ksong in all_kalameh_songs:
        if 'title_fa' in ksong:
            normalized = normalize_title(ksong['title_fa'])
            kalameh_lookup[normalized] = ksong
    
    # Match and update
    updated_count = 0
    for wsong in worship_songs:
        if 'title' in wsong and 'fa' in wsong['title']:
            normalized = normalize_title(wsong['title']['fa'])
            
            if normalized in kalameh_lookup:
                ksong = kalameh_lookup[normalized]
                
                # Update empty fields
                if not wsong.get('presentationFileUrl') and ksong.get('presentationFileUrl'):
                    wsong['presentationFileUrl'] = ksong['presentationFileUrl']
                    updated_count += 1
                
                if not wsong.get('audioUrl') and ksong.get('audioUrl'):
                    wsong['audioUrl'] = ksong['audioUrl']
                    updated_count += 1
                
                if not wsong.get('youtubeId') and ksong.get('youtubeId'):
                    wsong['youtubeId'] = ksong['youtubeId']
                    wsong['videoUrl'] = f"https://www.youtube.com/embed/{ksong['youtubeId']}"
                    updated_count += 1
                
                if not wsong.get('chord') and ksong.get('chord'):
                    wsong['chord'] = ksong['chord']
                
                if not wsong.get('mode') and ksong.get('mode'):
                    wsong['mode'] = ksong['mode']
                
                if not wsong.get('artist') and ksong.get('artist'):
                    wsong['artist'] = ksong['artist']
                
                if not wsong.get('composer') and ksong.get('composer'):
                    wsong['composer'] = ksong['composer']
    
    print(f"\nUpdated {updated_count} fields across matched songs")
    
    # Save updated JSON
    output_path = WORSHIP_JSON.replace('.json', '_updated.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(worship_songs, f, ensure_ascii=False, indent=2)
    
    print(f"\nSaved updated data to: {output_path}")
    
    return worship_songs


def normalize_title(title):
    """Normalize title for matching (remove extra spaces, parentheses content, etc.)"""
    # Remove content in parentheses
    title = re.sub(r'\([^)]*\)', '', title)
    # Remove extra whitespace
    title = ' '.join(title.split())
    # Convert to lowercase for case-insensitive matching
    title = title.lower().strip()
    return title


if __name__ == '__main__':
    print("Starting Kalameh data extraction and matching...\n")
    match_and_update_songs()
    print("\nDone!")
