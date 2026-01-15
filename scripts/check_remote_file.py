
import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

print("Checking remote file content...")
try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
    
    # Check lines 280-300 of backend/routes/bible-local.js
    stdin, stdout, stderr = ssh.exec_command('sed -n "280,300p" /root/Mychurch/backend/routes/bible-local.js')
    print("--- REMOTE FILE CONTENT ---")
    print(stdout.read().decode())
    print("---------------------------")
    
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
