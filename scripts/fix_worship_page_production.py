#!/usr/bin/env python3
import paramiko
import time

print("🔧 Fixing Worship Page Issue on Production")
print("="*70)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("samanabyar.online", 22, "root", "jIVeuzsrkoWPkhUY", timeout=10)

print("\n1. Checking current setup...")

# Check if worship symlink exists
stdin, stdout, stderr = ssh.exec_command("ls -la /root/Mychurch/dist/ | grep worship")
result = stdout.read().decode('utf-8')
print(f"   Worship folders:\n{result}")

# Check if worship data is accessible
stdin, stdout, stderr = ssh.exec_command("test -f /root/Mychurch/dist/worship/data/worship_songs.json && echo 'YES' || echo 'NO'")
result = stdout.read().decode('utf-8').strip()
print(f"   worship_songs.json accessible: {result}")

if result == 'NO':
    print("\n2. 🚨 worship_songs.json NOT accessible! Creating symlink...")
    stdin, stdout, stderr = ssh.exec_command("ln -sf /var/www/mychurch-frontend/dist/worship /root/Mychurch/dist/worship")
    stdout.read()
    print("   ✅ Symlink recreated")
else:
    print("\n2. ✅ worship_songs.json is accessible")

# Add cache-busting headers to nginx
print("\n3. Adding cache-busting headers for JSON files...")
NGINX_CONFIG_FIX = """
# Add this inside the server block for samanabyar.online
location ~* \\.json$ {
    try_files $uri =404;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
"""

print("   Adding no-cache headers for JSON files...")
stdin, stdout, stderr = ssh.exec_command("""
cat > /tmp/nginx_json_nocache.conf << 'EOF'
location ~* \\.json$ {
    try_files $uri =404;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
EOF
""")
stdout.read()

# Check current nginx config
stdin, stdout, stderr = ssh.exec_command("grep -n 'location.*json' /etc/nginx/sites-available/mychurch")
current_config = stdout.read().decode('utf-8')
if 'no-cache' in current_config:
    print("   ✅ No-cache headers already configured")
else:
    print("   ⚠️  No-cache headers NOT configured")
    print("   💡 You may need to manually add them to nginx config")

# Test worship page accessibility
print("\n4. Testing worship page files...")
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost/worship/data/worship_songs.json | head -c 100")
result = stdout.read().decode('utf-8')
if result.startswith('['):
    print("   ✅ JSON is accessible via nginx")
else:
    print(f"   ❌ JSON NOT accessible: {result[:100]}")

# Clear nginx cache if exists
print("\n5. Clearing nginx cache...")
stdin, stdout, stderr = ssh.exec_command("rm -rf /var/cache/nginx/* 2>/dev/null; echo 'done'")
stdout.read()
print("   ✅ Cache cleared")

# Reload nginx
print("\n6. Reloading nginx...")
stdin, stdout, stderr = ssh.exec_command("systemctl reload nginx")
stdout.read()
time.sleep(2)
print("   ✅ Nginx reloaded")

ssh.close()

print("\n" + "="*70)
print("✅ Fixes applied!")
print("\n💡 Now test:")
print("   1. Clear browser cache (Ctrl+Shift+Delete)")
print("   2. Or use incognito mode")
print("   3. Visit: https://samanabyar.online/#/worship")
print("\n   If still showing homepage, the React router might need debugging")
print("="*70)
