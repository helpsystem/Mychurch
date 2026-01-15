#!/usr/bin/env python3
"""
Deploy Karaoke Mode Fix
Uploads the updated frontend dist folder to production
"""

import paramiko
import os
from pathlib import Path

# Server credentials
HOST = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

# Paths
LOCAL_DIST = r'D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\dist'
REMOTE_DIST = '/root/Mychurch/dist'

def upload_directory(sftp, local_path, remote_path):
    """Recursively upload a directory"""
    try:
        sftp.stat(remote_path)
    except FileNotFoundError:
        print(f"Creating remote directory: {remote_path}")
        sftp.mkdir(remote_path)
    
    for item in os.listdir(local_path):
        local_item = os.path.join(local_path, item)
        remote_item = f"{remote_path}/{item}"
        
        if os.path.isfile(local_item):
            print(f"Uploading: {item}")
            sftp.put(local_item, remote_item)
        elif os.path.isdir(local_item):
            upload_directory(sftp, local_item, remote_item)

def main():
    print("🚀 Starting deployment of Karaoke mode fix...")
    
    # Connect to server
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"📡 Connecting to {HOST}...")
        ssh.connect(HOST, username=USERNAME, password=PASSWORD)
        
        # Backup old dist
        print("💾 Backing up old dist folder...")
        stdin, stdout, stderr = ssh.exec_command(f'mv {REMOTE_DIST} {REMOTE_DIST}.backup.$(date +%Y%m%d_%H%M%S)')
        stdout.read()
        
        # Upload new dist
        print("📤 Uploading new dist folder...")
        sftp = ssh.open_sftp()
        upload_directory(sftp, LOCAL_DIST, REMOTE_DIST)
        sftp.close()
        
        # Restart backend (optional, but good practice)
        print("🔄 Restarting backend...")
        stdin, stdout, stderr = ssh.exec_command('pm2 restart backend')
        print(stdout.read().decode())
        
        print("✅ Deployment complete!")
        print("\n🎤 Karaoke mode fix has been deployed.")
        print("📍 Test at: https://samanabyar.online/#/bible")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        ssh.close()

if __name__ == '__main__':
    main()
