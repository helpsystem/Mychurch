#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sync Worship Files to Server Dist Folder
==========================================

این اسکریپت فایل‌های سرود را به پوشه dist روی سرور کپی می‌کند
"""

import paramiko
import os

SERVER_HOST = "samanabyar.online"
SERVER_PORT = 22
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

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
    print()
    
    # بررسی مسیر dist
    print("📂 در حال بررسی مسیرهای سرور...")
    stdin, stdout, stderr = ssh.exec_command('find /var/www/html -name "dist" -type d')
    dist_paths = stdout.read().decode('utf-8').strip()
    
    if dist_paths:
        print(f"📁 پوشه‌های dist یافت شد:")
        print(dist_paths)
    else:
        print("⚠️  پوشه dist یافت نشد")
    
    print()
    
    # کپی فایل‌ها از public به dist
    commands = [
        "ls -la /var/www/html/",
        "ls -la /var/www/html/public/",
        "ls -la /var/www/html/public/worship/",
    ]
    
    for cmd in commands:
        print(f"🔍 {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        if output:
            print(output)
        if error:
            print(f"❌ Error: {error}")
        print()
    
    ssh.close()
    print("✅ تمام")
    
except Exception as e:
    print(f"❌ خطا: {e}")
