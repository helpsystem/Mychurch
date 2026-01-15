import paramiko
import time

HOST = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

def run_remote_command(ssh, command):
    print(f"Running: {command}")
    stdin, stdout, stderr = ssh.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(f"STDOUT: {out}")
    if err: print(f"STDERR: {err}")
    return exit_status, out

def main():
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        print(f"Connecting to {HOST}...")
        ssh.connect(HOST, username=USERNAME, password=PASSWORD)

        # 1. Check file existence
        print("\n--- Checking Timing File ---")
        cmd = "ls -l /root/Mychurch/dist/bible_data/timestamps/QADIM/GEN/1.json"
        status, _ = run_remote_command(ssh, cmd)
        if status != 0:
            print("❌ Timing file NOT FOUND in dist!")
        else:
            print("✅ Timing file exists.")

        # 2. Restart Backend
        print("\n--- Restarting Backend ---")
        run_remote_command(ssh, "pm2 restart backend")
        time.sleep(5) # Wait for restart

        # 3. Verify file serving via HTTP (localhost)
        print("\n--- Verifying HTTP Access ---")
        cmd = "curl -I http://localhost:3000/bible_data/timestamps/QADIM/GEN/1.json"
        status, out = run_remote_command(ssh, cmd)
        if "200 OK" in out:
             print("✅ File served successfully via HTTP (200 OK)")
        else:
             print("❌ Failed to fetch file via HTTP during verification.")

        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
