
import paramiko
import time

# Configuration
SERVER_HOST = "samanabyar.online"
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

DB_URL = "postgresql://mychurch_user:MyChurch2024Secure!@localhost:5433/mychurch"

def main():
    print("🔧 Fixing VPS Database Env...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASSWORD)
        print("✅ Connected!")
        
        # 1. Append DATABASE_URL to .env
        print("📝 Updating .env with local DATABASE_URL...")
        # Check if DATABASE_URL already exists
        stdin, stdout, stderr = ssh.exec_command("grep '^DATABASE_URL=' /root/Mychurch/backend/.env")
        if stdout.read().strip():
             print("⚠️ DATABASE_URL already set. Updating it...")
             # Use sed to replace
             escaped_url = DB_URL.replace("/", "\/").replace("&", "\&")
             cmd = f"sed -i 's/^DATABASE_URL=.*/DATABASE_URL={escaped_url}/' /root/Mychurch/backend/.env"
             ssh.exec_command(cmd)
        else:
             print("➕ Appending DATABASE_URL...")
             cmd = f"echo 'DATABASE_URL={DB_URL}' >> /root/Mychurch/backend/.env"
             ssh.exec_command(cmd)
        
        # 2. Restart Backend
        print("Bg Restarting PM2 Backend...")
        ssh.exec_command("pm2 restart 1")
        time.sleep(5) 
        
        # 3. Verify Login Endpoint (db check)
        print("🧪 Verifying Login Endpoint...")
        cmd = "curl -v -X POST -H 'Content-Type: application/json' -d '{\"email\":\"test@test.com\",\"password\":\"wrongpass\"}' http://localhost:3001/api/auth/login"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode()
        print(f"Server Response:\n{out}")
        
        if "Internal server error" in out or "500 Internal" in out:
             print("❌ Still 500 Error.")
        elif "Invalid email or password" in out or "401" in out or "400" in out:
             print("✅ Success! Database connected (Got expected 401/400 for bad creds).")
        else:
             print("⚠️ Unknown response (check details).")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
