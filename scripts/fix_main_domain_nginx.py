#!/usr/bin/env python3
import paramiko

FIXED_CONFIG = """server {
    server_name samanabyar.online www.samanabyar.online;
    root /root/Mychurch/dist;
    index index.html;

    # فایل‌های استاتیک (JSON, PPTX, etc) رو مستقیم serve کن
    location ~* \\.(json|pptx|pdf|txt|mp3|mp4|jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|eot)$ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=31536000";
    }

    # برای بقیه درخواست‌ها (React routes) به index.html برگردون
    location / {
        try_files $uri $uri/ /index.html;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/samanabyar.online/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/samanabyar.online/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.samanabyar.online) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = samanabyar.online) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name samanabyar.online www.samanabyar.online;
    return 404; # managed by Certbot
}
"""

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("samanabyar.online", 22, "root", "jIVeuzsrkoWPkhUY", timeout=10)

print("Updating nginx config for samanabyar.online...")
print("="*70)

# Backup
print("\n1. Creating backup...")
stdin, stdout, stderr = ssh.exec_command("cp /etc/nginx/sites-available/mychurch /etc/nginx/sites-available/mychurch.backup-$(date +%Y%m%d)")
stdout.read()
print("   ✅ Backup created")

# Write new config
print("\n2. Writing new config...")
sftp = ssh.open_sftp()
with sftp.file('/etc/nginx/sites-available/mychurch', 'w') as f:
    f.write(FIXED_CONFIG)
sftp.close()
print("   ✅ Config written")

# Test nginx
print("\n3. Testing nginx config...")
stdin, stdout, stderr = ssh.exec_command("nginx -t")
test_output = stdout.read().decode('utf-8') + stderr.read().decode('utf-8')
print(test_output)

if "syntax is ok" in test_output and "test is successful" in test_output:
    print("   ✅ Config is valid")
    
    print("\n4. Reloading nginx...")
    stdin, stdout, stderr = ssh.exec_command("systemctl reload nginx")
    stdout.read()
    print("   ✅ Nginx reloaded")
    
    print("\n" + "="*70)
    print("✅ Done! Test: https://samanabyar.online/worship-songs/data/worship_songs.json")
    print("="*70)
else:
    print("   ❌ Config has errors")
    print("\n5. Restoring backup...")
    stdin, stdout, stderr = ssh.exec_command("cp /etc/nginx/sites-available/mychurch.backup-* /etc/nginx/sites-available/mychurch")
    stdout.read()
    print("   ✅ Backup restored")

ssh.close()
