
import os
import sys
import paramiko
from pathlib import Path
import subprocess

# Configuration
SERVER_HOST = "samanabyar.online"
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

FRONTEND_REMOTE_PATH = "/var/www/html"
BACKEND_REMOTE_PATH = "/root/Mychurch/backend"

def run_command(cmd, cwd=None):
    print(f"🔨 Running: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, text=True, capture_output=True)
    if result.returncode != 0:
        print(f"❌ Error: {result.stderr}")
        return False
    return True

def upload_directory(sftp, local_dir, remote_dir):
    print(f"📤 Uploading {local_dir} to {remote_dir}...")
    
    # Ensure remote dir exists
    try:
        sftp.mkdir(remote_dir)
    except IOError:
        pass

    for root, dirs, files in os.walk(local_dir):
        rel_path = os.path.relpath(root, local_dir)
        remote_path = os.path.join(remote_dir, rel_path).replace("\\", "/")
        
        try:
            sftp.mkdir(remote_path)
        except IOError:
            pass
            
        for file in files:
            local_file = os.path.join(root, file)
            remote_file = os.path.join(remote_path, file).replace("\\", "/")
            
            # Skip node_modules and .git in recursive uploads (mainly for backend)
            if "node_modules" in local_file or ".git" in local_file:
                continue
                
            print(f"   📄 {file}")
            sftp.put(local_file, remote_file)

def main():
    print("🚀 Starting Master Deployment...")
    
    # 1. Build Frontend
    print("\n📦 STEP 1: Building Frontend...")
    frontend_dir = os.path.join(os.getcwd(), "frontend")
    if not run_command("npm run build", cwd=frontend_dir):
        return

    # 2. Connect to Server
    print("\n🔗 STEP 2: Connecting to Server...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASSWORD)
    sftp = ssh.open_sftp()
    
    # 3. Deploy Frontend
    print("\nnm🌐 STEP 3: Deploying Frontend...")
    dist_dir = os.path.join(frontend_dir, "dist")
    # We upload contents of dist to FRONTEND_REMOTE_PATH
    # First, let's backup/clean? For now just overwrite.
    upload_directory(sftp, dist_dir, FRONTEND_REMOTE_PATH)
    
    # 4. Deploy Backend
    print("\n⚙️ STEP 4: Deploying Backend...")
    backend_dir = os.path.join(os.getcwd(), "backend")
    # Upload specific files or whole dir? backend usually needs package.json, server.js, etc.
    # Let's upload key files
    files_to_upload = ["server.js", "package.json", "package-lock.json"]
    
    # Ensure remote backend dir exists
    try:
        sftp.stat(BACKEND_REMOTE_PATH)
    except FileNotFoundError:
        print(f"Creating backend dir: {BACKEND_REMOTE_PATH}")
        sftp.mkdir(BACKEND_REMOTE_PATH)

    for f in files_to_upload:
        local = os.path.join(backend_dir, f)
        remote = f"{BACKEND_REMOTE_PATH}/{f}"
        if os.path.exists(local):
            print(f"   📄 {f}")
            sftp.put(local, remote)
            
    # Also upload migrations or other folders if needed
    # For now, simplistic update.
    
    # Upload new scripts (Google Timing)
    scripts_dir = os.path.join(os.getcwd(), "scripts")
    remote_scripts_path = "/root/Mychurch/scripts"
    try:
        sftp.mkdir(remote_scripts_path)
    except:
        pass
    
    print("   📄 Uploading google-timing.cjs")
    sftp.put(os.path.join(scripts_dir, "google-timing.cjs"), f"{remote_scripts_path}/google-timing.cjs")
    
    # 5. Restart Services
    print("\n🔄 STEP 5: Restarting Services...")
    
    # Install backend deps
    print("   Running npm install in backend...")
    stdin, stdout, stderr = ssh.exec_command(f"cd {BACKEND_REMOTE_PATH} && npm install --production")
    print(stdout.read().decode())
    
    # Restart PM2
    print("   Restarting PM2...")
    stdin, stdout, stderr = ssh.exec_command("pm2 restart all")
    print(stdout.read().decode())
    
    # Reload Nginx
    # print("   Reloading Nginx...")
    # stdin, stdout, stderr = ssh.exec_command("service nginx reload")
    # print(stdout.read().decode())

    ssh.close()
    print("\n✅ DEPLOYMENT COMPLETE!")
    print("Check https://samanabyar.online")

if __name__ == "__main__":
    main()
