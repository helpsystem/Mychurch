
import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

def fix_dns():
    print("🔧 Fixing DNS Configuration...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD)
    
    # Overwrite resolving config with Google DNS
    cmd = 'echo "nameserver 8.8.8.8" > /etc/resolv.conf'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    # Verify
    verify_cmd = 'cat /etc/resolv.conf'
    stdin, stdout, stderr = ssh.exec_command(verify_cmd)
    print("New Config:")
    print(stdout.read().decode())
    
    ssh.close()

if __name__ == '__main__':
    fix_dns()
