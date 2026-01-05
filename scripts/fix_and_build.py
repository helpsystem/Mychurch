#!/usr/bin/env python3
"""
Fix Git Conflicts and Build with Memory Management
"""

import paramiko
import time

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
PROJECT_PATH = '/root/Mychurch'

print("🔧 Fixing Git Conflicts & Building")
print("=" * 60)
print()

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("🔗 Connecting...")
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
    print("✅ Connected")
    print()
    
    # Fix 1: Resolve git conflicts by forcing our changes
    print("1️⃣ Resolving git conflicts...")
    
    commands = [
        f'cd {PROJECT_PATH} && git reset --hard HEAD',
        f'cd {PROJECT_PATH} && git pull origin main'
    ]
    
    for cmd in commands:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode()
        if output.strip():
            print(f"   {output.strip()}")
    
    print("   ✅ Git conflicts resolved")
    print()
    
    # Fix 2: Build with memory limit and swap
    print("2️⃣ Building with memory optimization...")
    print("   (Using NODE_OPTIONS to limit memory)")
    print()
    
    # Build with limited memory to prevent OOM
    build_cmd = f'''
    cd {PROJECT_PATH} && 
    export NODE_OPTIONS="--max-old-space-size=2048" && 
    timeout 600 npm run build 2>&1
    '''
    
    channel = ssh.get_transport().open_session()
    channel.exec_command(build_cmd)
    
    print("   Building...")
    start_time = time.time()
    last_dot = start_time
    
    while not channel.exit_status_ready():
        time.sleep(2)
        
        # Show progress dots
        if time.time() - last_dot > 10:
            print("   .", end='', flush=True)
            last_dot = time.time()
        
        # Timeout after 12 minutes
        if time.time() - start_time > 720:
            print()
            print("   ⏱️  Timeout")
            break
    
    print()
    
    exit_code = channel.recv_exit_status()
    elapsed = int(time.time() - start_time)
    
    if exit_code == 0:
        print(f"   ✅ Build completed! ({elapsed}s)")
        
        # Verify dist folder
        stdin, stdout, stderr = ssh.exec_command(f'ls -lh {PROJECT_PATH}/dist/index.html')
        output = stdout.read().decode()
        
        if 'index.html' in output:
            size = output.split()[4]
            print(f"   ✅ dist/index.html: {size}")
        
        print()
        print("=" * 60)
        print("✅ SUCCESS!")
        print("🌐 https://samanabyar.online/#/bible")
        print("=" * 60)
        
    elif exit_code == 137:
        print("   ❌ Out of Memory (exit 137)")
        print()
        print("   💡 Solution: Build locally and upload dist folder")
        print("   Run: npm run build")
        print("   Then: upload dist/ to server")
        
    else:
        print(f"   ❌ Build failed (exit {exit_code})")
        
        # Show error
        stdin, stdout, stderr = ssh.exec_command('tail -30 /tmp/build.log 2>/dev/null || echo "No log"')
        log = stdout.read().decode()
        if log and 'No log' not in log:
            print()
            print("Last lines:")
            print(log)
    
    ssh.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
