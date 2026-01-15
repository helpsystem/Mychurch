
import requests

def verify_mojdeh():
    print("🕵️‍♂️ Final MOJDEH Audio Check")
    try:
        # Get content
        r = requests.get('https://samanabyar.online/api/bible-local/content/MOJDEH/GEN/1', timeout=10)
        data = r.json()
        audio_url = data.get('audio')
        print(f"API Audio URL: {audio_url}")
        
        # Check audio
        full_url = f"https://samanabyar.online{audio_url}"
        head = requests.head(full_url, timeout=10)
        print(f"Status: {head.status_code}")
        print(f"Content-Type: {head.headers.get('content-type')}")
        
        if head.status_code == 200 and 'audio' in head.headers.get('content-type', ''):
            print("✅ CONFIRMED: Audio is playing!")
        else:
            print("❌ FAILURE: Still broken.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    verify_mojdeh()
