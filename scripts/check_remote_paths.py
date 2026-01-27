import paramiko

SERVER_HOST = "samanabyar.online"
SERVER_PORT = 22
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

def check_paths():
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER_HOST, port=SERVER_PORT, username=SERVER_USER, password=SERVER_PASSWORD)
        
        print("Connected!")
        
        paths_to_check = [
            "/var/www/html",
            "/var/www/mychurch",
            "/var/www/mychurch/frontend/dist",
            "/var/www/mychurch/backend"
        ]
        
        for path in paths_to_check:
            stdin, stdout, stderr = ssh.exec_command(f"ls -ld {path}")
            result = stdout.read().decode().strip()
            error = stderr.read().decode().strip()
            
            if error:
                print(f"❌ {path}: Not found found or error ({error})")
            else:
                print(f"✅ {path}: {result}")
                # List content if it's mychurch
                if "mychurch" in path and "dist" not in path:
                     stdin, stdout, stderr = ssh.exec_command(f"ls {path}")
                     print(f"   Content: {stdout.read().decode().strip()}")

        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_paths()
