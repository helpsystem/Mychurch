
import paramiko
import os
from pathlib import Path
import time

# Server configuration
SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
SERVER_BASE = '/root/Mychurch'

# Files to upload (relative to project root)
FILES_TO_UPLOAD = [
    ('backend/routes/bible-local.js', f'{SERVER_BASE}/backend/routes/bible-local.js'),
    ('backend/server.js', f'{SERVER_BASE}/backend/server.js'),
    ('backend/dev-server.js', f'{SERVER_BASE}/backend/dev-server.js'),
    ('backend/routes/leadersRoutes.js', f'{SERVER_BASE}/backend/routes/leadersRoutes.js'),
    ('backend/db-postgres.js', f'{SERVER_BASE}/backend/db-postgres.js'),
    ('backend/server-wrapper.js', f'{SERVER_BASE}/backend/server-wrapper.js'),
    ('backend/ecosystem.config.js', f'{SERVER_BASE}/backend/ecosystem.config.js'),
]

def deploy_backend():
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║         🚀 Deploy Backend Fixes Only                         ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    
    # Get project root
    root_dir = Path(__file__).parent.parent
    
    try:
        # Connect to server
        print(f"🔗 Connecting to {SERVER}...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
        print("✅ SSH Connected")
        
        # Create SFTP client
        sftp = ssh.open_sftp()
        print("✅ SFTP Connected")
        print()
        
        # Upload files
        print("📤 Uploading modified backend files...")
        
        for local_path, remote_path in FILES_TO_UPLOAD:
            local_file = root_dir / local_path
            
            if not local_file.exists():
                print(f"   ⚠️  File NOT found: {local_path}")
                continue
                
            print(f"   📄 {local_path} -> {remote_path}")
            sftp.put(str(local_file), remote_path)
            size_kb = local_file.stat().st_size / 1024
            print(f"      ✅ Uploaded ({size_kb:.2f} KB)")
        
        print()
        
        # Restart backend with PM2
        print("🔄 Restarting Backend Service (PM2)...")
        stdin, stdout, stderr = ssh.exec_command('pm2 restart backend')
        pm2_output = stdout.read().decode()
        pm2_error = stderr.read().decode()
        
        print(pm2_output)
        if pm2_error:
            print(f"Error/Stderr: {pm2_error}")
            
        if 'online' in pm2_output.lower() or 'restarted' in pm2_output.lower():
            print("✅ Backend restarted successfully")
        else:
            print("⚠️ Check PM2 status manually")
        
        sftp.close()
        ssh.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    deploy_backend()
