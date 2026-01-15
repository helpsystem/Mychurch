
import paramiko

def find_audio():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('samanabyar.online', username='root', password='jIVeuzsrkoWPkhUY')
    
    print("--- Finding MP3 Files ---")
    stdin, stdout, stderr = ssh.exec_command('find /root/Mychurch -name "1.mp3" | head -n 20')
    print(stdout.read().decode())
    
    ssh.close()

if __name__ == "__main__":
    find_audio()
