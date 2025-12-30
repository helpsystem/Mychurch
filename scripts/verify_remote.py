
import paramiko
import re

SERVER_HOST = "samanabyar.online"
SERVER_PORT = 22
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

def verify_remote():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting to {SERVER_HOST}...")
        ssh.connect(SERVER_HOST, port=SERVER_PORT, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        
        # Check index.html content
        print("\nChecking /var/www/html/index.html content...")
        stdin, stdout, stderr = ssh.exec_command("cat /var/www/html/index.html")
        content = stdout.read().decode('utf-8')
        
        # Search for title
        title_match = re.search(r'<title>(.*?)</title>', content)
        if title_match:
            print(f"TITLE FOUND: {title_match.group(1)}")
        else:
            print("TITLE NOT FOUND")
            
        # Search for AI keyword in body/noscript
        if "Google Gemini" in content:
             print("✅ 'Google Gemini' found in content")
        else:
             print("❌ 'Google Gemini' NOT found in content")

        ssh.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_remote()
