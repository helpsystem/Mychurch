#!/usr/bin/env python3
"""
Upload regenerated song 335 timing file with Finglish to production server
"""

import sys
import os
from pathlib import Path

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
LOCAL_TIMING_FILE = r'D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\frontend\public\worship\data\timings\song_335_timing.json'
REMOTE_TIMING_DIR = '/var/www/samanabyar.online/frontend/dist/worship/data/timings'
REMOTE_TIMING_FILE = f'{REMOTE_TIMING_DIR}/song_335_timing.json'

def upload_timing_file():
    """Upload the timing file via SFTP"""
    print("=" * 60)
    print("📤 UPLOADING SONG 335 TIMING FILE WITH FINGLISH")
    print("=" * 60)
    
    # Verify local file exists
    if not os.path.exists(LOCAL_TIMING_FILE):
        print(f"❌ ERROR: Local file not found: {LOCAL_TIMING_FILE}")
        return False
    
    file_size = os.path.getsize(LOCAL_TIMING_FILE) / 1024  # KB
    print(f"✓ Local file found: {LOCAL_TIMING_FILE}")
    print(f"  Size: {file_size:.2f} KB")
    
    try:
        # Connect via SSH
        print(f"\n🔐 Connecting to {SERVER_HOST}...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Try to use SSH keys first, fall back to password if needed
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
        
        # Upload file
        print(f"\n📤 Uploading to: {REMOTE_TIMING_FILE}")
        sftp.put(LOCAL_TIMING_FILE, REMOTE_TIMING_FILE)
        print("✓ File uploaded successfully!")
        
        # Verify upload
        remote_stat = sftp.stat(REMOTE_TIMING_FILE)
        remote_size = remote_stat.st_size / 1024
        print(f"✓ Remote file size: {remote_size:.2f} KB")
        
        if abs(remote_size - file_size) < 0.1:
            print("✓ File size verified - upload successful!")
        else:
            print(f"⚠️  Warning: Size mismatch (local: {file_size:.2f} KB, remote: {remote_size:.2f} KB)")
        
        # Set proper permissions
        print("\n🔧 Setting file permissions...")
        sftp.chmod(REMOTE_TIMING_FILE, 0o644)
        print("✓ Permissions set to 644")
        
        sftp.close()
        ssh.close()
        
        print("\n" + "=" * 60)
        print("✅ UPLOAD COMPLETE!")
        print("=" * 60)
        print(f"\n📍 File location: {REMOTE_TIMING_FILE}")
        print(f"🌐 URL: https://samanabyar.online/worship/data/timings/song_335_timing.json")
        print("\n💡 Next steps:")
        print("   1. Clear browser cache (Ctrl+Shift+Delete)")
        print("   2. Clear localStorage (open DevTools > Application > Local Storage > Clear)")
        print("   3. Open song 335 in karaoke mode")
        print("   4. Click Settings icon in player")
        print("   5. Toggle 'فینگلیش' to ON")
        print("   6. Verify Finglish appears below Persian lyrics")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = upload_timing_file()
    exit(0 if success else 1)
