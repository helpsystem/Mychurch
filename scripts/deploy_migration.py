
import paramiko
import os

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
REMOTE_BASE = '/root/Mychurch/backend'

FILES_TO_UPLOAD = {
    'backend/migrations/add_leader_bio_whatsapp.sql': f'{REMOTE_BASE}/migrations/add_leader_bio_whatsapp.sql',
    'backend/run-migration-leaders.js': f'{REMOTE_BASE}/run-migration-leaders.js'
}

def upload_and_run():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD)
    sftp = ssh.open_sftp()
    
    # Ensure migration dir exists
    try:
        sftp.mkdir(f'{REMOTE_BASE}/migrations')
    except:
        pass

    for local, remote in FILES_TO_UPLOAD.items():
        print(f"Uploading {local} -> {remote}")
        sftp.put(local, remote)
        
    print("🚀 Executing Migration on Remote Server...")
    # Use the env from the running service or load .env if possible
    # Assuming .env exists in backend root
    cmd = f'cd {REMOTE_BASE} && node -r dotenv/config run-migration-leaders.js'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    print("\nOUTPUT:")
    print(stdout.read().decode())
    print("ERRORS:")
    print(stderr.read().decode())
    
    sftp.close()
    ssh.close()

if __name__ == '__main__':
    upload_and_run()
