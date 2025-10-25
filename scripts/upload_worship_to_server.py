#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Upload Worship Files to Server
===============================

این اسکریپت فایل‌های سرود را به سرور آپلود می‌کند.

نیازمندی‌ها:
    pip install paramiko

استفاده:
    python upload_worship_to_server.py
"""

import os
import sys
from pathlib import Path

try:
    import paramiko
except ImportError:
    print("❌ Error: paramiko is not installed")
    print("📦 Installing paramiko...")
    os.system("pip install paramiko")
    import paramiko

# ═══════════════════════════════════════════════════════════
# 🔧 تنظیمات سرور
# ═══════════════════════════════════════════════════════════

SERVER_HOST = "samanabyar.online"
SERVER_PORT = 22
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"  # اگر از password استفاده می‌کنید، اینجا بنویسید
SERVER_KEY_FILE = None  # مسیر به private key (مثال: ~/.ssh/id_rsa)

# مسیر لوکال (فایل‌های استخراج شده)
LOCAL_BASE = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "public",
    "worship"
)

# مسیر روی سرور
REMOTE_BASE = "/var/www/html/public/worship"

# پوشه‌هایی که باید آپلود شوند
FOLDERS_TO_UPLOAD = ["audio", "pptx", "data", "lyrics"]

# ═══════════════════════════════════════════════════════════
# 🛠️ توابع کمکی
# ═══════════════════════════════════════════════════════════

def create_ssh_client(host, port, user, password=None, key_file=None):
    """ایجاد اتصال SSH"""
    print(f"🔗 اتصال به سرور {host}...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        if key_file:
            # استفاده از SSH key
            key = paramiko.RSAKey.from_private_key_file(key_file)
            ssh.connect(host, port=port, username=user, pkey=key, timeout=10)
            print(f"✅ اتصال با SSH key برقرار شد")
        elif password:
            # استفاده از password
            ssh.connect(host, port=port, username=user, password=password, timeout=10)
            print(f"✅ اتصال با password برقرار شد")
        else:
            print("❌ خطا: نه password و نه SSH key تعریف نشده است!")
            return None
            
        return ssh
    except Exception as e:
        print(f"❌ خطا در اتصال به سرور: {e}")
        return None

def ensure_remote_directory(sftp, remote_path):
    """مطمئن شوید که پوشه روی سرور وجود دارد"""
    try:
        sftp.stat(remote_path)
    except FileNotFoundError:
        # پوشه وجود ندارد، باید بسازیم
        parent = os.path.dirname(remote_path)
        if parent and parent != '/':
            ensure_remote_directory(sftp, parent)
        try:
            sftp.mkdir(remote_path)
            print(f"📁 پوشه ایجاد شد: {remote_path}")
        except Exception as e:
            print(f"⚠️  خطا در ایجاد پوشه {remote_path}: {e}")

def upload_file(sftp, local_file, remote_file):
    """آپلود یک فایل"""
    try:
        # مطمئن شوید پوشه مقصد وجود دارد
        remote_dir = os.path.dirname(remote_file)
        ensure_remote_directory(sftp, remote_dir)
        
        # آپلود فایل
        sftp.put(local_file, remote_file)
        file_size = os.path.getsize(local_file)
        size_mb = file_size / (1024 * 1024)
        print(f"   ✅ {os.path.basename(local_file)} ({size_mb:.2f} MB)")
        return True
    except Exception as e:
        print(f"   ❌ خطا در آپلود {os.path.basename(local_file)}: {e}")
        return False

def upload_folder(sftp, local_folder, remote_folder):
    """آپلود یک پوشه کامل"""
    if not os.path.exists(local_folder):
        print(f"⚠️  پوشه لوکال یافت نشد: {local_folder}")
        return 0, 0
    
    files = [f for f in os.listdir(local_folder) if os.path.isfile(os.path.join(local_folder, f))]
    
    if not files:
        print(f"⚠️  هیچ فایلی در پوشه نیست: {local_folder}")
        return 0, 0
    
    print(f"\n📂 آپلود پوشه: {os.path.basename(local_folder)}")
    print(f"   تعداد فایل‌ها: {len(files)}")
    
    success_count = 0
    fail_count = 0
    
    for file_name in files:
        local_file = os.path.join(local_folder, file_name)
        remote_file = os.path.join(remote_folder, file_name).replace('\\', '/')
        
        if upload_file(sftp, local_file, remote_file):
            success_count += 1
        else:
            fail_count += 1
    
    return success_count, fail_count

# ═══════════════════════════════════════════════════════════
# 🚀 اجرای اصلی
# ═══════════════════════════════════════════════════════════

def main():
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║         📤 آپلود فایل‌های سرود به سرور                       ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    
    # بررسی وجود فایل‌های لوکال
    if not os.path.exists(LOCAL_BASE):
        print(f"❌ خطا: پوشه لوکال یافت نشد: {LOCAL_BASE}")
        print(f"💡 ابتدا اسکریپت استخراج را اجرا کنید: extract_worship_songs.py")
        return False
    
    print(f"📂 مسیر لوکال: {LOCAL_BASE}")
    print(f"🌐 سرور مقصد: {SERVER_HOST}")
    print(f"📁 مسیر روی سرور: {REMOTE_BASE}")
    print()
    
    # درخواست تأیید از کاربر
    print("⚠️  توجه: این عملیات ممکن است چند دقیقه طول بکشد.")
    confirm = input("آیا می‌خواهید ادامه دهید؟ (y/n): ").lower().strip()
    
    if confirm != 'y':
        print("❌ عملیات لغو شد.")
        return False
    
    # ایجاد اتصال SSH
    ssh = create_ssh_client(
        SERVER_HOST, 
        SERVER_PORT, 
        SERVER_USER, 
        SERVER_PASSWORD, 
        SERVER_KEY_FILE
    )
    
    if not ssh:
        return False
    
    try:
        # ایجاد SFTP client
        sftp = ssh.open_sftp()
        print("✅ اتصال SFTP برقرار شد")
        print()
        
        # آپلود هر پوشه
        total_success = 0
        total_fail = 0
        
        for folder_name in FOLDERS_TO_UPLOAD:
            local_folder = os.path.join(LOCAL_BASE, folder_name)
            remote_folder = f"{REMOTE_BASE}/{folder_name}"
            
            success, fail = upload_folder(sftp, local_folder, remote_folder)
            total_success += success
            total_fail += fail
        
        # نتیجه نهایی
        print()
        print("════════════════════════════════════════════════════════════════")
        
        if total_fail == 0:
            print("✅ همه فایل‌ها با موفقیت آپلود شدند!")
        else:
            print(f"⚠️  تعدادی فایل با خطا مواجه شدند")
        
        print()
        print(f"📊 آمار نهایی:")
        print(f"   ✅ موفق: {total_success} فایل")
        print(f"   ❌ ناموفق: {total_fail} فایل")
        print()
        print(f"🌐 آدرس سایت: https://{SERVER_HOST}")
        print(f"📝 فایل JSON: https://{SERVER_HOST}/worship/data/worship_songs.json")
        print()
        print("════════════════════════════════════════════════════════════════")
        
        sftp.close()
        return total_fail == 0
        
    except Exception as e:
        print(f"❌ خطا در آپلود: {e}")
        return False
    finally:
        ssh.close()
        print()
        print("🔌 اتصال به سرور قطع شد")

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  عملیات توسط کاربر لغو شد")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ خطای غیرمنتظره: {e}")
        sys.exit(1)
