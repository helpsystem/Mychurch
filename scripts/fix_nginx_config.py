#!/usr/bin/env python3
import paramiko

FIXED_CONFIG = """# Frontend
server {
    listen 80;
    server_name mychurch.samanabyar.online;

    root /var/www/mychurch-frontend/dist;
    index index.html;

    # فایل‌های استاتیک (JSON, PPTX, etc) رو مستقیم serve کن
    location ~* \.(json|pptx|pdf|txt|mp3|mp4|jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|eot)$ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=31536000";
    }

    # برای بقیه درخواست‌ها (روت‌های React) به index.html برگردون
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API requests رو به backend بفرست
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect www -> non-www
server {
    listen 80;
    server_name www.mychurch.samanabyar.online;
    return 301 http://mychurch.samanabyar.online$request_uri;
}
"""

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("samanabyar.online", 22, "root", "jIVeuzsrkoWPkhUY", timeout=10)

print("📝 Backing up current config...")
stdin, stdout, stderr = ssh.exec_command("cp /etc/nginx/sites-available/mychurch.conf /etc/nginx/sites-available/mychurch.conf.backup")
stdout.read()

print("✅ Backup created")

print("\n📝 Writing new config...")
sftp = ssh.open_sftp()
with sftp.file('/etc/nginx/sites-available/mychurch.conf', 'w') as f:
    f.write(FIXED_CONFIG)
sftp.close()

print("✅ Config written")

print("\n🔍 Testing nginx config...")
stdin, stdout, stderr = ssh.exec_command("nginx -t")
test_output = stdout.read().decode('utf-8') + stderr.read().decode('utf-8')
print(test_output)

if "syntax is ok" in test_output and "test is successful" in test_output:
    print("\n✅ Config is valid")
    print("\n🔄 Reloading nginx...")
    stdin, stdout, stderr = ssh.exec_command("systemctl reload nginx")
    stdout.read()
    print("✅ Nginx reloaded")
    print("\n🎉 Done! Test: http://mychurch.samanabyar.online/worship/data/worship_songs.json")
else:
    print("\n❌ Config has errors. Restoring backup...")
    stdin, stdout, stderr = ssh.exec_command("cp /etc/nginx/sites-available/mychurch.conf.backup /etc/nginx/sites-available/mychurch.conf")
    stdout.read()
    print("✅ Backup restored")

ssh.close()
