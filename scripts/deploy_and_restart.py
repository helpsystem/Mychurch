
import paramiko
import os
from pathlib import Path
import time

# Server configuration
SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
SERVER_BASE = '/root/Mychurch'

FILES_TO_UPLOAD = [
    ('backend/routes/bible-local.js', f'{SERVER_BASE}/backend/routes/bible-local.js'),
    ('backend/server.js', f'{SERVER_BASE}/backend/server.js'),
    ('backend/dev-server.js', f'{SERVER_BASE}/backend/dev-server.js'),
]

def deploy():
    print("🚀 Deployment Started...")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
        print("✅ SSH Connected")
        
        sftp = ssh.open_sftp()
        project_root = Path(__file__).parent.parent
        
        # 1. Upload Files
        print("📤 Uploading files...")
        for local, remote in FILES_TO_UPLOAD:
            local_path = project_root / local
            if local_path.exists():
                sftp.put(str(local_path), remote)
                print(f"   ✅ Uploaded {local}")
            else:
                print(f"   ⚠️ Missing {local}")
                
        # 2. Restart Backend (Robust)
        print("🔄 Restarting Backend...")
        # Check if process exists
        stdin, stdout, stderr = ssh.exec_command('pm2 pid backend')
        pid = stdout.read().decode().strip()
        
        if pid and pid.isdigit():
            print(f"   Backend running (PID {pid}), restarting...")
            cmd = 'pm2 restart backend'
        else:
            print("   Backend NOT running, starting...")
            # Ensure we are in the right directory
            cmd = f'cd {SERVER_BASE} && pm2 start backend/server.js --name backend'
            
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode()
        err = stderr.read().decode()
        
        print(f"OUTPUT: {out}")
        if err: print(f"ERROR: {err}")
        
        # 3. Save PM2 list
        ssh.exec_command('pm2 save')
        print("✅ PM2 Saved")
        
        sftp.close()
        ssh.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    deploy()
