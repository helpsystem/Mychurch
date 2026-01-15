
import paramiko
import time
import requests

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
REMOTE_FILE = '/root/Mychurch/backend/routes/bible-local.js'
BASE_URL = 'https://samanabyar.online/api/bible-local'

def test_rename():
    print("🧪 Testing Endpoint Rename...")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
        sftp = ssh.open_sftp()
        
        # 1. Read file
        with sftp.open(REMOTE_FILE, 'r') as f:
            content = f.read().decode('utf-8')
            
        # 2. Rename endpoint
        if "/content/:" in content:
            new_content = content.replace("/content/:", "/content-test/:")
            print("   Renaming '/content/:' to '/content-test/:' in code...")
        else:
            print("❌ pattern '/content/:' not found in file")
            return

        with sftp.open(REMOTE_FILE, 'w') as f:
            f.write(new_content)
            
        # 3. Restart
        print("   Restarting backend...")
        ssh.exec_command('pm2 restart backend')
        time.sleep(5) # Give it time
        
        # 4. Test URLs
        print("   Testing URLs...")
        
        # Old URL (Should 404 if code is live)
        old_url = f"{BASE_URL}/content/TPV/GEN/1"
        try:
            r_old = requests.get(old_url, timeout=5)
            print(f"   [OLD] {old_url} -> Status: {r_old.status_code}")
        except Exception as e:
            print(f"   [OLD] Error: {e}")
            
        # New URL (Should 200)
        new_url = f"{BASE_URL}/content-test/TPV/GEN/1"
        try:
            r_new = requests.get(new_url, timeout=5)
            print(f"   [NEW] {new_url} -> Status: {r_new.status_code}")
            if r_new.status_code == 200:
                print("   ✅ SUCCESS! New endpoint is working.")
                data = r_new.json()
                print(f"   Audio URL: {data.get('audio')}")
            else:
                print("   ❌ FAIL! New endpoint returned non-200.")
        except Exception as e:
            print(f"   [NEW] Error: {e}")

        # 5. Revert
        print("   Reverting changes...")
        with sftp.open(REMOTE_FILE, 'w') as f:
            f.write(content)
        ssh.exec_command('pm2 restart backend')
            
        ssh.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    test_rename()
