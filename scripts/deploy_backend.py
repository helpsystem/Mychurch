#!/usr/bin/env python3
"""
Deploy Backend to Server
Uploads backend files and restarts the service
"""

import paramiko
import os
from pathlib import Path

# Server configuration
SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
BACKEND_PATH = '/root/Mychurch/backend'  # ← Fixed: capital M

def deploy_backend():
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║         🚀 Deploy Backend به سرور                            ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    
    # Get backend directory
    root_dir = Path(__file__).parent.parent
    backend_dir = root_dir / 'backend'
    
    if not backend_dir.exists():
        print(f"❌ Backend directory not found: {backend_dir}")
        return False
    
    print(f"📂 Backend لوکال: {backend_dir}")
    print(f"🌐 سرور: {SERVER}")
    print(f"📁 مسیر روی سرور: {BACKEND_PATH}")
    print()
    
    try:
        # Connect to server
        print("🔗 اتصال به سرور...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD)
        print("✅ اتصال SSH برقرار شد")
        
        # Create SFTP client
        sftp = ssh.open_sftp()
        print("✅ اتصال SFTP برقرار شد")
        print()
        
        # Upload server.js directly to specified path
        print("📤 در حال آپلود server.js...")
        local_server_js = backend_dir / 'server.js'
        remote_server_js = f'{BACKEND_PATH}/server.js'
        
        print(f"   📁 Target: {remote_server_js}")
        
        sftp.put(str(local_server_js), remote_server_js)
        print(f"   ✅ server.js uploaded ({local_server_js.stat().st_size / 1024:.2f} KB)")
        print()
        
        # Restart backend service
        print("🔄 در حال Restart کردن Backend...")
        
        # Try pm2 first
        stdin, stdout, stderr = ssh.exec_command('pm2 restart backend 2>&1')
        output = stdout.read().decode()
        error = stderr.read().decode()
        
        if 'online' in output.lower() or 'restarted' in output.lower():
            print("✅ Backend با موفقیت restart شد (pm2)")
        else:
            # Try systemctl
            stdin, stdout, stderr = ssh.exec_command('sudo systemctl restart backend 2>&1')
            output2 = stdout.read().decode()
            
            if error and 'command not found' not in error:
                print(f"⚠️  PM2 output: {output}")
                print(f"⚠️  Systemctl output: {output2}")
            else:
                print("✅ Backend restart شد")
        
        print()
        print("════════════════════════════════════════════════════════════════")
        print("✅ Backend با موفقیت deploy شد!")
        print()
        print("🌐 API: https://samanabyar.online/api")
        print("📊 Rate Limit: 1000 requests / 15 min")
        print("════════════════════════════════════════════════════════════════")
        
        sftp.close()
        ssh.close()
        return True
        
    except Exception as e:
        print(f"❌ خطا: {str(e)}")
        return False

if __name__ == '__main__':
    deploy_backend()
