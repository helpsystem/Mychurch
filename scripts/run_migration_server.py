#!/usr/bin/env python3
"""
Run migration directly on server
"""
import paramiko
import sys

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

def run_migration():
    print("🔗 Connecting to server...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=30)
    print("✅ Connected")
    
    # Migration command with postgres user
    migration_cmd = """sudo -u postgres psql -h localhost -p 5433 -d mychurch -c "ALTER TABLE leaders ADD COLUMN IF NOT EXISTS bio JSONB DEFAULT '{\\\"fa\\\": \\\"\\\", \\\"en\\\": \\\"\\\"}'::jsonb, ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20); SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'leaders' AND column_name IN ('bio', 'whatsapp_number');" """
    
    print("\n⚡ Running migration with postgres user...")
    stdin, stdout, stderr = ssh.exec_command(migration_cmd)
    output = stdout.read().decode()
    error = stderr.read().decode()
    
    print("\n📊 Output:")
    print(output)
    
    if error and 'ERROR' in error:
        print("❌ Error:")
        print(error)
        ssh.close()
        return False
    
    # Verify with API
    print("\n🧪 Testing API...")
    stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:3001/api/leaders')
    api_output = stdout.read().decode()
    
    if '"bio"' in api_output and '"whatsappNumber"' in api_output:
        print("✅ API working! bio and whatsappNumber fields present")
    else:
        print("⚠️ API response:")
        print(api_output[:500])
    
    # Test production URL
    print("\n🌐 Testing production URL...")
    stdin, stdout, stderr = ssh.exec_command('curl -s https://samanabyar.online/api/leaders')
    prod_output = stdout.read().decode()
    
    if '"bio"' in prod_output:
        print("✅ Production API working!")
    else:
        print("⚠️ Production response:")
        print(prod_output[:200])
    
    ssh.close()
    
    print("\n" + "="*60)
    print("✅ Migration Complete!")
    print("="*60)
    print("\n🌐 Test it: https://samanabyar.online/leaders")
    print("📱 PWA should update to version 2.1.0")
    
    return True

if __name__ == '__main__':
    try:
        success = run_migration()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
