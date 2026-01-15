
import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

def cat_env():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER, username=USERNAME, password=PASSWORD)
    stdin, stdout, stderr = client.exec_command('cat /root/Mychurch/backend/.env')
    content = stdout.read().decode()
    print("--- START ENV ---")
    print(content)
    print("--- END ENV ---")
    client.close()

if __name__ == '__main__':
    cat_env()
