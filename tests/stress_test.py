
import requests
import time
from concurrent.futures import ThreadPoolExecutor

BASE_URL = 'https://samanabyar.online/api'
SITE_URL = 'https://samanabyar.online'
HTML_TITLE_TAG = "<title>Vite + React + TS</title>" # Default vite title, or whatever is expected.

TRANSLATIONS = ['MOJDEH', 'TPV', 'NMV', 'PCB', 'QADIM', 'NET', 'KJV']
BOOKS = ['GEN', 'EXO', 'PSA', 'MAT', 'JHN', 'REV']
CHAPTERS_TO_TEST = [1, 5, 28] # Some random chapters

ENDPOINTS = [
    '/health',
    '/leaders',
    '/sermons',
    '/events',
    '/testimonials',
    '/api/ai-chat/daily-verse', # Check if this path is correct based on server.js
    '/schedule-events',
]

def check_url(url, method='GET', expected_status=200):
    try:
        if method == 'GET':
            r = requests.get(url, timeout=10)
        else:
            r = requests.head(url, timeout=10)
            
        return {
            'url': url,
            'status': r.status_code,
            'success': r.status_code == expected_status,
            'content_type': r.headers.get('content-type', ''),
            'size': len(r.content) if method == 'GET' else 0,
            'data': r.json() if 'application/json' in r.headers.get('content-type', '') else None
        }
    except Exception as e:
        return {'url': url, 'status': 0, 'success': False, 'error': str(e)}

def stress_test_bible():
    print("📘 BIBLE DEEP SCAN")
    print("===================")
    
    results = []
    
    # 1. Text Content & Metadata
    for trans in TRANSLATIONS:
        url = f"{BASE_URL}/bible-local/content/{trans}/GEN/1"
        res = check_url(url)
        
        status_icon = "✅" if res['success'] else "❌"
        audio_status = "N/A"
        timing_status = "N/A"
        
        if res['success'] and res['data']:
            data = res['data']
            # Check Audio
            audio_url = data.get('audio')
            if audio_url:
                full_audio = f"{SITE_URL}{audio_url}" if audio_url.startswith('/') else audio_url
                audio_res = check_url(full_audio, method='HEAD')
                audio_status = "🔊 OK" if audio_res['success'] and 'audio' in audio_res['content_type'] else f"🔇 FAIL ({audio_res['status']})"
            else:
                audio_status = "🔇 None"
                
            # Check Timing
            timing_url = data.get('timingUrl')
            if timing_url:
                full_timing = f"{SITE_URL}{timing_url}"
                timing_res = check_url(full_timing, method='HEAD')
                timing_status = "⏱️ OK" if timing_res['success'] else f"⚠️ FAIL ({timing_res['status']})"
            else:
                timing_status = "No Timing"
                
        print(f"{status_icon} {trans}: Text {res['status']} | Audio: {audio_status} | Timing: {timing_status}")
        results.append(res)
        
def stress_test_core():
    print("\n⚙️  CORE SYSTEM CHECKS")
    print("====================")
    
    for ep in ENDPOINTS:
        # Normalize double slashes if any
        url = f"{BASE_URL}{ep}".replace('//api/', '/api/') # Basic cleanup
        res = check_url(url)
        status_icon = "✅" if res['success'] else "❌"
        print(f"{status_icon} {ep}: {res['status']} ({res['size']} bytes)")

def stress_test_assets():
    print("\n🎨 ASSET INTEGRITY")
    print("===================")
    # Check main index
    res = check_url(SITE_URL)
    print(f"Index: {res['status']} ({res['size']} bytes)")
    
    # We can try to parse index manually to find script tags (quick and dirty)
    if res['success']:
        content = requests.get(SITE_URL).text
        import re
        scripts = re.findall(r'src="(/assets/.*?)"', content)
        for s in scripts:
            asset_url = f"{SITE_URL}{s}"
            a_res = check_url(asset_url, method='HEAD')
            icon = "✅" if a_res['success'] else "❌"
            print(f"{icon} JS: {s}")

if __name__ == '__main__':
    stress_test_bible()
    stress_test_core()
    stress_test_assets()
