#!/usr/bin/env python3
"""
Quick Backend Restart
Just restarts the backend service - files already uploaded
"""

import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

print("🔄 Quick Backend Restart...")
print()

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
    print("✅ Connected to server")
    
    # Restart backend
    print("🔄 Restarting backend...")
    stdin, stdout, stderr = ssh.exec_command('pm2 restart backend')
    output = stdout.read().decode()
    
    if 'online' in output.lower() or 'restarted' in output.lower():
        print("✅ Backend restarted successfully!")
    else:
        print(f"PM2 output: {output}")
    
    print()
    print("════════════════════════════════════════")
    print("✅ Done!")
    print("🌐 https://samanabyar.online/#/bible")
    print("════════════════════════════════════════")
    
    ssh.close()
    
except Exception as e:
    print(f"❌ Error: {e}")

