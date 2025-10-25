"""
Extract lyrics from Kalameh HTML files and add to worship_songs.json
"""

import os
import json
import re
from html.parser import HTMLParser
from pathlib import Path

# Path to Kalameh downloaded website
KALAMEH_ROOT = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.kalameh.com"

# Path to worship songs JSON
WORSHIP_JSON = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\public\worship\data\worship_songs.json"

def extract_lyrics_from_song_page(html_path):
    """Extract lyrics from individual song page HTML"""
    with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
        html_content = f.read()
    
    lyrics_data = {
        'title': '',
        'lyrics_fa': '',
        'lyrics_en': ''
    }
    
    # Extract title
    title_match = re.search(r'<title>(.*?)\|', html_content)
    if title_match:
        lyrics_data['title'] = title_match.group(1).strip()
    
    # Try to find lyrics section
    # Pattern 1: Look for field-lyrics or similar class
    lyrics_pattern = r'<div[^>]*class="[^"]*field-lyrics[^"]*"[^>]*>(.*?)</div>'
    lyrics_match = re.search(lyrics_pattern, html_content, re.DOTALL | re.IGNORECASE)
    
    if lyrics_match:
        lyrics_html = lyrics_match.group(1)
        # Remove HTML tags
        lyrics_text = re.sub(r'<[^>]+>', '\n', lyrics_html)
        # Clean up
        lyrics_text = re.sub(r'\n\s*\n', '\n', lyrics_text)
        lyrics_text = lyrics_text.strip()
        
        # Detect language (simple heuristic: if contains Persian chars)
        if re.search(r'[\u0600-\u06FF]', lyrics_text):
            lyrics_data['lyrics_fa'] = lyrics_text
        else:
            lyrics_data['lyrics_en'] = lyrics_text
    
    # Alternative pattern: Look for pre tags with lyrics
    pre_pattern = r'<pre[^>]*>(.*?)</pre>'
    pre_matches = re.findall(pre_pattern, html_content, re.DOTALL | re.IGNORECASE)
    
    for pre_content in pre_matches:
        # Clean up
        lyrics_text = re.sub(r'<[^>]+>', '\n', pre_content)
        lyrics_text = re.sub(r'\n\s*\n', '\n', lyrics_text)
        lyrics_text = lyrics_text.strip()
        
        # Only if substantial content (more than 50 chars)
        if len(lyrics_text) > 50:
            if re.search(r'[\u0600-\u06FF]', lyrics_text):
                lyrics_data['lyrics_fa'] = lyrics_text
            else:
                lyrics_data['lyrics_en'] = lyrics_text
    
    return lyrics_data


def find_song_pages():
    """Find all individual song page HTML files"""
    song_pages = []
    
    if not os.path.exists(KALAMEH_ROOT):
        print(f"Error: Kalameh root not found at {KALAMEH_ROOT}")
        return song_pages
    
    # Look for song pages in the 'song' folder
    song_folder = os.path.join(KALAMEH_ROOT, 'song')
    if os.path.exists(song_folder):
        for file in os.listdir(song_folder):
            if file.endswith('.html'):
                song_pages.append(os.path.join(song_folder, file))
    
    # Also check root for node/*.html pattern
    node_folder = os.path.join(KALAMEH_ROOT, 'node')
    if os.path.exists(node_folder):
        for file in os.listdir(node_folder):
            if file.endswith('.html'):
                song_pages.append(os.path.join(node_folder, file))
    
    print(f"Found {len(song_pages)} individual song pages")
    return song_pages


def normalize_title(title):
    """Normalize title for matching"""
    # Remove content in parentheses
    title = re.sub(r'\([^)]*\)', '', title)
    # Remove extra whitespace
    title = ' '.join(title.split())
    # Convert to lowercase
    title = title.lower().strip()
    return title


def update_worship_songs_with_lyrics():
    """Update worship_songs.json with extracted lyrics"""
    
    # Load existing worship songs
    with open(WORSHIP_JSON, 'r', encoding='utf-8') as f:
        worship_songs = json.load(f)
    
    print(f"Loaded {len(worship_songs)} worship songs")
    
    # Find all song pages
    song_pages = find_song_pages()
    
    if len(song_pages) == 0:
        print("No song pages found. Skipping lyrics extraction.")
        return
    
    # Extract lyrics from all pages
    all_lyrics = {}
    for i, page_path in enumerate(song_pages):
        try:
            lyrics_data = extract_lyrics_from_song_page(page_path)
            if lyrics_data['title']:
                normalized = normalize_title(lyrics_data['title'])
                all_lyrics[normalized] = lyrics_data
            
            if (i + 1) % 50 == 0:
                print(f"  Processed {i + 1}/{len(song_pages)} song pages...")
        except Exception as e:
            print(f"  Error processing {os.path.basename(page_path)}: {e}")
    
    print(f"Extracted lyrics from {len(all_lyrics)} songs")
    
    # Match and update worship songs
    updated_count = 0
    for wsong in worship_songs:
        if 'title' in wsong and 'fa' in wsong['title']:
            normalized = normalize_title(wsong['title']['fa'])
            
            if normalized in all_lyrics:
                lyrics_data = all_lyrics[normalized]
                
                # Update Persian lyrics if empty
                if lyrics_data['lyrics_fa'] and (not wsong.get('lyrics') or not wsong['lyrics'].get('fa')):
                    if not wsong.get('lyrics'):
                        wsong['lyrics'] = {'fa': '', 'en': '', 'es': ''}
                    wsong['lyrics']['fa'] = lyrics_data['lyrics_fa']
                    updated_count += 1
                
                # Update English lyrics if empty
                if lyrics_data['lyrics_en'] and (not wsong.get('lyrics') or not wsong['lyrics'].get('en')):
                    if not wsong.get('lyrics'):
                        wsong['lyrics'] = {'fa': '', 'en': '', 'es': ''}
                    wsong['lyrics']['en'] = lyrics_data['lyrics_en']
                    updated_count += 1
    
    print(f"\nUpdated lyrics for {updated_count} entries")
    
    # Save updated JSON
    output_path = WORSHIP_JSON.replace('.json', '_with_lyrics.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(worship_songs, f, ensure_ascii=False, indent=2)
    
    print(f"\nSaved updated data to: {output_path}")
    
    # Also update original file
    with open(WORSHIP_JSON, 'w', encoding='utf-8') as f:
        json.dump(worship_songs, f, ensure_ascii=False, indent=2)
    
    print(f"Updated original file: {WORSHIP_JSON}")
    
    return worship_songs


if __name__ == '__main__':
    print("Starting lyrics extraction from Kalameh...\n")
    update_worship_songs_with_lyrics()
    print("\nDone!")
