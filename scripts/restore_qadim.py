import paramiko
import sys

HOST = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

def run_command(ssh, cmd):
    print(f"CMD: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(f"OUT: {out}")
    if err: print(f"ERR: {err}")
    return out

def main():
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        print(f"Connecting to {HOST}...")
        ssh.connect(HOST, username=USERNAME, password=PASSWORD)

        # 1. Find latest backup
        print("\n--- Finding Backup ---")
        backup_dir = run_command(ssh, "ls -td /root/Mychurch/dist.backup* | head -n 1")
        if not backup_dir:
            print("No backup found!")
            return
        
        print(f"Latest backup: {backup_dir}")

        # 2. Check for QADIM timestamps in backup
        print("\n--- Checking for QADIM in Backup ---")
        # Check dist/bible_data/timestamps/QADIM
        qadim_path_backup = f"{backup_dir}/bible_data/timestamps/QADIM"
        check = run_command(ssh, f"ls -d {qadim_path_backup}")
        
        target_path = "/root/Mychurch/public/bible_data/timestamps/QADIM"
        
        if "No such file" in check or not check:
            print(f"QADIM not found in {qadim_path_backup}")
            # Try finding it elsewhere in backup
            find_qadim = run_command(ssh, f"find {backup_dir} -name QADIM -type d")
            print(f"Found QADIM directories in backup: {find_qadim}")
            # If found, use that path
        else:
            print(f"Found QADIM at {qadim_path_backup}")
            
            # 3. Restore
            print(f"\n--- Restoring to {target_path} ---")
            # Create parent dir if needed
            run_command(ssh, "mkdir -p /root/Mychurch/public/bible_data/timestamps")
            
            # Copy
            cmd = f"cp -r {qadim_path_backup} {target_path}"
            run_command(ssh, cmd)
            
            # Verify restoration
            verify = run_command(ssh, f"ls -d {target_path}")
            if verify:
                print("✅ Restoration successful!")
                run_command(ssh, "pm2 restart backend")
            else:
                print("❌ Restoration failed.")

        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
