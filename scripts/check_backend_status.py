#!/usr/bin/env python3
"""
Check Backend Status on Server
"""

import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

def check_backend_status():
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║         🔍 Backend Status Check                              ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD)
        print("✅ Connected to server")
        print()
        
        # Check if backend is running
        print("🔍 Checking backend process...")
        stdin, stdout, stderr = ssh.exec_command('pm2 list')
        output = stdout.read().decode()
        print(output)
        print()
        
        # Check backend logs
        print("📋 Recent backend logs:")
        stdin, stdout, stderr = ssh.exec_command('pm2 logs backend --lines 20 --nostream')
        output = stdout.read().decode()
        print(output)
        print()
        
        # Check if backend is listening
        print("🔍 Checking port 3001...")
        stdin, stdout, stderr = ssh.exec_command('netstat -tulpn | grep 3001')
        output = stdout.read().decode()
        if output:
            print(f"✅ Backend listening: {output}")
        else:
            print("❌ Backend NOT listening on port 3001!")
        
        ssh.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    check_backend_status()
