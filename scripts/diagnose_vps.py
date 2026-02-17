
import paramiko
import time

# Configuration
SERVER_HOST = "samanabyar.online"
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

NODE_SCRIPT = """
require('dotenv').config({ path: '/root/Mychurch/backend/.env' });
const { Pool } = require('pg');

console.log('Testing DB Access...');
console.log('URL:', process.env.DATABASE_URL);

try {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false
    });

    pool.query('SELECT 1', (err, res) => {
        if (err) {
            console.error('❌ Connection Failed:', err.message);
            process.exit(1);
        } else {
            console.log('✅ Connection Success!');
            process.exit(0);
        }
    });

} catch (e) {
    console.error('❌ Init Failed:', e.message);
}
"""

def main():
    print("🔍 Testing DB Connection...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    with open("diagnose_results.txt", "w", encoding="utf-8") as f:
        try:
            ssh.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASSWORD)
            
            # Write script to remote file
            cmd = f"echo \"{NODE_SCRIPT}\" > /root/Mychurch/backend/test_db_manual.js"
            ssh.exec_command(cmd)
            
            # Run it
            print("RUNNING NODE SCRIPT...", file=f)
            stdin, stdout, stderr = ssh.exec_command("cd /root/Mychurch/backend && node test_db_manual.js")
            
            out = stdout.read().decode()
            err = stderr.read().decode()
            
            print(out, file=f)
            if err:
                print(f"STDERR: {err}", file=f)
                
            print(out) # To console too
            if err:
                print(f"STDERR: {err}")

        except Exception as e:
            print(f"❌ Error: {e}", file=f)
        finally:
            ssh.close()
            print("\n🏁 Done.", file=f)

if __name__ == "__main__":
    main()
