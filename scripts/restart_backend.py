#!/usr/bin/env python3
"""
Restart Backend with Correct Name
"""

import paramiko
import time

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

def restart_backend():
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║         🔄 Restart Backend (mychurch-backend)                ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD)
        print("✅ Connected to server")
        print()
        
        # Restart with correct name
        print("🔄 Restarting mychurch-backend...")
        stdin, stdout, stderr = ssh.exec_command('pm2 restart mychurch-backend')
        output = stdout.read().decode()
        error = stderr.read().decode()
        
        if error:
            print(f"⚠️  Stderr: {error}")
        
        print(output)
        print()
        
        # Wait for restart
        print("⏳ Waiting 3 seconds...")
        time.sleep(3)
        
        # Check logs
        print("📋 Recent logs after restart:")
        stdin, stdout, stderr = ssh.exec_command('pm2 logs mychurch-backend --lines 30 --nostream')
        output = stdout.read().decode()
        print(output)
        print()
        
        # Check if listening now
        print("🔍 Checking port 3001...")
        stdin, stdout, stderr = ssh.exec_command('netstat -tulpn | grep 3001')
        output = stdout.read().decode()
        if output:
            print(f"✅ Backend listening: {output}")
        else:
            print("❌ Still NOT listening on port 3001")
            print()
            print("🔍 Checking all Node processes:")
            stdin, stdout, stderr = ssh.exec_command('ps aux | grep node')
            print(stdout.read().decode())
        
        ssh.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    restart_backend()
