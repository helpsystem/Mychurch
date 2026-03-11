import sqlite3
import subprocess

print("Stopping 3x-ui...")
subprocess.call(["docker", "stop", "3x-ui"])

print("Wiping inbounds to restore panel access...")
conn = sqlite3.connect('/root/3x-ui/db/x-ui.db')
c = conn.cursor()
c.execute("DELETE FROM inbounds")
conn.commit()
conn.close()

print("Starting 3x-ui...")
subprocess.call(["docker", "start", "3x-ui"])
print("Inbounds wiped. Panel should be accessible now!")
