#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Server Health Check - Comprehensive Test
=========================================
"""

import sys
try:
    import requests
    from urllib.parse import urljoin
except ImportError:
    print("Installing requests...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests
    from urllib.parse import urljoin

# Test configuration
BASE_URL = "http://195.250.25.185"
HOST_HEADER = "mychurch.samanabyar.online"

tests = [
    ("Homepage", "/"),
    ("Worship Page", "/#/worship"),
    ("Worship Songs JSON", "/worship/data/worship_songs.json"),
    ("Sample PPTX", "/worship/pptx/Elshaddai.pptx"),
]

print("="*70)
print("  Server Health Check - mychurch.samanabyar.online")
print("="*70)
print()

results = {"passed": 0, "failed": 0}

for name, path in tests:
    url = urljoin(BASE_URL, path)
    try:
        response = requests.get(url, headers={"Host": HOST_HEADER}, timeout=10)
        status = response.status_code
        size = len(response.content)
        
        if status == 200:
            print(f"✅ {name:30} | Status: {status} | Size: {size:,} bytes")
            results["passed"] += 1
        else:
            print(f"⚠️  {name:30} | Status: {status}")
            results["failed"] += 1
            
    except Exception as e:
        print(f"❌ {name:30} | Error: {str(e)[:50]}")
        results["failed"] += 1

print()
print("="*70)
print(f"Results: {results['passed']} Passed, {results['failed']} Failed")
print("="*70)

# Special test for JSON content
print()
print("📊 Worship Songs Details:")
print("-"*70)

try:
    response = requests.get(
        urljoin(BASE_URL, "/worship/data/worship_songs.json"),
        headers={"Host": HOST_HEADER},
        timeout=10
    )
    
    if response.status_code == 200:
        import json
        data = response.json()
        print(f"  Total Songs: {len(data)}")
        print(f"  File Size: {len(response.content) / 1024:.2f} KB")
        
        # Count songs with YouTube
        youtube_count = sum(1 for s in data if s.get('youtubeId'))
        print(f"  With YouTube: {youtube_count}/{len(data)}")
        
        # Count songs with PPTX
        pptx_count = sum(1 for s in data if s.get('presentationFileUrl'))
        print(f"  With PPTX: {pptx_count}/{len(data)}")
        
        print()
        print("  First 5 songs:")
        for i, song in enumerate(data[:5], 1):
            title = song.get('title', {})
            print(f"    {i}. {title.get('en', 'N/A')}")
        
except Exception as e:
    print(f"  ❌ Error loading JSON: {e}")

print()
print("="*70)
print("✅ Test Complete!")
print("="*70)
