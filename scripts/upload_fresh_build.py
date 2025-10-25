#!/usr/bin/env python3
import paramiko
import os
from pathlib import Path

print("📦 Uploading Fresh Build to Production Server")
print("="*70)

LOCAL_DIST = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\dist"
REMOTE_DIST = "/root/Mychurch/dist"
SERVER_HOST = "samanabyar.online"
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("\n1. Connecting to server...")
ssh.connect(SERVER_HOST, 22, SERVER_USER, SERVER_PASSWORD, timeout=10)
print("   ✅ Connected")

# Backup current dist
print("\n2. Creating backup...")
stdin, stdout, stderr = ssh.exec_command(f"cp -r {REMOTE_DIST} {REMOTE_DIST}.backup-$(date +%Y%m%d-%H%M%S)")
stdout.read()
print("   ✅ Backup created")

# Upload new dist
print("\n3. Uploading files...")
sftp = ssh.open_sftp()

uploaded_files = 0
total_size = 0

def upload_directory(local_dir, remote_dir):
    global uploaded_files, total_size
    
    # Create remote directory
    try:
        sftp.mkdir(remote_dir)
    except:
        pass  # Directory might already exist
    
    for item in Path(local_dir).iterdir():
        local_path = str(item)
        remote_path = f"{remote_dir}/{item.name}"
        
        if item.is_dir():
            upload_directory(local_path, remote_path)
        else:
            sftp.put(local_path, remote_path)
            size = item.stat().st_size
            total_size += size
            uploaded_files += 1
            if uploaded_files % 10 == 0:
                print(f"   Uploaded {uploaded_files} files ({total_size / 1024 / 1024:.1f} MB)...")

upload_directory(LOCAL_DIST, REMOTE_DIST)
print(f"   ✅ Uploaded {uploaded_files} files ({total_size / 1024 / 1024:.1f} MB)")

sftp.close()

# Verify worship folder
print("\n4. Verifying worship folder...")
stdin, stdout, stderr = ssh.exec_command(f"test -d {REMOTE_DIST}/worship && echo 'DIR EXISTS' || echo 'NOT FOUND'")
result = stdout.read().decode('utf-8').strip()
print(f"   {result}")

if result == 'NOT FOUND':
    print("\n   ⚠️ Worship folder missing! This should have been copied during build.")
else:
    # Check if worship_songs.json exists
    stdin, stdout, stderr = ssh.exec_command(f"test -f {REMOTE_DIST}/worship/data/worship_songs.json && echo 'JSON EXISTS' || echo 'JSON MISSING'")
    json_result = stdout.read().decode('utf-8').strip()
    print(f"   {json_result}")

# Check index.html timestamp
print("\n6. Checking deployment timestamp...")
stdin, stdout, stderr = ssh.exec_command(f"ls -lh {REMOTE_DIST}/index.html")
print("   " + stdout.read().decode('utf-8').strip())

ssh.close()

print("\n" + "="*70)
print("✅ Deployment Complete!")
print(f"   Test: https://samanabyar.online/#/worship")
print("="*70)
