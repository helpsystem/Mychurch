
import requests

def health_check():
    print("🏥 SYSTEM HEALTH CHECK")
    urls = [
        'https://samanabyar.online/api/health',
        'https://samanabyar.online/api/leaders'
    ]
    for u in urls:
        try:
            r = requests.get(u, timeout=5)
            print(f"{u} -> {r.status_code}")
        except Exception as e:
            print(f"{u} -> FAIL")

if __name__ == '__main__':
    health_check()
