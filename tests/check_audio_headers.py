
import requests

URLS = [
    'https://samanabyar.online/bible_data/audio/TPV/GEN/1.mp3',
    'https://samanabyar.online/bible_data/audio/MOJDEH/GEN/1.mp3'
]

def check_headers():
    print("🔍 Header Inspection")
    for u in URLS:
        print(f"\nChecking: {u}")
        try:
            r = requests.head(u)
            print(f"Status: {r.status_code}")
            print(f"Content-Type: {r.headers.get('content-type')}")
            print(f"Content-Length: {r.headers.get('content-length')}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == '__main__':
    check_headers()
