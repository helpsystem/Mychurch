
import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
LOG_FILE = '/root/Mychurch/backend/logs/pm2-out.log'

def read_log():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER, username=USERNAME, password=PASSWORD)
    
    # Read last 4KB
    cmd = f'tail -c 4000 {LOG_FILE}'
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode())
    client.close()

if __name__ == '__main__':
    read_log()
