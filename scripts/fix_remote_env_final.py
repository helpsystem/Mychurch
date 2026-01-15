
import paramiko

# Server Credentials
HOSTNAME = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

# Correct .env content
ENV_CONTENT = """
# FIXED PRODUCTION ENV
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/mychurch
DATABASE_URL_DISABLED=false
JWT_SECRET=MyChurchSuperSecretLocalJWTKey2024!
# Add other non-critical placeholders to prevent crashes
SUPABASE_URL=http://localhost:5432
SUPABASE_SERVICE_KEY=placeholder
"""

def fix_env():
    print(f"🔗 Connecting to {HOSTNAME}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOSTNAME, username=USERNAME, password=PASSWORD)
    
    print("📝 Overwriting /root/Mychurch/backend/.env ...")
    # Use echo to write the file content
    cmd = f"cat > /root/Mychurch/backend/.env <<EOF\n{ENV_CONTENT}\nEOF"
    ssh.exec_command(cmd)
    
    print("✅ File updated.")
    
    print("🔄 Restarting Backend...")
    stdin, stdout, stderr = ssh.exec_command('pm2 restart backend --update-env')
    print(stdout.read().decode())
    
    ssh.close()
    print("🎉 Done.")

if __name__ == "__main__":
    fix_env()
