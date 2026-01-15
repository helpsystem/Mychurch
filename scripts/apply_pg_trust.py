
import paramiko

SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
PG_HBA_PATH = '/etc/postgresql/16/main/pg_hba.conf'

def apply_trust():
    print(f"🔧 Applying TRUST auth to {PG_HBA_PATH}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USERNAME, password=PASSWORD)
    
    # Read file
    sftp = ssh.open_sftp()
    with sftp.file(PG_HBA_PATH, 'r') as f:
        content = f.read().decode()
        
    # Replace scram-sha-256 with trust for local
    # Standard line: local   all             all                                     scram-sha-256
    # Or: host    all             all             127.0.0.1/32            scram-sha-256
    
    new_lines = []
    
    for line in content.splitlines():
        # Modify local unix socket
        if line.strip().startswith('local') and 'all' in line and ('scram-sha-256' in line or 'md5' in line):
            print(f"   Modifying: {line}")
            new_lines.append(line.replace('scram-sha-256', 'trust').replace('md5', 'trust'))
        # Modify localhost IPv4
        elif line.strip().startswith('host') and '127.0.0.1/32' in line and ('scram-sha-256' in line or 'md5' in line):
            print(f"   Modifying: {line}")
            new_lines.append(line.replace('scram-sha-256', 'trust').replace('md5', 'trust'))
        # Modify localhost IPv6
        elif line.strip().startswith('host') and '::1/128' in line and ('scram-sha-256' in line or 'md5' in line):
            print(f"   Modifying: {line}")
            new_lines.append(line.replace('scram-sha-256', 'trust').replace('md5', 'trust'))
        else:
            new_lines.append(line)
            
    # Upload new file locally
    with open('temp_pg_hba.conf', 'w', newline='\n') as f:
        f.write("\n".join(new_lines) + "\n")
        
    sftp.put('temp_pg_hba.conf', '/tmp/pg_hba.conf')
    
    # Move via sudo
    ssh.exec_command(f'cp /tmp/pg_hba.conf {PG_HBA_PATH}')
    ssh.exec_command(f'chown postgres:postgres {PG_HBA_PATH}')
    
    # Restart Postgres
    print("🔄 Restarting Postgres...")
    stdin, stdout, stderr = ssh.exec_command('systemctl restart postgresql')
    print(stderr.read().decode())
    
    print("✅ Done")
    ssh.close()

if __name__ == '__main__':
    apply_trust()
