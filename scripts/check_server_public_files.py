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

        cmd = "ls -R /root/Mychurch/public/bible_data/timestamps"
        print(f"\nRunning: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print(stdout.read().decode())
        print(stderr.read().decode())

        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
