#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

ssh.connect("samanabyar.online", 22, "root", "jIVeuzsrkoWPkhUY", timeout=10)

print("🔍 بررسی تنظیمات nginx...\n")

commands = [
    "ls -la /etc/nginx/sites-enabled/",
    "cat /etc/nginx/sites-available/iranjesusdc.conf",
    "cat /etc/nginx/sites-available/mychurch.conf",
]

for cmd in commands:
    print(f"📝 {cmd}")
    print("="*60)
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode('utf-8'))
    error = stderr.read().decode('utf-8')
    if error:
        print(f"❌ {error}")
    print()

ssh.close()
