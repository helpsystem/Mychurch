#!/usr/bin/env python3
"""
Deploy Karaoke Mode Fix
Uploads the updated frontend dist folder to production
"""

import paramiko
import os
from pathlib import Path

# Server credentials
HOST = 'samanabyar.online'  # or IP: 195.250.25.185
USERNAME = 'root'
PASSWORD = 'KishavarZ@1403'

# Paths
LOCAL_DIST = r'D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\dist'
REMOTE_DIST = '/var/www/html/mychurch/dist'

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
        
        # Create directory structure if it doesn't exist
        print("📁 Ensuring directory structure exists...")
        stdin, stdout, stderr = ssh.exec_command(f'mkdir -p /var/www/html/mychurch')
        stdout.read()
        
        # Backup old dist if exists
        print("💾 Backing up old dist folder...")
        stdin, stdout, stderr = ssh.exec_command(f'[ -d {REMOTE_DIST} ] && mv {REMOTE_DIST} {REMOTE_DIST}.backup.$(date +%Y%m%d_%H%M%S) || echo "No existing dist to backup"')
        print(stdout.read().decode())
        
        # Upload new dist
        print("📤 Uploading new dist folder...")
        sftp = ssh.open_sftp()
        upload_directory(sftp, LOCAL_DIST, REMOTE_DIST)
        sftp.close()
        
        # Restart backend (optional, but good practice)
        print("🔄 Restarting backend...")
        stdin, stdout, stderr = ssh.exec_command('cd /var/www/html/mychurch/backend && pm2 restart mychurch-backend')
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
