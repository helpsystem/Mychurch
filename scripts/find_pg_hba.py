
import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

def find_config():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD)
    
    # Try locating via psql command
    stdin, stdout, stderr = ssh.exec_command("sudo -u postgres psql -t -P format=unaligned -c 'SHOW hba_file;'")
    path = stdout.read().decode().strip()
    
    if not path or "could not connect" in path:
        print("Fallback search...")
        # Fallback search if psql fails
        stdin, stdout, stderr = ssh.exec_command("find /etc/postgresql -name pg_hba.conf")
        path = stdout.read().decode().strip().split('\n')[0]
        
    print(f"PG_HBA_PATH={path}")
    ssh.close()

if __name__ == '__main__':
    find_config()
