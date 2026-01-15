
import paramiko
import os

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

def test_curl():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD)
    
    # Get Env vars
    stdin, stdout, stderr = ssh.exec_command('cat /root/Mychurch/backend/.env')
    env_content = stdout.read().decode()
    
    url = ""
    key = ""
    
    for line in env_content.splitlines():
        if line.startswith('SUPABASE_URL='):
            url = line.split('=')[1].strip()
        if line.startswith('SUPABASE_SERVICE_KEY='):
            key = line.split('=')[1].strip()
            
    if not url or not key:
        print("❌ Could not parse env vars")
        return

    print(f"🚀 Curl Testing: {url}/rest/v1/leaders?select=*&limit=1")
    
    # Simple Curl
    cmd = f'curl -v -H "apikey: {key}" -H "Authorization: Bearer {key}" "{url}/rest/v1/leaders?select=*&limit=1"'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    print("\nSTDOUT:")
    print(stdout.read().decode())
    print("\nSTDERR:")
    print(stderr.read().decode())
    
    ssh.close()

if __name__ == '__main__':
    test_curl()
