
import paramiko
import os
import sys

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
SERVER_BASE = '/root/Mychurch'

SEARCH_PATHS = [
    f'{SERVER_BASE}/public/bible_data/audio',
    f'{SERVER_BASE}/frontend/public/bible_data/audio',
    f'{SERVER_BASE}/dist/bible_data/audio',
    '/var/www/html/bible_data/audio'  # Nginx root
]

def locate_audio():
    print("🕵️‍♂️ Hunting for Audio Files...")
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
        
        for path in SEARCH_PATHS:
            print(f"\nChecking: {path}")
            stdin, stdout, stderr = ssh.exec_command(f'ls -F {path}')
            out = stdout.read().decode().strip()
            err = stderr.read().decode().strip()
            
            if out:
                print(f"   ✅ FOUND:\n{out}")
                # Check MOJDEH inside
                stdin, stdout, stderr = ssh.exec_command(f'ls -F {path}/MOJDEH')
                mojdeh_out = stdout.read().decode().strip()
                if mojdeh_out:
                     print(f"      ✅ MOJDEH exists ({len(mojdeh_out.splitlines())} items)")
                else:
                     print("      ❌ MOJDEH missing")
                     
            elif "No such file" in err:
                 print("   ❌ Path does not exist")
            else:
                 print("   ⚠️  empty directory")
                 
        ssh.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    locate_audio()
