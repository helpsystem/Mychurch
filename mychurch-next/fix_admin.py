import sqlite3
import subprocess

print("Stopping 3x-ui...")
subprocess.call(["docker", "stop", "3x-ui"])

print("Updating database with new credentials...")
conn = sqlite3.connect('/root/3x-ui/db/x-ui.db')
c = conn.cursor()
c.execute("UPDATE users SET username='samyar', password='Samyar@1989' WHERE id=1")
c.execute("UPDATE settings SET value='2053' WHERE key='webPort'")
conn.commit()
conn.close()

print("Starting 3x-ui...")
subprocess.call(["docker", "start", "3x-ui"])
print("Admin updated successfully!")
