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

        print("\n--- Listing Public Timestamps ---")
        cmd = "ls -F /root/Mychurch/public/bible_data/timestamps/"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print(stdout.read().decode())
        
        print("\n--- Listing Dist Backups ---")
        cmd = "ls -d /root/Mychurch/dist.backup*"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print(stdout.read().decode())

        print("\n--- Checking for QADIM in Backups (First one found) ---")
        # Try to find QADIM in the most recent backup
        cmd = "find /root/Mychurch/dist.backup* -name QADIM -type d | head -n 1"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print(stdout.read().decode())

        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
