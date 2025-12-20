import paramiko
import os

SERVER_HOST = "samanabyar.online"
SERVER_PORT = 22
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(SERVER_HOST, port=SERVER_PORT, username=SERVER_USER, password=SERVER_PASSWORD)
    print("✅ Connected")
    
    stdin, stdout, stderr = ssh.exec_command("cat /var/www/html/index.html | tail -n 20")
    content = stdout.read().decode('utf-8')
    print("--- TAIL OF /var/www/html/index.html ---")
    print(content)
    
    stdin, stdout, stderr = ssh.exec_command("grep -c 'initial-loader' /var/www/html/index.html")
    count = stdout.read().decode('utf-8').strip()
    print(f"Count of 'initial-loader': {count}")
    
    ssh.close()
except Exception as e:
    print(f"❌ Error: {e}")
