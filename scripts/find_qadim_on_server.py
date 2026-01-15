import paramiko

HOST = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

def main():
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        print(f"Connecting to {HOST}...")
        ssh.connect(HOST, username=USERNAME, password=PASSWORD)

        cmd = "find /root/Mychurch -name QADIM -type d"
        print(f"\nRunning: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode().strip()
        print(out)
        
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
