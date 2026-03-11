import sqlite3
import subprocess
import json
import uuid
import random

def main():
    print("Using pre-generated Xray x25519 Reality keys...")
    
    priv = "8POn3rTA1FUa8fZr6DPlol3h5TRni1cJb-Gd2x1LWkw"
    pub = "iF_lZjtEYOUyeZNYZAiWxScFK55SS0jOyLBoWhuY3BI"

    short_id = ''.join(random.choices("0123456789abcdef", k=16))
    uid = str(uuid.uuid4())
    subid = str(uuid.uuid4())

    settings = json.dumps({
        "clients": [
            {
                "id": uid,
                "flow": "xtls-rprx-vision",
                "email": "iran_user_1",
                "limitIp": 0,
                "totalGB": 0,
                "expiryTime": 0,
                "enable": True,
                "tgId": "",
                "subId": subid,
                "reset": 0
            }
        ],
        "decryption": "none",
        "fallbacks": []
    })

    stream_settings = json.dumps({
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
            "show": False,
            "xver": 0,
            "dest": "yahoo.com:443",
            "serverNames": ["yahoo.com", "www.yahoo.com"],
            "privateKey": priv,
            "minClientVer": "",
            "maxClientVer": "",
            "maxTimeDiff": 0,
            "shortIds": [short_id]
        },
        "tcpSettings": {
            "acceptProxyProtocol": False,
            "header": {"type": "none"}
        }
    })

    sniffing = json.dumps({
        "enabled": True,
        "destOverride": ["http", "tls", "quic", "fakedns"],
        "metadataOnly": False,
        "routeOnly": False
    })

    print("Stopping 3x-ui to safely edit database...")
    subprocess.call(["docker", "stop", "3x-ui"])

    conn = sqlite3.connect('/root/3x-ui/db/x-ui.db')
    c = conn.cursor()
    c.execute("DELETE FROM inbounds WHERE remark = 'Iran_VLESS_Reality'")
    
    c.execute('''
    INSERT INTO inbounds (user_id, up, down, total, remark, enable, expiry_time, listen, port, protocol, settings, stream_settings, tag, sniffing)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (1, 0, 0, 0, 'Iran_VLESS_Reality', 1, 0, '', 8443, 'vless', settings, stream_settings, 'inbound-8443', sniffing))
    conn.commit()
    print("Inbound added to database.")
    
    conn.close()

    print("Starting 3x-ui...")
    subprocess.call(["docker", "start", "3x-ui"])

    client_config = f"""
==================================================
        IRAN VLESS+REALITY VPN DETAILS
==================================================
IP Address  : 195.250.25.185
Port        : 8443
UUID        : {uid}
Network     : tcp
Security    : reality
SNI / Dest  : yahoo.com
Fingerprint : chrome
Public Key  : {pub}
Short ID    : {short_id}
Flow        : xtls-rprx-vision
==================================================
Paste this string into V2rayNG, Nekobox, or Hiddify:

vless://{uid}@195.250.25.185:8443?type=tcp&security=reality&pbk={pub}&fp=chrome&sni=yahoo.com&sid={short_id}&spx=%2F&flow=xtls-rprx-vision#Iran_VLESS_Reality
==================================================
"""
    print(client_config)

if __name__ == "__main__":
    main()
