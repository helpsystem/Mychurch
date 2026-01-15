
import paramiko
import os

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
LOCAL_DIR = 'public/bible_data/audio/MOJDEH'
REMOTE_DIR = '/root/Mychurch/public/bible_data/audio/MOJDEH'

def upload_folder():
    print(f"🚀 Starting Upload: {LOCAL_DIR} -> {REMOTE_DIR}")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD)
    sftp = ssh.open_sftp()
    
    # Create remote base
    try: sftp.mkdir(REMOTE_DIR)
    except: pass
    
    # Walk local files
    for root, dirs, files in os.walk(LOCAL_DIR):
        # Create corresponding remote dir
        rel_path = os.path.relpath(root, LOCAL_DIR)
        remote_path = os.path.join(REMOTE_DIR, rel_path).replace('\\', '/')
        
        if rel_path != '.':
            try: sftp.mkdir(remote_path)
            except: pass
            
        for f in files:
            local_file = os.path.join(root, f)
            remote_file = os.path.join(remote_path, f).replace('\\', '/')
            try:
                sftp.stat(remote_file)
                # print(f"Skipping {f} (exists)")
            except FileNotFoundError:
                print(f"Uploading {f}...")
                sftp.put(local_file, remote_file)
                
    print("✅ Upload Complete")
    sftp.close()
    ssh.close()

if __name__ == '__main__':
    upload_folder()
