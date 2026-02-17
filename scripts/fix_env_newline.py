
import paramiko
import time

# Configuration
SERVER_HOST = "samanabyar.online"
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

def main():
    print("🔧 Fixing .env Newline Issue...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASSWORD)
        print("✅ Connected!")
        
        # Read file
        stdin, stdout, stderr = ssh.exec_command("cat /root/Mychurch/backend/.env")
        content = stdout.read().decode()
        
        # Check for the merged line error
        if "mychurchDATABASE_URL=" in content:
            print("⚠️ Found merged line. Fixing...")
            new_content = content.replace("mychurchDATABASE_URL=", "mychurch\nDATABASE_URL=")
            
            # Write back
            # Use echo with a unique delimiter to avoid quoting hell, or just sftp?
            # Creating a temp file and moving it is safer.
            sftp = ssh.open_sftp()
            with sftp.file("/root/Mychurch/backend/.env.tmp", "w") as f:
                f.write(new_content)
            
            ssh.exec_command("mv /root/Mychurch/backend/.env.tmp /root/Mychurch/backend/.env")
            print("✅ .env Fixed.")
        else:
            print("ℹ️ No merged line found (maybe already fixed?).")
            
        # Restart Backend
        print("Bg Restarting PM2 Backend...")
        ssh.exec_command("pm2 restart 1")
        time.sleep(5) 
        
        # Verify Login
        print("🧪 Verifying Login Endpoint...")
        cmd = "curl -v -X POST -H 'Content-Type: application/json' -d '{\"email\":\"test@test.com\",\"password\":\"wrongpass\"}' http://localhost:3001/api/auth/login"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode()
        print(f"Server Response:\n{out}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        ssh.close()
        print("\n🏁 Done.")

if __name__ == "__main__":
    main()
