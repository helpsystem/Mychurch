
import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
REMOTE_FILE = '/root/Mychurch/backend/routes/bible-local.js'

def dump_segment():
    print("------- REMOTE FILE DUMP (Lines 270-310) -------")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
        
        stdin, stdout, stderr = ssh.exec_command(f'sed -n "270,310p" {REMOTE_FILE}')
        lines = stdout.readlines()
        
        for i, line in enumerate(lines, start=270):
            print(f"{i}: {line.strip()}")
            
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")
    print("------------------------------------------------")

if __name__ == '__main__':
    dump_segment()
