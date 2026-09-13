import sqlite3
import json

conn = sqlite3.connect('/root/3x-ui/db/x-ui.db')
c = conn.cursor()
c.execute("SELECT settings FROM inbounds WHERE remark='Iran_VLESS_WS'")
row = c.fetchone()
conn.close()

if row:
    settings = json.loads(row[0])
    client_id = settings['clients'][0]['id']
    link = f"vless://{client_id}@iranianchurchdc.com:443?type=ws&security=tls&path=%2Fvpn-stream&sni=iranianchurchdc.com&alpn=http/1.1&host=iranianchurchdc.com#Iran_VLESS_WS_Proxy"
    
    with open('/tmp/final_link.txt', 'w') as f:
        f.write(link)
    print(link)
