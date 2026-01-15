
import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
REMOTE_FILE = '/root/Mychurch/backend/routes/bible-local.js'
OUTPUT_FILE = 'temp_remote_dump.txt'

def dump_to_file():
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
        
        stdin, stdout, stderr = ssh.exec_command(f'cat {REMOTE_FILE}')
        content = stdout.read().decode('utf-8')
        
        lines = content.splitlines()
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            for i, line in enumerate(lines, start=1):
                # Dump lines around the target area
                if 275 <= i <= 310:
                    f.write(f"{i}: {line}\n")
                    
        print(f"Dumped lines to {OUTPUT_FILE}")
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    dump_to_file()
