#!/usr/bin/env python3
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("samanabyar.online", 22, "root", "jIVeuzsrkoWPkhUY", timeout=10)

print("Check for samanabyar.online config:\n")

# پیدا کردن config برای samanabyar.online
stdin, stdout, stderr = ssh.exec_command("grep -r 'samanabyar.online' /etc/nginx/sites-enabled/ | grep -v mychurch | grep -v iranjesusdc | grep -v coder")
result = stdout.read().decode('utf-8')

if result:
    print("Found:")
    print(result)
else:
    print("No specific config for samanabyar.online root domain")
    print("\nLet's check default:")
    stdin, stdout, stderr = ssh.exec_command("ls -la /etc/nginx/sites-enabled/")
    print(stdout.read().decode('utf-8'))

ssh.close()
