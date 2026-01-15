
import paramiko
import os

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
REMOTE_PATH = '/root/Mychurch/public/bible_data/audio'

def list_audio_files():
    print("📂 Listing Remote Audio Directories...")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
        
        # List directories in audio folder
        stdin, stdout, stderr = ssh.exec_command(f'ls -F {REMOTE_PATH}')
        print("Root Audio Folder:")
        print(stdout.read().decode())
        
        # Check MOJDEH specifically
        print("\nChecking MOJDEH:")
        stdin, stdout, stderr = ssh.exec_command(f'ls -F {REMOTE_PATH}/MOJDEH')
        out = stdout.read().decode()
        if not out:
            print("   (Empty or does not exist)")
        else:
            print(out[:500]) # First 500 chars
            
        # Check TPV
        print("\nChecking TPV:")
        stdin, stdout, stderr = ssh.exec_command(f'ls -F {REMOTE_PATH}/TPV')
        out = stdout.read().decode()
        print(out[:500])
        
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    list_audio_files()
