#!/usr/bin/env python3
"""
Get Full Backend Error Logs
"""

import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

def get_full_logs():
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║         📋 Full Backend Error Logs                           ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD)
        print("✅ Connected")
        print()
        
        # Get FULL error logs
        print("🔍 Full error log (last 100 lines):")
        stdin, stdout, stderr = ssh.exec_command('pm2 logs mychurch-backend --err --lines 100 --nostream')
        output = stdout.read().decode()
        print(output)
        print()
        
        # Check if there's a startup script
        print("🔍 Checking PM2 config...")
        stdin, stdout, stderr = ssh.exec_command('pm2 show mychurch-backend')
        output = stdout.read().decode()
        print(output)
        
        ssh.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    get_full_logs()
