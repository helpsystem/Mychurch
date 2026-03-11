import sqlite3
import json
import subprocess
import uuid

client_id = str(uuid.uuid4())

settings = {
    "clients": [
        {
            "id": client_id,
            "alterId": 0
        }
    ],
    "decryption": "none",
    "fallbacks": []
}

stream_settings = {
    "network": "ws",
    "security": "none",
    "wsSettings": {
        "acceptProxyProtocol": False,
        "path": "/vpn-stream",
        "headers": {
            "Host": "samanabyar.online"
        }
    }
}

print("Injecting into database...")
conn = sqlite3.connect('/root/3x-ui/db/x-ui.db')
c = conn.cursor()

c.execute("DELETE FROM inbounds WHERE remark='Iran_VLESS_WS'")

# Port 2080 matches Nginx, removed sniffer column for backwards db compat
c.execute('''
    INSERT INTO inbounds 
    (user_id, up, down, total, remark, enable, expiry_time, listen, port, protocol, settings, stream_settings, tag) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
''', (1, 0, 0, 0, 'Iran_VLESS_WS', 1, 0, '127.0.0.1', 2080, 'vless', json.dumps(settings), json.dumps(stream_settings), 'inbound-2080'))

conn.commit()
conn.close()

link = f"vless://{client_id}@samanabyar.online:443?type=ws&security=tls&path=%2Fvpn-stream&sni=samanabyar.online&alpn=http/1.1&host=samanabyar.online#Iran_VLESS_WS_Proxy"

print("--- RESTARTING X-UI ---")
subprocess.call(["docker", "restart", "3x-ui"])

print("--- FINAL CONNECTION LINK ---")
print(link)
