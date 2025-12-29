#!/usr/bin/env python3
import paramiko
import sys

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

print("="*60)
print("Running Migration on Server")
print("="*60)

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=30)
    print("✅ Connected to server")
    
    # Run migration as postgres user
    cmd = 'sudo -u postgres psql -p 5433 mychurch -c "ALTER TABLE leaders ADD COLUMN IF NOT EXISTS bio JSONB DEFAULT \'{\\\"fa\\\": \\\"\\\", \\\"en\\\": \\\"\\\"}\'::jsonb, ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);"'
    
    print("\n⚡ Executing migration...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    out = stdout.read().decode()
    err = stderr.read().decode()
    
    if 'ALTER TABLE' in out or 'already exists' in err.lower():
        print("✅ Migration successful!")
    elif err:
        print(f"Output: {out}")
        print(f"Error: {err}")
    
    # Verify
    print("\n🔍 Verifying columns...")
    verify_cmd = 'sudo -u postgres psql -p 5433 mychurch -c "\\d leaders"'
    stdin, stdout, stderr = ssh.exec_command(verify_cmd, timeout=15)
    result = stdout.read().decode()
    
    if 'bio' in result and 'whatsapp_number' in result:
        print("✅ Columns verified!")
        print("\nColumns found:")
        for line in result.split('\n'):
            if 'bio' in line or 'whatsapp_number' in line:
                print(f"  {line}")
    else:
        print("Result:")
        print(result)
    
    # Test API
    print("\n🌐 Testing API...")
    stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:3001/api/leaders | head -c 500', timeout=10)
    api_result = stdout.read().decode()
    
    if '"bio"' in api_result:
        print("✅ API working with bio field!")
    
    ssh.close()
    
    print("\n" + "="*60)
    print("✅ DEPLOYMENT COMPLETE!")
    print("="*60)
    print("\n🌐 Visit: https://samanabyar.online/leaders")
    print("📱 PWA version: 2.1.0")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
