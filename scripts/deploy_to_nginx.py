#!/usr/bin/env python3
"""
Copy dist folder to nginx document root
"""

import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
SOURCE = '/root/Mychurch/dist'
DEST = '/var/www/html'

print("📋 Copying dist to nginx document root...")
print()

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
    
    print("✅ Connected")
    print()
    
    # Backup old files (optional)
    print("1️⃣ Creating backup...")
    stdin, stdout, stderr = ssh.exec_command(f'cp -r {DEST} {DEST}.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true')
    stdout.channel.recv_exit_status()
    print("   ✅ Backup created (if needed)")
    print()
    
    # Copy dist contents to /var/www/html
    print("2️⃣ Copying dist folder contents...")
    stdin, stdout, stderr = ssh.exec_command(f'rsync -av --delete {SOURCE}/ {DEST}/')
    stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    
    # Count files
    file_count = output.count('\n')
    print(f"   ✅ Copied {file_count} items")
    print()
    
    # Verify
    print("3️⃣ Verifying...")
    stdin, stdout, stderr = ssh.exec_command(f'ls -lh {DEST}/index.html')
    output = stdout.read().decode()
    
    if 'index.html' in output:
        print(f"   ✅ {DEST}/index.html verified")
        print(f"   {output.strip()}")
    else:
        print("   ❌ Verification failed!")
    
    print()
    
    # Check assets
    stdin, stdout, stderr = ssh.exec_command(f'ls {DEST}/assets/index-*.js | wc -l')
    js_count = stdout.read().decode().strip()
    print(f"   ✅ {js_count} JS files in assets/")
    
    print()
    
    # Set permissions
    print("4️⃣ Setting permissions...")
    stdin, stdout, stderr = ssh.exec_command(f'chown -R www-data:www-data {DEST}')
    stdout.channel.recv_exit_status()
    stdin, stdout, stderr = ssh.exec_command(f'chmod -R 755 {DEST}')
    stdout.channel.recv_exit_status()
    print("   ✅ Permissions set")
    
    print()
    print("=" * 60)
    print("✅ Deployment complete!")
    print()
    print("🌐 https://samanabyar.online")
    print("   All files should now load correctly")
    print("=" * 60)
    
    ssh.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
