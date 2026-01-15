
import paramiko

def check_postgres_config():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('samanabyar.online', username='root', password='jIVeuzsrkoWPkhUY')
    
    print("--- Postgres Config ---")
    stdin, stdout, stderr = ssh.exec_command('cat /etc/postgresql/16/main/postgresql.conf | grep "port ="')
    print(stdout.read().decode())
    
    stdin, stdout, stderr = ssh.exec_command('cat /etc/postgresql/16/main/postgresql.conf | grep "listen_addresses"')
    print(stdout.read().decode())
    
    print("--- Netstat ---")
    # Using 'ss' as modern alternative to netstat just in case
    stdin, stdout, stderr = ssh.exec_command('ss -tulpn | grep 543')
    print(stdout.read().decode())
    
    ssh.close()

if __name__ == "__main__":
    check_postgres_config()
