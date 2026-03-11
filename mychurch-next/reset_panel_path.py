import sqlite3
import subprocess

try:
    print("Resetting 3x-ui web base path...")
    conn = sqlite3.connect('/root/3x-ui/db/x-ui.db')
    c = conn.cursor()
    
    # Reset webBasePath back to root
    c.execute("UPDATE settings SET value='/' WHERE key='webBasePath'")
        
    conn.commit()
    conn.close()
    
    print("Restarting 3x-ui container...")
    subprocess.call(["docker", "restart", "3x-ui"])
    print("Done! Panel base path is reset to /")
except Exception as e:
    print(f"Error: {e}")
