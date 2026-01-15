import paramiko
import os

HOST = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
LOCAL_FILE = 'backend/routes/bibleRoutes.js'
REMOTE_FILE = '/root/Mychurch/backend/routes/bibleRoutes.js'

def main():
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        print(f"Connecting to {HOST}...")
        ssh.connect(HOST, username=USERNAME, password=PASSWORD)

        sftp = ssh.open_sftp()
        print(f"Uploading {LOCAL_FILE} to {REMOTE_FILE}...")
        sftp.put(LOCAL_FILE, REMOTE_FILE)
        print("✅ Upload successful.")
        sftp.close()

        print("Restarting backend...")
        ssh.exec_command("pm2 restart backend")
        print("✅ Backend restarted.")

        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if not os.path.exists(LOCAL_FILE):
        print(f"Error: Local file {LOCAL_FILE} not found.")
    else:
        main()
