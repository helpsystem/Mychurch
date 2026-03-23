import json
import os

file_path = r'd:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\frontend\public\worship\data\worship_songs.json'
output_path = r'd:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\backend\worship_audit_results.json'

if not os.path.exists(file_path):
    print(f"Error: File not found at {file_path}")
    exit(1)

with open(file_path, 'r', encoding='utf-8-sig') as f:
    songs = json.load(f)

missing_data = []

for song in songs:
    missing = []
    artist = song.get('artist')
    if not artist or artist == "" or artist == "Unknown" or artist == "placeholder":
        missing.append('artist')
    
    if not song.get('youtubeId') or song.get('youtubeId') == "":
        missing.append('youtubeId')
    
    lyrics = song.get('lyrics', {})
    if not lyrics or (not lyrics.get('fa') and not lyrics.get('en')):
        missing.append('lyrics')
    
    if missing:
        missing_data.append({
            'id': song.get('id'),
            'title': song.get('title', {}).get('fa') or song.get('title', {}).get('en'),
            'missing': missing
        })

print(f"Total songs: {len(songs)}")
print(f"Songs with missing data: {len(missing_data)}")
print("\nFirst 20 songs with missing data:")
for item in missing_data[:20]:
    print(f"ID {item['id']}: {item['title']} - Missing: {', '.join(item['missing'])}")

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(missing_data, f, ensure_ascii=False, indent=2)

print(f"\nFull audit results written to {output_path}")
