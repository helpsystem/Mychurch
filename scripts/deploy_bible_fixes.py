#!/usr/bin/env python3
"""
Deploy Bible System Fixes
=================================
Deploys only the modified files for Bible system fixes:
- backend/routes/bible-local.js
- backend/dev-server.js  
- frontend/src/pages/BibleUnifiedApp.tsx

Then rebuilds frontend and restarts services.
"""

import paramiko
import os
from pathlib import Path

# Server configuration
SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
SERVER_BASE = '/root/Mychurch'

# Files to upload (relative to project root)
FILES_TO_UPLOAD = [
    ('backend/routes/bible-local.js', f'{SERVER_BASE}/backend/routes/bible-local.js'),
    ('backend/dev-server.js', f'{SERVER_BASE}/backend/dev-server.js'),
    ('frontend/src/pages/BibleUnifiedApp.tsx', f'{SERVER_BASE}/frontend/src/pages/BibleUnifiedApp.tsx'),
]

def deploy_bible_fixes():
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║         🚀 Deploy Bible System Fixes                         ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    
    # Get project root
    root_dir = Path(__file__).parent.parent
    
    print(f"📂 Project root: {root_dir}")
    print(f"🌐 Server: {SERVER}")
    print(f"📁 Server path: {SERVER_BASE}")
    print()
    
    try:
        # Connect to server
        print("🔗 اتصال به سرور...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
        print("✅ اتصال SSH برقرار شد")
        
        # Create SFTP client
        sftp = ssh.open_sftp()
        print("✅ اتصال SFTP برقرار شد")
        print()
        
        # Upload files
        print("📤 آپلود فایل‌های تغییر یافته...")
        print()
        
        for local_path, remote_path in FILES_TO_UPLOAD:
            local_file = root_dir / local_path
            
            if not local_file.exists():
                print(f"   ⚠️  فایل پیدا نشد: {local_path}")
                continue
                
            print(f"   📄 {local_path}")
            sftp.put(str(local_file), remote_path)
            size_kb = local_file.stat().st_size / 1024
            print(f"      ✅ Uploaded ({size_kb:.2f} KB)")
        
        print()
        
        # Pull latest code from GitHub
        print("🔄 Pull کردن آخرین تغییرات از GitHub...")
        stdin, stdout, stderr = ssh.exec_command(f'cd {SERVER_BASE} && git pull origin main')
        output = stdout.read().decode()
        error = stderr.read().decode()
        
        if 'Already up to date' in output or 'Updating' in output or 'Fast-forward' in output:
            print("✅ Git pull موفق")
            print(f"   {output.strip()}")
        else:
            print(f"   Output: {output}")
            if error:
                print(f"   Error: {error}")
        
        print()
        
        # Rebuild frontend
        print("🏗️  Build کردن Frontend...")
        stdin, stdout, stderr = ssh.exec_command(f'cd {SERVER_BASE} && npm run build')
        stdout.channel.recv_exit_status()  # Wait for completion
        print("✅ Frontend built")
        
        print()
        
        # Restart backend with PM2
        print("🔄 Restart کردن Backend...")
        stdin, stdout, stderr = ssh.exec_command('pm2 restart backend')
        pm2_output = stdout.read().decode()
        
        if 'online' in pm2_output.lower() or 'restarted' in pm2_output.lower():
            print("✅ Backend restart شد")
        else:
            print(f"   PM2: {pm2_output}")
        
        print()
        print("════════════════════════════════════════════════════════════════")
        print("✅ Bible System Fixes با موفقیت deploy شد!")
        print()
        print("📝 Changes:")
        print("   • Audio URLs → /bible_data/audio/")
        print("   • Mobile mode selector added (4 modes)")
        print("   • dev-server.js routes fixed")
        print()
        print("🌐 Live Site: https://samanabyar.online/#/bible")
        print("════════════════════════════════════════════════════════════════")
        
        sftp.close()
        ssh.close()
        return True
        
    except Exception as e:
        print(f"❌ خطا: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    deploy_bible_fixes()
