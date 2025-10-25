"""
Extract worship song data from local Kalameh website files
Scans the downloaded Kalameh website to find PowerPoint, MP3, and PDF files
Then matches them to songs in worship_songs.json
"""

import os
import json
import re
from pathlib import Path
from html.parser import HTMLParser

class KalamehFileExtractor:
    def __init__(self, kalameh_folder_path, worship_json_path):
        self.kalameh_folder = Path(kalameh_folder_path)
        self.worship_json_path = Path(worship_json_path)
        self.songs_data = {}
        
    def find_media_files(self):
        """Find all PowerPoint, MP3, and PDF files in Kalameh folder"""
        media_files = {
            'powerpoint': [],
            'mp3': [],
            'pdf': []
        }
        
        print("🔍 Scanning Kalameh folder for media files...")
        
        # Search for PowerPoint files
        ppt_folder = self.kalameh_folder / "sites" / "default" / "files" / "songs" / "powerpoints"
        if ppt_folder.exists():
            for ppt_file in ppt_folder.glob("*.pptx"):
                media_files['powerpoint'].append({
                    'filename': ppt_file.name,
                    'path': str(ppt_file.relative_to(self.kalameh_folder))
                })
        
        # Search for MP3 files
        mp3_folder = self.kalameh_folder / "sites" / "default" / "files" / "songs" / "mp3"
        if mp3_folder.exists():
            for mp3_file in mp3_folder.glob("*.mp3"):
                media_files['mp3'].append({
                    'filename': mp3_file.name,
                    'path': str(mp3_file.relative_to(self.kalameh_folder))
                })
        
        # Search for PDF files
        pdf_folder = self.kalameh_folder / "sites" / "default" / "files" / "songs"
        if pdf_folder.exists():
            for pdf_file in pdf_folder.glob("**/*.pdf"):
                media_files['pdf'].append({
                    'filename': pdf_file.name,
                    'path': str(pdf_file.relative_to(self.kalameh_folder))
                })
        
        print(f"✅ Found {len(media_files['powerpoint'])} PowerPoint files")
        print(f"✅ Found {len(media_files['mp3'])} MP3 files")
        print(f"✅ Found {len(media_files['pdf'])} PDF files")
        
        return media_files
    
    def normalize_title(self, title):
        """Normalize title for matching"""
        if not title:
            return ""
        # Remove extra spaces, special chars
        title = re.sub(r'\s+', ' ', title.strip())
        title = re.sub(r'[^\w\s\u0600-\u06FF]', '', title)
        return title.lower()
    
    def match_files_to_songs(self, media_files):
        """Match media files to songs in worship_songs.json"""
        print("\n📚 Loading worship_songs.json...")
        
        with open(self.worship_json_path, 'r', encoding='utf-8') as f:
            songs = json.load(f)
        
        print(f"✅ Loaded {len(songs)} songs from JSON")
        
        matched_count = 0
        
        for song in songs:
            song_title_fa = song.get('title', {}).get('fa', '')
            song_title_en = song.get('title', {}).get('en', '')
            
            # Try to match PowerPoint
            for ppt in media_files['powerpoint']:
                ppt_name = ppt['filename'].replace('.pptx', '').upper()
                
                # Check if filename contains song title keywords
                if self.is_match(song_title_fa, ppt_name) or self.is_match(song_title_en, ppt_name):
                    song['presentationFileUrl'] = f"/worship/kalameh/{ppt['path'].replace(chr(92), '/')}"
                    matched_count += 1
                    break
            
            # Try to match MP3
            for mp3 in media_files['mp3']:
                mp3_name = mp3['filename'].replace('.mp3', '')
                
                if self.is_match(song_title_fa, mp3_name) or self.is_match(song_title_en, mp3_name):
                    song['audioUrl'] = f"/worship/kalameh/{mp3['path'].replace(chr(92), '/')}"
                    break
            
            # Try to match PDF
            for pdf in media_files['pdf']:
                pdf_name = pdf['filename'].replace('.pdf', '')
                
                if self.is_match(song_title_fa, pdf_name) or self.is_match(song_title_en, pdf_name):
                    song['pdfFileUrl'] = f"/worship/kalameh/{pdf['path'].replace(chr(92), '/')}"
                    break
        
        print(f"\n✅ Matched {matched_count} songs with media files")
        
        return songs
    
    def is_match(self, title, filename):
        """Check if title matches filename"""
        if not title or not filename:
            return False
        
        # Normalize both
        norm_title = self.normalize_title(title)
        norm_filename = filename.upper()
        
        # Check for exact match
        if norm_title in norm_filename.lower():
            return True
        
        # Check for partial match (at least 50% of words)
        title_words = norm_title.split()
        if len(title_words) >= 2:
            matches = sum(1 for word in title_words if word in norm_filename.lower())
            if matches >= len(title_words) * 0.5:
                return True
        
        return False
    
    def save_updated_json(self, songs):
        """Save updated worship_songs.json"""
        output_path = self.worship_json_path.parent / "worship_songs_with_kalameh_files.json"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(songs, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Saved updated JSON to: {output_path}")
        
        # Print statistics
        stats = {
            'with_ppt': sum(1 for s in songs if s.get('presentationFileUrl')),
            'with_mp3': sum(1 for s in songs if s.get('audioUrl')),
            'with_pdf': sum(1 for s in songs if s.get('pdfFileUrl')),
            'with_youtube': sum(1 for s in songs if s.get('youtubeId'))
        }
        
        print("\n📊 Statistics:")
        print(f"   Songs with PowerPoint: {stats['with_ppt']}/{len(songs)}")
        print(f"   Songs with MP3: {stats['with_mp3']}/{len(songs)}")
        print(f"   Songs with PDF: {stats['with_pdf']}/{len(songs)}")
        print(f"   Songs with YouTube: {stats['with_youtube']}/{len(songs)}")
        
        return output_path

def main():
    # Get user input for Kalameh folder location
    print("=" * 60)
    print("🎵 Kalameh Local Files Extractor")
    print("=" * 60)
    
    kalameh_folder = input("\n📁 Enter path to your local Kalameh website folder: ").strip('"')
    
    if not os.path.exists(kalameh_folder):
        print(f"❌ Error: Folder not found: {kalameh_folder}")
        return
    
    # Use existing worship_songs.json
    current_dir = Path(__file__).parent.parent
    worship_json = current_dir / "public" / "worship" / "data" / "worship_songs.json"
    
    if not worship_json.exists():
        print(f"❌ Error: worship_songs.json not found at: {worship_json}")
        return
    
    print(f"\n✅ Using worship_songs.json from: {worship_json}")
    
    # Extract and match
    extractor = KalamehFileExtractor(kalameh_folder, worship_json)
    
    media_files = extractor.find_media_files()
    
    if not any(media_files.values()):
        print("\n⚠️  No media files found. Please check the Kalameh folder path.")
        return
    
    updated_songs = extractor.match_files_to_songs(media_files)
    
    output_file = extractor.save_updated_json(updated_songs)
    
    print(f"\n✅ Done! Updated JSON saved to:")
    print(f"   {output_file}")
    print("\n💡 Next steps:")
    print("   1. Review the updated JSON file")
    print("   2. Copy Kalameh files to public/worship/kalameh/")
    print("   3. Replace worship_songs.json with the updated version")
    print("   4. Rebuild and deploy")

if __name__ == "__main__":
    main()
