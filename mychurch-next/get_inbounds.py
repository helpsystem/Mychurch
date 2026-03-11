import sqlite3
import json

conn = sqlite3.connect('/root/3x-ui/db/x-ui.db')
c = conn.cursor()
c.execute("SELECT id, remark, port, protocol, settings, stream_settings, sniffer FROM inbounds")
rows = c.fetchall()

for row in rows:
    inbound_id, remark, port, protocol, settings, stream_settings, sniffer = row
    print(f"--- Inbound: {remark} (ID: {inbound_id}) ---")
    print(f"Protocol: {protocol}, Port: {port}")
    if settings:
        print("Settings:", json.dumps(json.loads(settings), indent=2))
    if stream_settings:
        print("Stream Settings:", json.dumps(json.loads(stream_settings), indent=2))
conn.close()
