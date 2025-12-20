#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Deploy Full Site to Server
===========================

این اسکریپت کل سایت (dist folder) را به سرور آپلود می‌کند
"""

import os
import sys
import paramiko
from pathlib import Path

SERVER_HOST = "samanabyar.online"
SERVER_PORT = 22
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

# مسیر dist لوکال
LOCAL_DIST = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "dist"
)

# مسیر روی سرور (مسیر اصلی سایت)
REMOTE_BASE = "/var/www/html"

def ensure_remote_directory(sftp, remote_path):
    """ایجاد پوشه به صورت بازگشتی"""
    try:
        sftp.stat(remote_path)
    except FileNotFoundError:
        parent = os.path.dirname(remote_path)
        if parent and parent != '/':
            ensure_remote_directory(sftp, parent)
        try:
            sftp.mkdir(remote_path)
        except:
            pass

def upload_directory(sftp, local_dir, remote_dir, base_local_dir):
    """آپلود یک پوشه به صورت بازگشتی"""
    
    # ایجاد پوشه روی سرور
    ensure_remote_directory(sftp, remote_dir)
    
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = os.path.join(remote_dir, item).replace('\\', '/')
        
        if os.path.isfile(local_path):
            # آپلود فایل
            try:
                sftp.put(local_path, remote_path)
                size_mb = os.path.getsize(local_path) / (1024 * 1024)
                rel_path = os.path.relpath(local_path, base_local_dir)
                print(f"   ✅ {rel_path} ({size_mb:.2f} MB)")
            except Exception as e:
                print(f"   ❌ خطا در آپلود {item}: {e}")
        
        elif os.path.isdir(local_path):
            # آپلود پوشه به صورت بازگشتی
            upload_directory(sftp, local_path, remote_path, base_local_dir)

def main():
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║         🚀 Deploy سایت کامل به سرور                          ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    
    if not os.path.exists(LOCAL_DIST):
        print(f"❌ خطا: پوشه dist یافت نشد: {LOCAL_DIST}")
        print(f"💡 ابتدا سایت را build کنید: npm run build")
        return False
    
    print(f"📂 مسیر لوکال: {LOCAL_DIST}")
    print(f"🌐 سرور مقصد: {SERVER_HOST}")
    print(f"📁 مسیر روی سرور: {REMOTE_BASE}")
    print()
    
    # confirm = input("⚠️  آیا می‌خواهید کل سایت را آپلود کنید؟ (y/n): ").lower().strip()
    # 
    # if confirm != 'y':
    #     print("❌ عملیات لغو شد.")
    #     return False
    
    print("🚀 Auto-confirming deployment...")
    
    print()
    print("🔗 اتصال به سرور...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(
            SERVER_HOST,
            port=SERVER_PORT,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=10
        )
        print("✅ اتصال برقرار شد")
        
        sftp = ssh.open_sftp()
        print("✅ اتصال SFTP برقرار شد")
        print()
        
        print("📤 در حال آپلود فایل‌ها...")
        print()
        
        upload_directory(sftp, LOCAL_DIST, REMOTE_BASE, LOCAL_DIST)
        
        print()
        print("════════════════════════════════════════════════════════════════")
        print("✅ آپلود با موفقیت انجام شد!")
        print()
        print(f"🌐 سایت: https://{SERVER_HOST}")
        print(f"📝 JSON: https://{SERVER_HOST}/worship/data/worship_songs.json")
        print("════════════════════════════════════════════════════════════════")
        
        sftp.close()
        ssh.close()
        return True
        
    except Exception as e:
        print(f"❌ خطا: {e}")
        return False

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  عملیات لغو شد")
        sys.exit(1)
