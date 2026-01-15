
import paramiko
import time

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
SERVER_BASE = '/root/Mychurch'

def hard_restart():
    print("🔥 Performing HARD RESTART of Backend...")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
        
        # 1. List processes
        stdin, stdout, stderr = ssh.exec_command('pm2 jlist')
        print("   Current processes check...")
        
        # 2. Delete backend
        print("   🗑️  Deleting 'backend' process...")
        ssh.exec_command('pm2 delete backend')
        time.sleep(2)
        
        # 3. Start fresh
        print("   🌱 Starting 'backend' fresh...")
        # Use absolute path to ensure correct file
        cmd = f'cd {SERVER_BASE} && pm2 start backend/server.js --name backend --update-env'
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        out = stdout.read().decode()
        err = stderr.read().decode()
        
        print("\n   --- Start Output ---")
        print(out)
        if err: print(f"   Error: {err}")
        
        # 4. Save
        ssh.exec_command('pm2 save')
        print("   💾 PM2 saved")
        
        ssh.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    hard_restart()
