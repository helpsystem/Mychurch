import sqlite3
import subprocess

try:
    print("Updating 3x-ui web base path...")
    conn = sqlite3.connect('/root/3x-ui/db/x-ui.db')
    c = conn.cursor()
    
    # Check if key exists
    c.execute("SELECT count(*) FROM settings WHERE key='webBasePath'")
    exists = c.fetchone()[0]
    
    if exists:
        c.execute("UPDATE settings SET value='/panel-x/' WHERE key='webBasePath'")
    else:
        c.execute("INSERT INTO settings (key, value) VALUES ('webBasePath', '/panel-x/')")
        
    conn.commit()
    conn.close()
    
    print("Restarting 3x-ui container...")
    subprocess.call(["docker", "restart", "3x-ui"])
    print("Done! Panel is now available at /panel-x/")
except Exception as e:
    print(f"Error: {e}")
