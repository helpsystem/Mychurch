#!/usr/bin/env python3
"""
Deploy all regenerated worship timing files with Finglish to production server
"""

import sys
import os
from pathlib import Path
import glob

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import paramiko
except ImportError:
    print("❌ ERROR: paramiko module not found")
    print("💡 Please install it with: pip install paramiko")
    sys.exit(1)

# Server configuration
SERVER_HOST = 'samanabyar.online'
SERVER_USER = 'root'
SERVER_PORT = 22

# Paths
LOCAL_TIMING_DIR = r'D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\frontend\public\worship\data\timings'
REMOTE_TIMING_DIR = '/var/www/samanabyar.online/frontend/dist/worship/data/timings'

def upload_all_timing_files():
    """Upload all timing files via SFTP"""
    print("=" * 70)
    print("📤 DEPLOYING ALL WORSHIP TIMING FILES WITH FINGLISH TO PRODUCTION")
    print("=" * 70)
    
    # Get all timing files
    timing_files = glob.glob(os.path.join(LOCAL_TIMING_DIR, 'song_*_timing.json'))
    
    if not timing_files:
        print(f"❌ ERROR: No timing files found in {LOCAL_TIMING_DIR}")
        return False
    
    print(f"\n✓ Found {len(timing_files)} timing files to upload")
    
    try:
        # Connect via SSH
        print(f"\n🔐 Connecting to {SERVER_HOST}...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        try:
            ssh.connect(
                SERVER_HOST,
                port=SERVER_PORT,
                username=SERVER_USER,
                timeout=30
            )
            print("✓ SSH connection established")
        except Exception as e:
            print(f"⚠️  SSH key auth failed, you may need to enter password")
            raise
        
        # Open SFTP session
        sftp = ssh.open_sftp()
        print("✓ SFTP session opened")
        
        # Ensure remote directory exists
        print(f"\n📁 Ensuring remote directory exists: {REMOTE_TIMING_DIR}")
        try:
            sftp.stat(REMOTE_TIMING_DIR)
            print("✓ Remote directory exists")
        except FileNotFoundError:
            print("⚠️  Remote directory not found, creating it...")
            stdin, stdout, stderr = ssh.exec_command(f'mkdir -p {REMOTE_TIMING_DIR}')
            stdout.channel.recv_exit_status()
            print("✓ Remote directory created")
        
        # Upload files
        uploaded = 0
        failed = 0
        total_size = 0
        
        print(f"\n📤 Uploading {len(timing_files)} files...")
        print("-" * 70)
        
        for i, local_file in enumerate(timing_files, 1):
            filename = os.path.basename(local_file)
            remote_file = f"{REMOTE_TIMING_DIR}/{filename}"
            file_size = os.path.getsize(local_file) / 1024  # KB
            
            try:
                print(f"[{i}/{len(timing_files)}] Uploading {filename} ({file_size:.1f} KB)...", end=' ')
                sftp.put(local_file, remote_file)
                sftp.chmod(remote_file, 0o644)
                print("✓")
                uploaded += 1
                total_size += file_size
            except Exception as e:
                print(f"❌ FAILED: {str(e)}")
                failed += 1
        
        sftp.close()
        ssh.close()
        
        print("-" * 70)
        print("\n" + "=" * 70)
        print("📊 DEPLOYMENT SUMMARY")
        print("=" * 70)
        print(f"✓ Uploaded: {uploaded} files")
        if failed > 0:
            print(f"❌ Failed: {failed} files")
        print(f"📦 Total size: {total_size:.2f} KB")
        print(f"📍 Remote location: {REMOTE_TIMING_DIR}")
        print(f"🌐 Base URL: https://samanabyar.online/worship/data/timings/")
        
        if uploaded > 0:
            print("\n" + "=" * 70)
            print("✅ DEPLOYMENT COMPLETE!")
            print("=" * 70)
            print("\n💡 Next steps:")
            print("   1. Clear browser cache (Ctrl+Shift+Delete)")
            print("   2. Clear localStorage (DevTools > Application > Local Storage > Clear)")
            print("   3. Test any worship song in karaoke mode")
            print("   4. Click Settings icon in player")
            print("   5. Toggle 'فینگلیش' to ON")
            print("   6. Verify Finglish appears below Persian lyrics")
            print(f"\n📈 Coverage: All {uploaded} songs now support Finglish!")
            return True
        else:
            return False
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = upload_all_timing_files()
    exit(0 if success else 1)
