
import requests
import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
REMOTE_FILE = '/root/Mychurch/backend/routes/bible-local.js'

def debug_mojdeh():
    print("🔍 DEBUG REPORT")
    print("===============")
    
    # 1. Check API Response
    ts = "123456" # Simple cache bust
    url = f"https://samanabyar.online/api/bible-local/content/MOJDEH/GEN/1?ts={ts}"
    print(f"Request: {url}")
    try:
        r = requests.get(url, timeout=10)
        data = r.json()
        print(f"API Audio URL: {data.get('audio')}")
        print(f"Text Snippet: {data.get('verses')[0]['text'][:30]}...")
    except Exception as e:
        print(f"API Error: {e}")
        
    # 2. Check Remote File Config
    print("\nRemote Config Audit:")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
        
        # Grep for MOJDEH config
        stdin, stdout, stderr = ssh.exec_command(f'grep -A 5 "MOJDEH: {{" {REMOTE_FILE}')
        print(stdout.read().decode())
        
        ssh.close()
    except Exception as e:
        print(f"SSH Error: {e}")

if __name__ == '__main__':
    debug_mojdeh()
