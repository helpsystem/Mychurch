
import paramiko
import time
from pathlib import Path

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
SERVER_BASE = '/root/Mychurch'

def nuclear_restart():
    print("☢️  INITIATING NUCLEAR RESTART ☢️")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
        
        # 0. Upload Verified File first (just to be safe)
        print("📤 Ensuring correct file is present...")
        local_file = Path(__file__).parent.parent / 'backend/routes/bible-local.js'
        remote_file = f'{SERVER_BASE}/backend/routes/bible-local.js'
        sftp = ssh.open_sftp()
        sftp.put(str(local_file), remote_file)
        print("   File uploaded.")
        
        # 1. Stop PM2
        print("🛑 Stopping PM2 processes...")
        ssh.exec_command('pm2 stop all')
        time.sleep(2)
        
        # 2. Kill all node processes
        print("🔪 Killing all node processes (pkill)...")
        ssh.exec_command('pkill -9 -f node')
        time.sleep(2)
        
        # 3. Check for survivors
        print("🔍 Checking for surviving node processes...")
        stdin, stdout, stderr = ssh.exec_command('ps aux | grep node')
        survivors = stdout.read().decode()
        if "node" in survivors and "grep" not in survivors:
            print(f"   ⚠️  Survivors found:\n{survivors}")
            ssh.exec_command('killall -9 node') # Try killall
        else:
            print("   ✅ No node processes running.")
            
        # 4. Start Backend
        print("🌱 Starting Backend...")
        # Start using PM2 ecosystem or command
        start_cmd = f'cd {SERVER_BASE} && pm2 start backend/server.js --name backend --update-env'
        stdin, stdout, stderr = ssh.exec_command(start_cmd)
        print(stdout.read().decode())
        
        # 5. Save PM2
        ssh.exec_command('pm2 save')
        
        print("✅ Nuclear Restart Complete.")
        
        sftp.close()
        ssh.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    nuclear_restart()
