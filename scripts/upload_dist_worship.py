#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Upload Worship Folder from dist to Server
==========================================
"""

import os
import paramiko

SERVER_HOST = "samanabyar.online"
SERVER_PORT = 22
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

LOCAL_WORSHIP = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\dist\worship"
REMOTE_WORSHIP = "/var/www/mychurch-frontend/dist/worship"

def ensure_remote_directory(sftp, remote_path):
    try:
        sftp.stat(remote_path)
    except FileNotFoundError:
        parent = os.path.dirname(remote_path)
        if parent and parent != '/':
            ensure_remote_directory(sftp, parent)
        try:
            sftp.mkdir(remote_path)
            print(f"📁 ایجاد شد: {remote_path}")
        except:
            pass

def upload_directory(sftp, local_dir, remote_dir):
    ensure_remote_directory(sftp, remote_dir)
    
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = os.path.join(remote_dir, item).replace('\\', '/')
        
        if os.path.isfile(local_path):
            try:
                sftp.put(local_path, remote_path)
                size_mb = os.path.getsize(local_path) / (1024 * 1024)
                print(f"   ✅ {item} ({size_mb:.2f} MB)")
            except Exception as e:
                print(f"   ❌ {item}: {e}")
        elif os.path.isdir(local_path):
            print(f"\n📂 پوشه: {item}")
            upload_directory(sftp, local_path, remote_path)

print("🔗 اتصال به سرور...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(SERVER_HOST, port=SERVER_PORT, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
    print("✅ متصل شد")
    
    sftp = ssh.open_sftp()
    
    print(f"\n📤 آپلود از: {LOCAL_WORSHIP}")
    print(f"📥 به: {REMOTE_WORSHIP}\n")
    
    upload_directory(sftp, LOCAL_WORSHIP, REMOTE_WORSHIP)
    
    print("\n✅ تمام!")
    print(f"🌐 تست: https://{SERVER_HOST}/worship/data/worship_songs.json")
    
    sftp.close()
    ssh.close()
    
except Exception as e:
    print(f"❌ خطا: {e}")
