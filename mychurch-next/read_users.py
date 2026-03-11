import sqlite3
conn = sqlite3.connect('/root/3x-ui/db/x-ui.db')
c = conn.cursor()
c.execute("SELECT id, username, password FROM users")
print(c.fetchall())
conn.close()
