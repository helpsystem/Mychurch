
import requests

def get_url():
    url = "https://samanabyar.online/api/bible-local/content/MOJDEH/GEN/1?ts=999"
    try:
        r = requests.get(url, timeout=5)
        data = r.json()
        print(f"URL|{data.get('audio')}|END")
    except Exception as e:
        print(f"ERR|{e}|END")

if __name__ == '__main__':
    get_url()
