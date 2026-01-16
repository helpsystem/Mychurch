#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Upload Audio Files to Server
=============================
آپلود فایل‌های صوتی به سرور (بدون git)
"""

import os
import sys
import paramiko
from pathlib import Path

SERVER_HOST = "samanabyar.online"
SERVER_PORT = 22
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

# مسیر فایل‌های صوتی لوکال
LOCAL_AUDIO = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "frontend", "public", "worship", "audio", "kalameh"
)

# مسیر روی سرور
REMOTE_AUDIO = "/var/www/html/worship/audio/kalameh"


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
            print(f"📁 Created: {remote_path}")
        except:
            pass


def main():
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║         🎵 Upload Audio Files to Server                        ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    
    if not os.path.exists(LOCAL_AUDIO):
        print(f"❌ خطا: پوشه صوتی یافت نشد: {LOCAL_AUDIO}")
        return False
    
    # شمارش فایل‌ها
    files = [f for f in os.listdir(LOCAL_AUDIO) if f.endswith('.mp3')]
    total_size = sum(os.path.getsize(os.path.join(LOCAL_AUDIO, f)) for f in files)
    total_size_gb = total_size / (1024 * 1024 * 1024)
    
    print(f"📂 مسیر لوکال: {LOCAL_AUDIO}")
    print(f"📁 تعداد فایل: {len(files)}")
    print(f"💾 حجم کل: {total_size_gb:.2f} GB")
    print(f"🌐 سرور مقصد: {SERVER_HOST}:{REMOTE_AUDIO}")
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
            timeout=30
        )
        print("✅ اتصال برقرار شد")
        
        sftp = ssh.open_sftp()
        print("✅ اتصال SFTP برقرار شد")
        print()
        
        # ایجاد پوشه مقصد
        ensure_remote_directory(sftp, REMOTE_AUDIO)
        
        print("📤 در حال آپلود فایل‌ها...")
        print()
        
        uploaded = 0
        skipped = 0
        errors = 0
        
        for i, filename in enumerate(files, 1):
            local_path = os.path.join(LOCAL_AUDIO, filename)
            remote_path = f"{REMOTE_AUDIO}/{filename}"
            
            try:
                # چک کردن وجود فایل روی سرور
                try:
                    remote_stat = sftp.stat(remote_path)
                    local_size = os.path.getsize(local_path)
                    if remote_stat.st_size == local_size:
                        skipped += 1
                        continue  # فایل موجود است
                except FileNotFoundError:
                    pass  # فایل موجود نیست، آپلود کن
                
                # آپلود فایل
                size_mb = os.path.getsize(local_path) / (1024 * 1024)
                print(f"   [{i}/{len(files)}] {filename} ({size_mb:.1f} MB)...", end=" ", flush=True)
                sftp.put(local_path, remote_path)
                print("✅")
                uploaded += 1
                
            except Exception as e:
                print(f"❌ {e}")
                errors += 1
        
        print()
        print("════════════════════════════════════════════════════════════════")
        print(f"✅ آپلود تمام شد!")
        print(f"   📤 آپلود شده: {uploaded}")
        print(f"   ⏭️  Skip شده: {skipped}")
        print(f"   ❌ خطا: {errors}")
        print()
        print(f"🌐 تست: https://{SERVER_HOST}/worship/audio/kalameh/arami_dlhaii.mp3")
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
