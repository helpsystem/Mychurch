
import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

print("Checking PM2 Status...")
try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
    
    stdin, stdout, stderr = ssh.exec_command('pm2 list')
    print(stdout.read().decode())
    
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
