#!/usr/bin/env python3
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("samanabyar.online", 22, "root", "jIVeuzsrkoWPkhUY", timeout=10)

cmds = [
    "ls -la /var/www/",
    "ls -la /var/www/mychurch-frontend/ 2>&1 | head -20",
]

for cmd in cmds:
    print(f"\n{cmd}")
    print("="*60)
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode('utf-8'))

ssh.close()
