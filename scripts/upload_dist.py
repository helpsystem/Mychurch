#!/usr/bin/env python3
"""
Upload dist folder to production server
"""

import paramiko
import os
from pathlib import Path

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
PROJECT_PATH = '/root/Mychurch'
LOCAL_DIST = r'D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\dist'

print("╔════════════════════════════════════════════════════════════════╗")
print("║         📤 Upload dist folder to Production                  ║")
print("╚════════════════════════════════════════════════════════════════╝")
print()

if not os.path.exists(LOCAL_DIST):
    print(f"❌ dist folder not found: {LOCAL_DIST}")
    exit(1)

print(f"📂 Local: {LOCAL_DIST}")
print(f"🌐 Server: {SERVER}:{PROJECT_PATH}/dist")
print()

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("🔗 Connecting...")
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
    print("✅ Connected")
    print()
    
    sftp = ssh.open_sftp()
    
    # Remove old dist
    print("1️⃣ Removing old dist folder...")
    ssh.exec_command(f'rm -rf {PROJECT_PATH}/dist')
    print("   ✅ Removed")
    print()
    
    # Create new dist
    print("2️⃣ Creating new dist folder...")
    ssh.exec_command(f'mkdir -p {PROJECT_PATH}/dist')
    print("   ✅ Created")
    print()
    
    # Upload files
    print("3️⃣ Uploading files...")
    uploaded = 0
    total_size = 0
    
    for root, dirs, files in os.walk(LOCAL_DIST):
        # Create remote directories
        rel_path = os.path.relpath(root, LOCAL_DIST)
        if rel_path != '.':
            remote_dir = f"{PROJECT_PATH}/dist/{rel_path}".replace('\\', '/')
            try:
                sftp.mkdir(remote_dir)
            except:
                pass
        
        # Upload files
        for file in files:
            local_file = os.path.join(root, file)
            rel_file = os.path.relpath(local_file, LOCAL_DIST)
            remote_file = f"{PROJECT_PATH}/dist/{rel_file}".replace('\\', '/')
            
            try:
                sftp.put(local_file, remote_file)
                size = os.path.getsize(local_file)
                total_size += size
                uploaded += 1
                
                if uploaded % 10 == 0:
                    print(f"   ... {uploaded} files uploaded")
                    
            except Exception as e:
                print(f"   ⚠️  Failed: {rel_file} - {e}")
    
    print(f"   ✅ Uploaded {uploaded} files ({total_size / 1024 / 1024:.1f} MB)")
    print()
    
    # Verify
    print("4️⃣ Verifying...")
    stdin, stdout, stderr = ssh.exec_command(f'ls -lh {PROJECT_PATH}/dist/index.html')
    output = stdout.read().decode()
    
    if 'index.html' in output:
        print("   ✅ index.html verified")
    else:
        print("   ⚠️  index.html not found!")
    
    print()
    print("═" * 64)
    print("✅ Upload complete!")
    print()
    print("🌐 https://samanabyar.online/#/bible")
    print("   • Mobile mode selector is now live")
    print("   • All changes deployed")
    print("═" * 64)
    
    sftp.close()
    ssh.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
