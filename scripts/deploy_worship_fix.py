import paramiko
import sys

# SSH Configuration
SSH_HOST = '185.208.76.178'
SSH_PORT = 22
SSH_USER = 'root'
SSH_PASSWORD = 'KishavarZ@1403'

# Paths
LOCAL_FILE = r'd:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\backend\middleware\urlConverter.js'
REMOTE_FILE = '/var/www/html/mychurch/backend/middleware/urlConverter.js'

def deploy_worship_fix():
    """Deploy the worship audio fix to production"""
    try:
        # Connect to server
        print("Connecting to production server...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASSWORD)
        
        # Upload the file
        print(f"Uploading {LOCAL_FILE} to {REMOTE_FILE}...")
        sftp = ssh.open_sftp()
        sftp.put(LOCAL_FILE, REMOTE_FILE)
        sftp.close()
        print("✓ File uploaded successfully")
        
        # Restart backend
        print("Restarting backend service...")
        stdin, stdout, stderr = ssh.exec_command('cd /var/www/html/mychurch/backend && pm2 restart mychurch-backend')
        exit_code = stdout.channel.recv_exit_status()
        
        if exit_code == 0:
            print("✓ Backend restarted successfully")
            print("\n=== Deployment Complete ===")
            print("Worship audio fix deployed to production")
        else:
            print("✗ Failed to restart backend")
            print(stderr.read().decode())
            sys.exit(1)
        
        ssh.close()
        
    except Exception as e:
        print(f"✗ Deployment failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    deploy_worship_fix()
