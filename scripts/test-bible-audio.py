"""
Test Bible Audio Files
======================
Tests downloading and verifying audio files from extracted data.
"""

import json
import requests
from pathlib import Path

def test_audio_download():
    """Test downloading audio files"""
    
    # Load extracted data
    data_file = Path("output/bible_complete/bible_data.json")
    
    if not data_file.exists():
        print("❌ Data file not found. Run extract-bible-audio-text.py first.")
        return
    
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print("=" * 70)
    print("🎵 Bible Audio Files Test")
    print("=" * 70)
    
    # Show stats
    stats = data['metadata']['stats']
    print(f"\n📊 Statistics:")
    print(f"   Versions: {stats['versions_found']}")
    print(f"   Audio files found: {stats['audio_files_found']}")
    print(f"   Text chapters: {stats['text_chapters_extracted']}")
    print(f"   Total verses: {stats['total_verses']}")
    
    # Show versions
    print(f"\n📖 Versions:")
    for version_id, version_info in data['versions'].items():
        print(f"   {version_id}: {version_info['title']} ({version_info['abbreviation']})")
        print(f"      Language: {version_info['language']} ({version_info['language_code']})")
        print(f"      Audio: {'✅' if version_info['has_audio'] else '❌'}")
    
    # Show available audio
    print(f"\n🔊 Available Audio Files:")
    audio_count = 0
    for version_id, books in data['audio_files'].items():
        for book_code, chapters in books.items():
            for chapter, audio_list in chapters.items():
                print(f"\n   {book_code} {chapter}:")
                for i, audio in enumerate(audio_list, 1):
                    audio_count += 1
                    print(f"      {i}. {audio['title']}")
                    print(f"         MP3: https:{audio['download_urls']['format_mp3_32k']}")
                    print(f"         HLS: https:{audio['download_urls']['format_hls']}")
                    print(f"         Timing: {'✅' if audio['timing_available'] else '❌'}")
    
    # Test download one audio file
    print(f"\n🧪 Testing Audio Download...")
    if data['audio_files']:
        version_id = list(data['audio_files'].keys())[0]
        book_code = list(data['audio_files'][version_id].keys())[0]
        chapter = list(data['audio_files'][version_id][book_code].keys())[0]
        audio_info = data['audio_files'][version_id][book_code][chapter][0]
        
        mp3_url = "https:" + audio_info['download_urls']['format_mp3_32k']
        
        print(f"   Downloading: {book_code} {chapter}")
        print(f"   URL: {mp3_url}")
        
        try:
            response = requests.head(mp3_url, timeout=10)
            if response.status_code == 200:
                file_size = int(response.headers.get('content-length', 0))
                print(f"   ✅ Audio file accessible!")
                print(f"   📦 File size: {file_size / 1024 / 1024:.2f} MB")
            else:
                print(f"   ⚠️  HTTP {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    # Show sample verses
    print(f"\n📝 Sample Bible Text (Genesis 1:1-3):")
    if '118' in data['bible_text'] and 'GEN' in data['bible_text']['118']:
        verses = data['bible_text']['118']['GEN']['1']['fa']
        for i in range(1, min(4, len(verses) + 1)):
            if str(i) in verses:
                print(f"   {i}. {verses[str(i)]}")
    
    print("\n" + "=" * 70)
    print(f"✅ Test Complete! Found {audio_count} audio files")
    print("=" * 70)

if __name__ == "__main__":
    test_audio_download()
