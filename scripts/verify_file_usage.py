
import paramiko
import time

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
REMOTE_FILE = '/root/Mychurch/backend/routes/bible-local.js'

def verify_usage():
    print("🕵️‍♂️ Verifying File Usage...")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
        
        # 1. Read remote content
        sftp = ssh.open_sftp()
        print(f"   Downloading {REMOTE_FILE}...")
        try:
            with sftp.open(REMOTE_FILE, 'r') as f:
                content = f.read().decode('utf-8')
        except FileNotFoundError:
            print(f"❌ File not found at {REMOTE_FILE}")
            return
            
        # 2. Add debug log
        marker = "// DEBUG MARKER " + str(int(time.time()))
        print(f"   Adding marker: {marker}")
        
        new_content = f"console.log('{marker}');\n" + content
        
        # 3. Write back
        print("   Uploading modified file...")
        with sftp.open(REMOTE_FILE, 'w') as f:
            f.write(new_content)
            
        # 4. Restart
        print("   Restarting backend...")
        ssh.exec_command('pm2 restart backend')
        time.sleep(3)
        
        # 5. Check logs
        print("   Checking logs...")
        stdin, stdout, stderr = ssh.exec_command('pm2 logs backend --lines 100 --nostream')
        logs = stdout.read().decode()
        
        if marker in logs:
            print(f"✅ SUCCESS! Found marker '{marker}' in logs.")
            print("   This confirms we are editing the correct file.")
        else:
            print(f"❌ FAILURE! Marker '{marker}' NOT found in logs.")
            print("   The server is NOT running this file.")
            
        sftp.close()
        ssh.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    verify_usage()
