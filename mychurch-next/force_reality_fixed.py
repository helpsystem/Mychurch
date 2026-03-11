import sqlite3
import json
import subprocess
import uuid

# 1. Generate new Reality keys
print("Generating Reality keys on host using /tmp/xray...")
out = subprocess.check_output(["/tmp/xray", "x25519"]).decode('utf-8')
keys = {}
for line in out.splitlines():
    if ':' in line:
        k, v = line.split(':', 1)
        k_clean = k.replace(' ', '').strip()
        keys[k_clean] = v.strip()

private_key = keys.get('PrivateKey') or keys.get('Privatekey') or keys.get('privatekey')
public_key = keys.get('PublicKey') or keys.get('Publickey') or keys.get('publickey')
client_id = str(uuid.uuid4())
short_id = "1a2b3c4d5e"

if not private_key or not public_key:
    print("Failed to generate keys!")
    exit(1)

# 2. Build exact JSON settings for TCP/Reality
settings = {
    "clients": [
        {
            "id": client_id,
            "flow": "xtls-rprx-vision"
        }
    ],
    "decryption": "none",
    "fallbacks": []
}

stream_settings = {
    "network": "tcp",
    "security": "reality",
    "realitySettings": {
        "show": False,
        "dest": "yahoo.com:443",
        "xver": 0,
        "serverNames": ["yahoo.com", "www.yahoo.com"],
        "privateKey": private_key,
        "minClientVer": "",
        "maxClientVer": "",
        "maxTimeDiff": 0,
        "shortIds": [short_id]
    },
    "tcpSettings": {
        "acceptProxyProtocol": False,
        "header": {"type": "none"}
    }
}

# 3. Inject precisely into the fresh DB without legacy sniffer col
print("Injecting into database...")
conn = sqlite3.connect('/root/3x-ui/db/x-ui.db')
c = conn.cursor()

c.execute("DELETE FROM inbounds WHERE remark='Iran_VLESS_Reality'")

c.execute('''
    INSERT INTO inbounds 
    (user_id, up, down, total, remark, enable, expiry_time, listen, port, protocol, settings, stream_settings, tag) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
''', (1, 0, 0, 0, 'Iran_VLESS_Reality', 1, 0, '', 8443, 'vless', json.dumps(settings), json.dumps(stream_settings), 'inbound-8443'))

conn.commit()
conn.close()

# 4. output final link
link = f"vless://{client_id}@195.250.25.185:8443?type=tcp&security=reality&sni=yahoo.com&fp=chrome&pbk={public_key}&sid={short_id}&flow=xtls-rprx-vision#Iran_VLESS_Reality_New"

print("--- RESTARTING X-UI ---")
subprocess.call(["docker", "restart", "3x-ui"])

print("--- FINAL CONNECTION LINK ---")
with open("/tmp/reality_link.txt", "w") as f:
    f.write(link)
print(link)
