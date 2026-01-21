#!/usr/bin/env python3
"""
Deploy nginx config to server
"""

import paramiko

SERVER_HOST = "samanabyar.online"
SERVER_PORT = 22
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

LOCAL_CONFIG = r"D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\deployment\configs\nginx-mychurch-unix.conf"
REMOTE_CONFIG = "/etc/nginx/sites-available/mychurch"

def main():
    print("🔗 Connecting to server...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_HOST, port=SERVER_PORT, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        print("✅ Connected")
        
        sftp = ssh.open_sftp()
        
        # Upload config
        print("📤 Uploading nginx config...")
        sftp.put(LOCAL_CONFIG, REMOTE_CONFIG)
        print("✅ Config uploaded")
        
        sftp.close()
        
        # Test nginx config
        print("🔍 Testing nginx config...")
        stdin, stdout, stderr = ssh.exec_command("nginx -t")
        err = stderr.read().decode()
        if "successful" in err or "ok" in err:
            print("✅ Config test passed")
            
            # Reload nginx
            print("🔄 Reloading nginx...")
            stdin, stdout, stderr = ssh.exec_command("systemctl reload nginx")
            stdout.read()
            print("✅ Nginx reloaded")
        else:
            print(f"❌ Config test failed: {err}")
        
        ssh.close()
        print("\n🎉 Done!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
