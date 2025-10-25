#!/usr/bin/env python3
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("samanabyar.online", 22, "root", "jIVeuzsrkoWPkhUY", timeout=10)

print("Checking nginx error log:")
print("="*60)
stdin, stdout, stderr = ssh.exec_command("tail -50 /var/log/nginx/error.log")
print(stdout.read().decode('utf-8'))

print("\n\nChecking file permissions:")
print("="*60)
stdin, stdout, stderr = ssh.exec_command("ls -la /var/www/mychurch-frontend/dist/worship/data/")
print(stdout.read().decode('utf-8'))

print("\n\nTest direct file read:")
print("="*60)
stdin, stdout, stderr = ssh.exec_command("cat /var/www/mychurch-frontend/dist/worship/data/worship_songs.json | head -5")
print(stdout.read().decode('utf-8'))

ssh.close()
