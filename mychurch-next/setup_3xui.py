import sys
import subprocess
import json
import urllib.request
import ssl
import uuid
import random

def do_req(url, data=None, cookie=None):
    req = urllib.request.Request(url)
    if data:
        req.add_header('Content-Type', 'application/json')
    if cookie:
        req.add_header('Cookie', cookie)
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    if data:
        data_bytes = json.dumps(data).encode('utf-8')
        res = urllib.request.urlopen(req, data=data_bytes, context=ctx)
    else:
        res = urllib.request.urlopen(req, context=ctx)
    
    resp_body = res.read().decode('utf-8')
    return json.loads(resp_body), res.getheader('Set-Cookie')

def main():
    print("Logging into 3x-ui...")
    login_data = {"username":"admin", "password":"admin"}
    try:
        resp, cookie = do_req("http://localhost:2053/login", login_data)
    except Exception as e:
        print("Failed to connect to 3x-ui:", e)
        sys.exit(1)

    new_cookie = None
    if cookie:
        new_cookie = cookie.split(';')[0]

    if not new_cookie or not resp.get("success"):
        print("Failed to login", resp)
        sys.exit(1)

    print("Logged in successfully.")

    print("Generating Xray x25519 Reality keys...")
    try:
        output = subprocess.check_output(["docker", "exec", "3x-ui", "x-ui", "x25519"]).decode('utf-8')
    except Exception as e:
        print("Failed to generate keys:", e)
        sys.exit(1)

    priv = ""
    pub = ""
    for line in output.split('\n'):
        if "Private key" in line:
            priv = line.split("Private key:")[1].strip()
        if "Public key" in line:
            pub = line.split("Public key:")[1].strip()

    short_id = ''.join(random.choices("0123456789abcdef", k=16))
    uid = str(uuid.uuid4())

    print(f"UUID: {uid}")
    print(f"Public Key: {pub}")
    print(f"Short ID: {short_id}")

    vless_payload = {
      "up": 0,
      "down": 0,
      "total": 0,
      "remark": "Iran_VLESS_Reality",
      "enable": True,
      "expiryTime": 0,
      "listen": "",
      "port": 8443,
      "protocol": "vless",
      "settings": json.dumps({
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
                  "subId": str(uuid.uuid4()),
                  "reset": 0
              }
          ],
          "decryption": "none",
          "fallbacks": []
      }),
      "streamSettings": json.dumps({
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
      }),
      "sniffing": {
        "enabled": True,
        "destOverride": ["http", "tls", "quic", "fakedns"],
        "metadataOnly": False,
        "routeOnly": False
      }
    }

    print("Sending VLESS+Reality inbound configuration to 3x-ui...")
    resp, _ = do_req("http://localhost:2053/panel/inbound/add", vless_payload, new_cookie)
    if resp.get("success"):
        print("Inbound added successfully!")
    else:
        print("Failed to add inbound:", resp)
        sys.exit(1)
        
    print("Restarting Xray/Panel to apply changes...")
    resp, _ = do_req("http://localhost:2053/panel/setting/restartPanel", cookie=new_cookie)
    print("Restart Response:", resp)
    
    # Save the client details for the user
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
