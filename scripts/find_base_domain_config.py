#!/usr/bin/env python3
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("samanabyar.online", 22, "root", "jIVeuzsrkoWPkhUY", timeout=10)

print("Finding nginx config for samanabyar.online (no subdomain):")
print("="*70)

# Check all configs that might handle the base domain
stdin, stdout, stderr = ssh.exec_command("find /etc/nginx/sites-available -type f -exec grep -l 'server_name.*samanabyar.online' {} \\;")
configs = stdout.read().decode('utf-8').strip().split('\n')

for config_file in configs:
    if config_file:
        print(f"\n📄 File: {config_file}")
        print("-"*70)
        stdin, stdout, stderr = ssh.exec_command(f"cat {config_file}")
        content = stdout.read().decode('utf-8')
        
        # Only show the server block that handles samanabyar.online
        lines = content.split('\n')
        in_block = False
        for line in lines:
            if 'server {' in line:
                in_block = True
            if in_block:
                print(line)
            if in_block and line.strip() == '}':
                in_block = False
                print()

ssh.close()
