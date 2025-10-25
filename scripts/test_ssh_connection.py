#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test SSH Connection
"""

import paramiko

SERVER_HOST = "samanabyar.online"
SERVER_PORT = 22
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

print(f"🔗 Testing connection to {SERVER_HOST}...")
print(f"   User: {SERVER_USER}")
print(f"   Port: {SERVER_PORT}")
print()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(
        SERVER_HOST, 
        port=SERVER_PORT, 
        username=SERVER_USER, 
        password=SERVER_PASSWORD,
        timeout=10,
        allow_agent=False,
        look_for_keys=False
    )
    print("✅ اتصال موفقیت‌آمیز بود!")
    print()
    
    # اجرای یک دستور ساده
    stdin, stdout, stderr = ssh.exec_command('pwd')
    output = stdout.read().decode('utf-8').strip()
    print(f"📂 Current directory on server: {output}")
    
    # بررسی وجود پوشه
    stdin, stdout, stderr = ssh.exec_command('ls -la /var/www/html/')
    output = stdout.read().decode('utf-8')
    print(f"\n📁 Contents of /var/www/html/:")
    print(output)
    
    ssh.close()
    
except paramiko.AuthenticationException:
    print("❌ خطا: احراز هویت ناموفق بود!")
    print("💡 لطفاً رمز عبور را بررسی کنید")
except paramiko.SSHException as e:
    print(f"❌ خطای SSH: {e}")
except Exception as e:
    print(f"❌ خطا: {e}")
