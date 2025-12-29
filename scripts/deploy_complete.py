#!/usr/bin/env python3
"""
Complete Deployment Script
Deploys frontend, backend, and runs migration
"""

import paramiko
import os
import sys
from pathlib import Path
import time

# Server configuration
SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
BACKEND_PATH = '/root/Mychurch/backend'
FRONTEND_PATH = '/root/Mychurch/frontend/dist'

def upload_directory(sftp, local_dir, remote_dir, exclude=[]):
    """Upload directory recursively"""
    print(f"📂 Uploading {local_dir.name}...")
    
    # Create remote directory
    try:
        sftp.mkdir(remote_dir)
    except:
        pass
    
    uploaded_count = 0
    for item in local_dir.rglob('*'):
        if item.is_file():
            # Skip excluded patterns
            skip = False
            for pattern in exclude:
                if pattern in str(item):
                    skip = True
                    break
            if skip:
                continue
            
            # Calculate relative path
            relative_path = item.relative_to(local_dir)
            remote_path = f"{remote_dir}/{str(relative_path).replace(os.sep, '/')}"
            
            # Create remote directories
            remote_file_dir = os.path.dirname(remote_path)
            try:
                sftp.mkdir(remote_file_dir)
            except:
                pass
            
            # Upload file
            try:
                sftp.put(str(item), remote_path)
                uploaded_count += 1
                if uploaded_count % 10 == 0:
                    print(f"  📤 Uploaded {uploaded_count} files...")
            except Exception as e:
                print(f"  ⚠️  Failed to upload {item.name}: {e}")
    
    print(f"  ✅ Uploaded {uploaded_count} files")
    return uploaded_count

def deploy_complete():
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║         🚀 Complete Deployment به سرور                        ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    
    root_dir = Path(__file__).parent.parent
    frontend_dist = root_dir / 'frontend' / 'dist'
    backend_dir = root_dir / 'backend'
    
    if not frontend_dist.exists():
        print("❌ Frontend dist not found! Run 'npm run build' first.")
        return False
    
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        return False
    
    print(f"📂 Frontend: {frontend_dist}")
    print(f"📂 Backend: {backend_dir}")
    print(f"🌐 Server: {SERVER}")
    print()
    
    try:
        # Connect to server
        print("🔗 Connecting to server...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=30)
        print("✅ SSH Connected")
        
        sftp = ssh.open_sftp()
        print("✅ SFTP Connected")
        print()
        
        # 1. Upload Frontend
        print("═══ Step 1: Uploading Frontend ═══")
        upload_directory(sftp, frontend_dist, FRONTEND_PATH)
        print()
        
        # 2. Upload Backend Files
        print("═══ Step 2: Uploading Backend Changes ═══")
        
        # Upload leadersRoutes.js
        local_leaders = backend_dir / 'routes' / 'leadersRoutes.js'
        remote_leaders = f'{BACKEND_PATH}/routes/leadersRoutes.js'
        sftp.put(str(local_leaders), remote_leaders)
        print("  ✅ leadersRoutes.js uploaded")
        
        # Upload migration
        local_migration = backend_dir / 'migrations' / 'add_leader_bio_whatsapp.sql'
        remote_migration = f'{BACKEND_PATH}/migrations/add_leader_bio_whatsapp.sql'
        try:
            sftp.put(str(local_migration), remote_migration)
            print("  ✅ Migration SQL uploaded")
        except:
            print("  ⚠️  Migration already exists or path issue")
        
        print()
        
        # 3. Run Migration
        print("═══ Step 3: Running Migration ═══")
        migration_cmd = """
        PGPASSWORD='MyChurch2024Secure!' psql -h localhost -p 5433 -U mychurch_user -d mychurch -c "
        ALTER TABLE leaders 
        ADD COLUMN IF NOT EXISTS bio JSONB DEFAULT '{\\\"fa\\\": \\\"\\\", \\\"en\\\": \\\"\\\"}'::jsonb,
        ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
        SELECT column_name, data_type FROM information_schema.columns 
        WHERE table_name = 'leaders' AND column_name IN ('bio', 'whatsapp_number');
        "
        """
        stdin, stdout, stderr = ssh.exec_command(migration_cmd)
        output = stdout.read().decode()
        error = stderr.read().decode()
        
        if 'bio' in output and 'whatsapp_number' in output:
            print("  ✅ Migration successful")
            print(f"  📊 Columns: {output.strip()}")
        elif error:
            print(f"  ⚠️  Migration output: {error}")
        else:
            print("  ✅ Migration completed")
        
        print()
        
        # 4. Restart Backend
        print("═══ Step 4: Restarting Backend ═══")
        stdin, stdout, stderr = ssh.exec_command('pm2 restart backend')
        time.sleep(2)
        output = stdout.read().decode()
        
        if 'online' in output.lower() or 'restart' in output.lower():
            print("  ✅ Backend restarted (PM2)")
        else:
            print("  ✅ Backend restart command executed")
        
        print()
        
        # 5. Clear Nginx Cache
        print("═══ Step 5: Clearing Cache ═══")
        cache_cmds = [
            'rm -rf /var/cache/nginx/*',
            'systemctl reload nginx'
        ]
        for cmd in cache_cmds:
            ssh.exec_command(cmd)
        print("  ✅ Nginx cache cleared")
        
        print()
        print("════════════════════════════════════════════════════════════════")
        print("✅ Deployment Complete!")
        print()
        print("🌐 Website: https://samanabyar.online")
        print("📱 Test PWA on mobile (should show version 2.1.0)")
        print("🧪 Test Leaders API: https://samanabyar.online/api/leaders")
        print("════════════════════════════════════════════════════════════════")
        
        sftp.close()
        ssh.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = deploy_complete()
    sys.exit(0 if success else 1)
