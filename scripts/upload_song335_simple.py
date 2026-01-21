import paramiko
import os
import sys

# Fix Windows console encoding
sys.stdout.reconfigure(encoding='utf-8')

HOST = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
LOCAL_FILE = r'D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\frontend\public\worship\data\timings\song_335_timing.json'
REMOTE_FILE = '/var/www/samanabyar.online/frontend/dist/worship/data/timings/song_335_timing.json'

def main():
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        print("Connecting to " + HOST + "...")
        ssh.connect(HOST, username=USERNAME, password=PASSWORD, timeout=30)
        print("[OK] Connected!")

        sftp = ssh.open_sftp()
        print("\nUploading timing file with Finglish...")
        print("  Local:  " + LOCAL_FILE)
        print("  Remote: " + REMOTE_FILE)
        
        sftp.put(LOCAL_FILE, REMOTE_FILE)
        
        # Verify file size
        local_size = os.path.getsize(LOCAL_FILE)
        remote_size = sftp.stat(REMOTE_FILE).st_size
        print("\n[OK] Upload successful!")
        print("  Local size:  " + str(local_size) + " bytes")
        print("  Remote size: " + str(remote_size) + " bytes")
        
        if local_size == remote_size:
            print("  [OK] Size verification PASSED")
        else:
            print("  [WARN] Size mismatch!")
        
        sftp.close()
        ssh.close()
        
        print("\n" + "="*60)
        print("DEPLOYMENT COMPLETE!")
        print("="*60)
        print("\nNext Steps:")
        print("1. Open https://samanabyar.online/#/worship")
        print("2. Clear browser cache & localStorage")
        print("3. Find song 'Arami Delhaayi' (ID 335)")
        print("4. Click the karaoke button")
        print("5. Click Settings icon in player")
        print("6. Toggle 'Finglish' to ON")
        print("7. Watch Finglish appear below Persian lyrics!")
        
    except Exception as e:
        print("\n[ERROR] " + str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if not os.path.exists(LOCAL_FILE):
        print("[ERROR] Local file not found:")
        print("  " + LOCAL_FILE)
    else:
        size_kb = os.path.getsize(LOCAL_FILE) / 1024
        print("[OK] Local file found (" + str(round(size_kb, 1)) + " KB)")
        main()
