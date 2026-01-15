
import paramiko

def rename_folder():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('samanabyar.online', username='root', password='jIVeuzsrkoWPkhUY')
    
    print("--- Renaming Audio Folder ---")
    # Check if QADIM exists first, if not rename MOJDEH to QADIM
    cmd = """
    if [ -d "/root/Mychurch/public/bible_data/audio/MOJDEH" ]; then
        echo "Found MOJDEH folder, renaming to QADIM..."
        mv /root/Mychurch/public/bible_data/audio/MOJDEH /root/Mychurch/public/bible_data/audio/QADIM
    else
        echo "MOJDEH folder not found (maybe already renamed?)"
    fi
    
    echo "Current folders in audio:"
    ls -F /root/Mychurch/public/bible_data/audio/
    """
    
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    ssh.close()

if __name__ == "__main__":
    rename_folder()
