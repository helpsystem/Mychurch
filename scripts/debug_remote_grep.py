
import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

print("Debugging remote file...")
try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
    
    # Check file timestamp
    stdin, stdout, stderr = ssh.exec_command('ls -l /root/Mychurch/backend/routes/bible-local.js')
    print(f"Timestamp: {stdout.read().decode().strip()}")
    
    # Check specific line content
    stdin, stdout, stderr = ssh.exec_command('grep "audioUrl =" /root/Mychurch/backend/routes/bible-local.js')
    print("Content:")
    print(stdout.read().decode())
    
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
