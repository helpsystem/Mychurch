#!/usr/bin/env python3
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("samanabyar.online", 22, "root", "jIVeuzsrkoWPkhUY", timeout=10)

print("Finding which site handles samanabyar.online:")
print("="*70)

# List all site configs
stdin, stdout, stderr = ssh.exec_command("ls -la /etc/nginx/sites-enabled/")
print(stdout.read().decode('utf-8'))

print("\n" + "="*70)
print("Checking /root/Mychurch symlink:")
print("="*70)

stdin, stdout, stderr = ssh.exec_command("ls -la /var/www/ | grep -i mychurch")
print(stdout.read().decode('utf-8'))

print("\n" + "="*70)
print("Checking if worship-songs folder exists:")
print("="*70)

stdin, stdout, stderr = ssh.exec_command("ls -la /var/www/html/worship-songs/")
result = stdout.read().decode('utf-8')
error = stderr.read().decode('utf-8')

if result:
    print(result)
else:
    print("Folder not found")
    if error:
        print(f"Error: {error}")

print("\n" + "="*70)
print("Where does /root/Mychurch/dist point to?")
print("="*70)

stdin, stdout, stderr = ssh.exec_command("ls -la /root/Mychurch/dist/worship/data/ 2>&1 | head -10")
print(stdout.read().decode('utf-8'))

ssh.close()
