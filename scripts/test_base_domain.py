#!/usr/bin/env python3
import requests

BASE_URL = "https://samanabyar.online"

print("🔍 Testing Base Domain (samanabyar.online)")
print("="*70)

tests = [
    ("Homepage", f"{BASE_URL}/"),
    ("Worship Page", f"{BASE_URL}/#/worship"),
    ("JSON API", f"{BASE_URL}/worship-songs/data/worship_songs.json"),
    ("Sample PPTX", f"{BASE_URL}/worship-songs/pptx/Elshaddai.pptx"),
]

results = []
for name, url in tests:
    try:
        print(f"\n{name}:")
        print(f"  URL: {url}")
        response = requests.get(url, timeout=10, allow_redirects=True)
        print(f"  Status: {response.status_code}")
        print(f"  Size: {len(response.content):,} bytes")
        print(f"  Content-Type: {response.headers.get('content-type', 'N/A')}")
        
        if response.status_code == 200:
            print(f"  ✅ SUCCESS")
            results.append(True)
            
            # Extra checks for JSON
            if 'json' in url:
                data = response.json()
                print(f"  Songs count: {len(data)}")
                if len(data) > 0:
                    print(f"  First song: {data[0].get('title', {}).get('fa', 'N/A')}")
                    youtube_count = sum(1 for s in data if s.get('youtubeId'))
                    print(f"  YouTube links: {youtube_count}/{len(data)} ({youtube_count*100//len(data)}%)")
        else:
            print(f"  ❌ FAILED")
            results.append(False)
            
    except Exception as e:
        print(f"  ❌ ERROR: {e}")
        results.append(False)

print("\n" + "="*70)
print(f"✅ Results: {sum(results)}/{len(results)} tests passed")
print("="*70)
