#!/usr/bin/env python3
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("samanabyar.online", 22, "root", "jIVeuzsrkoWPkhUY", timeout=10)

print("Checking nginx config for samanabyar.online:")
print("="*70)

# Find all nginx configs
stdin, stdout, stderr = ssh.exec_command("grep -r 'samanabyar.online' /etc/nginx/sites-enabled/ | grep -v '#'")
configs = stdout.read().decode('utf-8')
print(configs)

print("\n" + "="*70)
print("Checking if there's a default server:")
print("="*70)

stdin, stdout, stderr = ssh.exec_command("grep -A 5 'default_server' /etc/nginx/sites-enabled/*")
default = stdout.read().decode('utf-8')
if default:
    print(default)
else:
    print("No default_server found")

print("\n" + "="*70)
print("Checking document roots:")
print("="*70)

stdin, stdout, stderr = ssh.exec_command("grep -r 'root ' /etc/nginx/sites-enabled/ | grep -v '#'")
roots = stdout.read().decode('utf-8')
print(roots)

ssh.close()
