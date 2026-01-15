
import requests
import time

URL = 'https://samanabyar.online/api/bible-local/content/TPV/GEN/1'

def check():
    ts = int(time.time())
    url = f"{URL}?ts={ts}"
    print(f"Checking {url}")
    try:
        r = requests.get(url)
        data = r.json()
        audio = data.get('audio')
        print(f"Audio: {audio}")
    except Exception as e:
        print(e)
        
if __name__ == '__main__':
    check()
