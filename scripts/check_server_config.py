#!/usr/bin/env python3
"""
Check server file structure and nginx configuration
"""

import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
PROJECT_PATH = '/root/Mychurch'

print("🔍 Checking Server Configuration...")
print()

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
    
    print("✅ Connected")
    print()
    
    # Check if dist folder exists
    print("1️⃣ Checking dist folder...")
    stdin, stdout, stderr = ssh.exec_command(f'ls -lh {PROJECT_PATH}/dist/index.html')
    output = stdout.read().decode()
    if 'index.html' in output:
        print(f"   ✅ dist/index.html exists")
        print(f"   {output.strip()}")
    else:
        print("   ❌ dist/index.html NOT FOUND!")
    print()
    
    # Check assets folder
    print("2️⃣ Checking assets folder...")
    stdin, stdout, stderr = ssh.exec_command(f'ls {PROJECT_PATH}/dist/assets/index-*.js | head -5')
    output = stdout.read().decode()
    if output:
        print("   ✅ JS files found:")
        for line in output.strip().split('\n')[:5]:
            print(f"      {line}")
    else:
        print("   ❌ No JS files found!")
    print()
    
    # Check nginx config
    print("3️⃣ Checking nginx configuration...")
    stdin, stdout, stderr = ssh.exec_command('cat /etc/nginx/sites-enabled/mychurch 2>/dev/null || cat /etc/nginx/conf.d/mychurch.conf 2>/dev/null || echo "Config not found"')
    config = stdout.read().decode()
    
    if 'Config not found' in config:
        print("   ⚠️  Nginx config not found in standard locations")
        
        # Try to find it
        stdin, stdout, stderr = ssh.exec_command('find /etc/nginx -name "*mychurch*" -o -name "*samanabyar*" 2>/dev/null')
        found = stdout.read().decode()
        if found:
            print(f"   Found configs: {found}")
    else:
        print("   ✅ Nginx config found:")
        # Show relevant parts
        for line in config.split('\n'):
            if 'root' in line.lower() or 'try_files' in line.lower() or 'location' in line:
                print(f"      {line.strip()}")
    
    print()
    
    # Check where nginx is serving from
    print("4️⃣ Checking nginx document root...")
    stdin, stdout, stderr = ssh.exec_command('nginx -T 2>/dev/null | grep -A 5 "server_name.*samanabyar"')
    nginx_test = stdout.read().decode()
    
    if nginx_test:
        print("   Nginx config for samanabyar.online:")
        for line in nginx_test.split('\n')[:15]:
            if line.strip():
                print(f"      {line}")
    
    print()
    print("=" * 60)
    print("Analysis complete. Check output above for issues.")
    print("=" * 60)
    
    ssh.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
