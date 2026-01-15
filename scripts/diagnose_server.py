
import paramiko
import json

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

def check_server_state():
    print("🕵️‍♂️ Diagnosing Server State...")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
        
        # 1. Get PM2 Info to find the running directory
        print("\n[1] Checking PM2 Process Info...")
        stdin, stdout, stderr = ssh.exec_command('pm2 jlist')
        pm2_json = stdout.read().decode()
        
        try:
            processes = json.loads(pm2_json)
            backend_proc = next((p for p in processes if 'backend' in p['name']), None)
            
            if backend_proc:
                cwd = backend_proc['pm2_env']['pm_cwd']
                status = backend_proc['pm2_env']['status']
                print(f"   ✅ Backend Found:")
                print(f"      Status: {status}")
                print(f"      CWD: {cwd}")
                
                # 2. Check the file in THAT directory
                file_path = f"{cwd}/routes/bible-local.js"
                print(f"\n[2] Checking file at: {file_path}")
                
                # Check for 'hidrive'
                cmd_hidrive = f'grep "hidrive" "{file_path}"'
                stdin, stdout, stderr = ssh.exec_command(cmd_hidrive)
                hidrive_matches = stdout.read().decode().strip()
                
                # Check for '/bible_data/audio'
                cmd_new = f'grep "/bible_data/audio" "{file_path}"'
                stdin, stdout, stderr = ssh.exec_command(cmd_new)
                new_matches = stdout.read().decode().strip()
                
                print("   --- Grep Results ---")
                if hidrive_matches:
                    print(f"   ⚠️  FOUND 'hidrive' (Old Code?):\n{hidrive_matches}")
                else:
                    print("   ✅ 'hidrive' NOT found.")
                    
                if new_matches:
                    print(f"   ✅ FOUND '/bible_data/audio' (New Code):\n{new_matches}")
                else:
                    print("   ❌ '/bible_data/audio' NOT found (New code missing).")
                    
            else:
                print("   ❌ 'backend' process not found in PM2 list.")
                
        except json.JSONDecodeError:
            print("   ❌ Failed to parse PM2 JSON output.")
            print(pm2_json[:200]) # Print start of output
            
        ssh.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    check_server_state()
