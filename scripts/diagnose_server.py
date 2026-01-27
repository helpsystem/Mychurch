
import paramiko
import os
import datetime

# Configuration
SERVER_HOST = "samanabyar.online"
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

def get_file_info(ssh, path):
    stdin, stdout, stderr = ssh.exec_command(f"ls -la --time-style=+%Y-%m-%d_%H:%M:%S {path}")
    return stdout.read().decode().strip()

def run_cmd(ssh, cmd):
    print(f"Running: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(f"OUT:\n{out}")
    if err: print(f"ERR:\n{err}")
    return out

def main():
    print("🔍 Starting Server Diagnosis...")
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASSWORD)
        print("✅ Connected to server")
        
        # 1. Check Nginx Config
        print("\n1️⃣ Checking Nginx Sites...")
        sites = run_cmd(ssh, "ls /etc/nginx/sites-enabled/")
        if sites:
            for site in sites.split():
                print(f"\n--- Config for {site} ---")
                run_cmd(ssh, f"cat /etc/nginx/sites-enabled/{site}")
        
        # 2. Check Directories
        print("\n2️⃣ Checking Web Directories...")
        
        dirs_to_check = ["/var/www/mychurch", "/var/www/html", "/var/www/mychurch/dist"]
        
        for d in dirs_to_check:
            print(f"\nScanning: {d}")
            run_cmd(ssh, f"ls -la {d} | head -n 10")
            
            # Check index.html timestamp specifically
            index = f"{d}/index.html"
            info = run_cmd(ssh, f"stat {index}")

        ssh.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
