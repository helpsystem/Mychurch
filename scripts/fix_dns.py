
import paramiko
import time

# Configuration
SERVER_HOST = "samanabyar.online"
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

def main():
    print("🔧 Fixing VPS DNS...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASSWORD)
        print("✅ Connected!")
        
        # 1. Backup existing resolv.conf
        print("📦 Backing up resolv.conf...")
        ssh.exec_command("cp /etc/resolv.conf /etc/resolv.conf.bak")
        
        # 2. Check if it's a symlink and remove it
        print("🗑️ Removing existing resolv.conf (symlink or file)...")
        ssh.exec_command("rm -f /etc/resolv.conf")
        
        # 3. Write new resolv.conf
        print("📝 Writing new resolv.conf with Google/Cloudflare DNS...")
        cmd = 'echo "nameserver 8.8.8.8\nnameserver 1.1.1.1" > /etc/resolv.conf'
        stdin, stdout, stderr = ssh.exec_command(cmd)
        exit_status = stdout.channel.recv_exit_status()
        
        if exit_status == 0:
            print("✅ DNS Updated successfully.")
        else:
            print(f"❌ Failed to update DNS: {stderr.read().decode()}")

        # 4. Verify
        print("🧪 Verifying DNS resolution for Supabase...")
        stdin, stdout, stderr = ssh.exec_command("nslookup wxzhzsqicgwfxffxayhy.supabase.co")
        out = stdout.read().decode()
        if "Address" in out:
             print(f"✅ Resolution Success:\n{out}")
        else:
             print(f"❌ Resolution Failed:\n{out}\n{stderr.read().decode()}")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
