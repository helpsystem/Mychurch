
import paramiko
import time

# Configuration
SERVER_HOST = "samanabyar.online"
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

def main():
    print("🚀 Final Verification...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASSWORD)
        print("✅ Connected!")
        
        # 1. Check Public Health
        print("\n👉 Checking Public Health (https://samanabyar.online/api/health)...")
        stdin, stdout, stderr = ssh.exec_command("curl -s -v https://samanabyar.online/api/health")
        out = stdout.read().decode()
        print(out)
        
        # 2. Check Public Login (Validates DB)
        print("\n👉 Checking Public Login (https://samanabyar.online/api/auth/login)...")
        cmd = "curl -s -v -X POST -H 'Content-Type: application/json' -d '{\"email\":\"test@test.com\",\"password\":\"wrongpass\"}' https://samanabyar.online/api/auth/login"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode()
        print(f"Response:\n{out}")
        
        if "Invalid email or password" in out or "401" in out:
             print("\n✅ SUCCESS: Login rejected with 401 (DB is working).")
        elif "Internal server error" in out or "500" in out:
             print("\n❌ FAILURE: Login returned 500 (DB issue persists).")
        else:
             print("\n⚠️ UNKNOWN: Check output above.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        ssh.close()
        print("\n🏁 Done.")

if __name__ == "__main__":
    main()
