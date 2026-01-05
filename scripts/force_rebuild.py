#!/usr/bin/env python3
"""
Direct SSH Build - Kill any stuck processes and rebuild
"""

import paramiko
import time

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
PROJECT_PATH = '/root/Mychurch'

print("🔧 Direct SSH Build Manager")
print("=" * 60)
print()

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("🔗 Connecting...")
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
    print("✅ Connected")
    print()
    
    # Step 1: Check for stuck npm processes
    print("1️⃣ Checking for stuck build processes...")
    stdin, stdout, stderr = ssh.exec_command('ps aux | grep "npm run build" | grep -v grep')
    stuck_processes = stdout.read().decode().strip()
    
    if stuck_processes:
        print("   ⚠️  Found stuck processes:")
        print(f"   {stuck_processes}")
        print()
        
        # Kill them
        print("   🔪 Killing stuck processes...")
        ssh.exec_command('pkill -f "npm run build"')
        ssh.exec_command('pkill -f "vite build"')
        time.sleep(2)
        print("   ✅ Processes killed")
    else:
        print("   ✅ No stuck processes")
    print()
    
    # Step 2: Clean build artifacts
    print("2️⃣ Cleaning old build artifacts...")
    stdin, stdout, stderr = ssh.exec_command(f'cd {PROJECT_PATH} && rm -rf dist')
    stdout.channel.recv_exit_status()
    print("   ✅ Old dist folder removed")
    print()
    
    # Step 3: Start fresh build with timeout
    print("3️⃣ Starting fresh build...")
    print("   (Will display live output)")
    print()
    
    # Use screen to run build in background with timeout
    build_cmd = f'''
    cd {PROJECT_PATH} && 
    timeout 600 npm run build 2>&1
    '''
    
    channel = ssh.get_transport().open_session()
    channel.exec_command(build_cmd)
    
    print("📤 Build Output:")
    print("-" * 60)
    
    start_time = time.time()
    output_buffer = []
    
    while True:
        if channel.recv_ready():
            data = channel.recv(1024).decode('utf-8')
            print(data, end='', flush=True)
            output_buffer.append(data)
        
        if channel.exit_status_ready():
            break
            
        # Safety timeout
        if time.time() - start_time > 660:  # 11 minutes
            print()
            print("⚠️  Build timeout - cancelling...")
            channel.close()
            break
        
        time.sleep(0.1)
    
    print()
    print("-" * 60)
    
    exit_code = channel.recv_exit_status()
    elapsed = int(time.time() - start_time)
    
    print()
    if exit_code == 0:
        print(f"✅ Build completed successfully! ({elapsed}s)")
        print()
        print("=" * 60)
        print("🎉 Frontend is ready!")
        print("🌐 https://samanabyar.online/#/bible")
        print("=" * 60)
    elif exit_code == 124:  # timeout exit code
        print(f"⏱️  Build timed out after {elapsed}s")
        print("   This might indicate a problem with the build process.")
    else:
        print(f"❌ Build failed (exit code: {exit_code})")
        
        # Show last few lines of output
        last_lines = ''.join(output_buffer[-500:])
        if last_lines:
            print()
            print("Last output:")
            print(last_lines)
    
    ssh.close()
    
except KeyboardInterrupt:
    print()
    print("⚠️  Cancelled by user")
    try:
        ssh.close()
    except:
        pass
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
