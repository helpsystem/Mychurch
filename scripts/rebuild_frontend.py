#!/usr/bin/env python3
"""
Rebuild Frontend on Production Server
This will take 15-20 minutes to complete
"""

import paramiko
import time

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
PROJECT_PATH = '/root/Mychurch'

print("╔════════════════════════════════════════════════════════════════╗")
print("║         🏗️  Rebuild Frontend on Production                   ║")
print("╚════════════════════════════════════════════════════════════════╝")
print()
print("⏱️  این عملیات 15-20 دقیقه طول می‌کشد...")
print()

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("🔗 اتصال به سرور...")
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
    print("✅ متصل شد")
    print()
    
    # Start the build process
    print("🏗️  شروع Build...")
    print("   (این کار ممکن است تا 20 دقیقه طول بکشد)")
    print()
    
    # Run npm run build and wait
    stdin, stdout, stderr = ssh.exec_command(
        f'cd {PROJECT_PATH} && npm run build',
        get_pty=True
    )
    
    # Show real-time output
    print("📤 خروجی Build:")
    print("─" * 60)
    
    start_time = time.time()
    for line in iter(stdout.readline, ""):
        if line:
            print(f"   {line.strip()}")
        # Check if we've been running for more than 25 minutes
        if time.time() - start_time > 1500:  # 25 min timeout
            print()
            print("⚠️  Build بیش از 25 دقیقه طول کشید - ممکن است مشکلی وجود داشته باشد")
            break
    
    print("─" * 60)
    print()
    
    # Wait for completion
    exit_status = stdout.channel.recv_exit_status()
    
    if exit_status == 0:
        elapsed = int(time.time() - start_time)
        print(f"✅ Build با موفقیت انجام شد! ({elapsed//60}m {elapsed%60}s)")
        print()
        print("════════════════════════════════════════════════════════════════")
        print("✅ Frontend آماده است!")
        print()
        print("🌐 https://samanabyar.online/#/bible")
        print("   • Mobile mode selector حالا قابل مشاهده است")
        print("   • Audio URLs به‌روز شده‌اند")
        print("   • تمام تغییرات اعمال شد")
        print("════════════════════════════════════════════════════════════════")
    else:
        print(f"❌ Build با خطا مواجه شد (exit code: {exit_status})")
        error_output = stderr.read().decode()
        if error_output:
            print("خطا:")
            print(error_output)
    
    ssh.close()
    
except KeyboardInterrupt:
    print()
    print("⚠️  عملیات لغو شد توسط کاربر")
    ssh.close()
    
except Exception as e:
    print(f"❌ خطا: {e}")
    import traceback
    traceback.print_exc()
