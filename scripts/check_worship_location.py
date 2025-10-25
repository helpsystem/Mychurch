#!/usr/bin/env python3
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("samanabyar.online", 22, "root", "jIVeuzsrkoWPkhUY", timeout=10)

print("Checking worship folder locations...")
print("="*70)

# Check symlink
print("\n1. Symlink in /var/www/html/:")
stdin, stdout, stderr = ssh.exec_command("ls -la /var/www/html/ | grep worship")
result = stdout.read().decode('utf-8')
print(result if result else "   No worship folder found")

# Check dist folder
print("\n2. Contents of /root/Mychurch/dist/:")
stdin, stdout, stderr = ssh.exec_command("ls -la /root/Mychurch/dist/")
result = stdout.read().decode('utf-8')
print(result)

# Check if worship folder exists in dist
print("\n3. Does /root/Mychurch/dist/worship exist?")
stdin, stdout, stderr = ssh.exec_command("test -d /root/Mychurch/dist/worship && echo 'YES' || echo 'NO'")
result = stdout.read().decode('utf-8').strip()
print(f"   {result}")

# Check if worship-songs folder exists in dist
print("\n4. Does /root/Mychurch/dist/worship-songs exist?")
stdin, stdout, stderr = ssh.exec_command("test -d /root/Mychurch/dist/worship-songs && echo 'YES' || echo 'NO'")
result = stdout.read().decode('utf-8').strip()
print(f"   {result}")

# Check actual files
print("\n5. Files in /var/www/mychurch-frontend/dist/worship/data:")
stdin, stdout, stderr = ssh.exec_command("ls -lh /var/www/mychurch-frontend/dist/worship/data/")
result = stdout.read().decode('utf-8')
print(result)

ssh.close()
