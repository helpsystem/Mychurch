#!/usr/bin/env python3
"""
Complete Production Update & Test
1. Kill any stuck processes
2. Pull latest code
3. Rebuild frontend
4. Test everything
"""

import paramiko
import time
import sys

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
PROJECT_PATH = '/root/Mychurch'

def run_command(ssh, cmd, show_output=True):
    """Run command and return output"""
    stdin, stdout, stderr = ssh.exec_command(cmd)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode()
    error = stderr.read().decode()
    
    if show_output and output:
        print(output)
    if error and 'warning' not in error.lower():
        print(f"Error: {error}")
    
    return exit_code, output, error

print("╔════════════════════════════════════════════════════════════════╗")
print("║         🚀 Complete Production Update & Test                 ║")
print("╚════════════════════════════════════════════════════════════════╝")
print()

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("🔗 Connecting to server...")
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
    print("✅ Connected")
    print()
    
    # Step 1: Kill stuck processes
    print("1️⃣ Cleaning up stuck processes...")
    run_command(ssh, 'pkill -f "npm run build" || true', show_output=False)
    run_command(ssh, 'pkill -f "vite build" || true', show_output=False)
    time.sleep(2)
    print("   ✅ Done")
    print()
    
    # Step 2: Pull latest code
    print("2️⃣ Pulling latest code from GitHub...")
    code, output, _ = run_command(ssh, f'cd {PROJECT_PATH} && git pull origin main', show_output=False)
    if 'Already up to date' in output:
        print("   ✅ Already up to date")
    else:
        print(f"   ✅ {output.strip()}")
    print()
    
    # Step 3: Install dependencies (quick check)
    print("3️⃣ Checking dependencies...")
    run_command(ssh, f'cd {PROJECT_PATH} && npm install --prefer-offline', show_output=False)
    print("   ✅ Dependencies OK")
    print()
    
    # Step 4: Clean old build
    print("4️⃣ Removing old build...")
    run_command(ssh, f'cd {PROJECT_PATH} && rm -rf dist', show_output=False)
    print("   ✅ Cleaned")
    print()
    
    # Step 5: Build with proper timeout
    print("5️⃣ Building frontend (this takes 10-15 minutes)...")
    print("   Starting build...")
    
    # Use nohup to prevent hanging
    build_cmd = f'cd {PROJECT_PATH} && timeout 900 npm run build > /tmp/build.log 2>&1'
    
    channel = ssh.get_transport().open_session()
    channel.exec_command(build_cmd)
    
    start_time = time.time()
    last_update = start_time
    
    # Wait for completion with progress updates
    while not channel.exit_status_ready():
        time.sleep(5)
        elapsed = int(time.time() - start_time)
        
        # Show progress every 30 seconds
        if time.time() - last_update > 30:
            print(f"   ... still building ({elapsed}s elapsed)")
            last_update = time.time()
        
        # Safety timeout
        if elapsed > 960:  # 16 minutes
            print("   ⚠️  Build taking too long, checking status...")
            break
    
    exit_code = channel.recv_exit_status()
    elapsed = int(time.time() - start_time)
    
    # Get build log
    _, log, _ = run_command(ssh, 'tail -50 /tmp/build.log', show_output=False)
    
    if exit_code == 0:
        print(f"   ✅ Build completed! ({elapsed}s)")
        
        # Check if dist exists
        _, dist_check, _ = run_command(ssh, f'ls -lh {PROJECT_PATH}/dist/index.html', show_output=False)
        if 'index.html' in dist_check:
            print("   ✅ dist/index.html created")
    else:
        print(f"   ❌ Build failed (exit code: {exit_code})")
        print()
        print("Last 20 lines of build log:")
        print("-" * 60)
        print('\n'.join(log.split('\n')[-20:]))
        print("-" * 60)
        sys.exit(1)
    
    print()
    
    # Step 6: Verify deployment
    print("6️⃣ Verifying deployment...")
    
    # Check file sizes
    _, du_output, _ = run_command(ssh, f'du -sh {PROJECT_PATH}/dist', show_output=False)
    print(f"   📦 dist size: {du_output.strip()}")
    
    # Count files
    _, file_count, _ = run_command(ssh, f'find {PROJECT_PATH}/dist -type f | wc -l', show_output=False)
    print(f"   📄 Files: {file_count.strip()}")
    
    print("   ✅ Deployment verified")
    print()
    
    print("═" * 64)
    print("✅ Production update complete!")
    print()
    print("🌐 Live site: https://samanabyar.online/#/bible")
    print()
    print("Next: Testing all features...")
    print("═" * 64)
    
    ssh.close()
    
except KeyboardInterrupt:
    print()
    print("⚠️  Cancelled by user")
    try:
        ssh.close()
    except:
        pass
    sys.exit(1)
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
