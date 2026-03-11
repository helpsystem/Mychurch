import sqlite3
import json
import subprocess
import uuid

# 1. Generate new Reality keys using the correct Xray binary
print("Generating Reality keys...")
out = subprocess.check_output(["docker", "exec", "3x-ui", "/usr/local/x-ui/bin/xray-linux-amd64", "x25519"]).decode('utf-8')
keys = {}
for line in out.splitlines():
    if ':' in line:
        k, v = line.split(':', 1)
        keys[k.strip()] = v.strip()

private_key = keys.get('Private key')
public_key = keys.get('Public key')
client_id = str(uuid.uuid4())
short_id = "1a2b3c4d5e"

if not private_key or not public_key:
    print("Failed to generate keys!")
    exit(1)

# 2. Build exact JSON settings for TCP/UDP Hybrid
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

sniffer = {
    "enabled": True,
    "destOverride": ["http", "tls", "quic", "fakedns"]
}

# 3. Inject precisely into the fresh DB
print("Injecting into database...")
conn = sqlite3.connect('/root/3x-ui/db/x-ui.db')
c = conn.cursor()

c.execute("DELETE FROM inbounds WHERE remark='Iran_VLESS_WG_Clone'")

c.execute('''
    INSERT INTO inbounds 
    (user_id, up, down, total, remark, enable, expiry_time, listen, port, protocol, settings, stream_settings, tag, sniffer) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
''', (1, 0, 0, 0, 'Iran_VLESS_WG_Clone', 1, 0, '', 5021, 'vless', json.dumps(settings), json.dumps(stream_settings), 'inbound-5021', json.dumps(sniffer)))

conn.commit()
conn.close()

# 4. output final link
link = f"vless://{client_id}@195.250.25.185:5021?type=tcp&security=reality&sni=yahoo.com&fp=chrome&pbk={public_key}&sid={short_id}&flow=xtls-rprx-vision#Iran_VLESS_WG_Clone"

print("--- RESTARTING X-UI ---")
subprocess.call(["docker", "restart", "3x-ui"])

print("--- FINAL CONNECTION LINK ---")
print(link)
