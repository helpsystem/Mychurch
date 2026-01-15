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

        # 1. Create QADIM directory if not exists
        print("Creating QADIM directory...")
        cmd = "mkdir -p /root/Mychurch/public/bible_data/timestamps/QADIM"
        ssh.exec_command(cmd)

        # 2. Copy TPV content to QADIM
        print("Copying TPV timestamps to QADIM (Fallback)...")
        # Use cp -n to avoid overwriting if some files somehow exist
        cmd = "cp -rn /root/Mychurch/public/bible_data/timestamps/TPV/* /root/Mychurch/public/bible_data/timestamps/QADIM/"
        ssh.exec_command(cmd)

        # 3. Verify
        print("Verifying QADIM file existence...")
        stdin, stdout, stderr = ssh.exec_command("ls /root/Mychurch/public/bible_data/timestamps/QADIM/GEN/1.json")
        out = stdout.read().decode().strip()
        if "1.json" in out:
            print("✅ File created successfully.")
        else:
            print("❌ File creation failed.")

        # 4. Restart Backend
        print("Restarting backend...")
        ssh.exec_command("pm2 restart backend")

        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
