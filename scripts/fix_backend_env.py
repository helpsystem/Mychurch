
import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'

def update_env():
    print("🔧 Updating .env to enable Local DB...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD)
    
    # Read current env
    cmd_read = 'cat /root/Mychurch/backend/.env'
    stdin, stdout, stderr = ssh.exec_command(cmd_read)
    content = stdout.read().decode()
    
    new_lines = []
    found_db = False
    
    for line in content.splitlines():
        if "DATABASE_URL=" in line:
            new_lines.append("DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mychurch")
            found_db = True
        elif "DATABASE_URL_DISABLED=" in line:
             new_lines.append("DATABASE_URL_DISABLED=false")
        else:
            new_lines.append(line)
            
    if not found_db:
        new_lines.append("DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mychurch")

    # Write back
    new_content = "\n".join(new_lines)
    
    # Use echo to write (careful with quotes, better to use sftp)
    sftp = ssh.open_sftp()
    with sftp.file('/root/Mychurch/backend/.env', 'w') as f:
        f.write(new_content)
        
    print("✅ .env Updated")
    ssh.close()

if __name__ == '__main__':
    update_env()
