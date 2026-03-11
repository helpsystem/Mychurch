import sqlite3
import json

conn = sqlite3.connect('/root/3x-ui/db/x-ui.db')
c = conn.cursor()
c.execute("SELECT id, remark, port, protocol, settings, stream_settings FROM inbounds WHERE remark='Iran_VLESS'")
row = c.fetchone()

if not row:
    print("Inbound not found!")
else:
    inbound_id, remark, port, protocol, settings_raw, stream_settings_raw = row
    settings = json.loads(settings_raw)
    stream_settings = json.loads(stream_settings_raw)
    
    uuid = settings['clients'][0]['id']
    flow = settings['clients'][0].get('flow', '')
    
    reality_settings = stream_settings.get('realitySettings', {})
    public_key = reality_settings.get('publicKey', '')
    short_id = reality_settings.get('shortIds', [''])[0]
    server_name = reality_settings.get('serverNames', ['yahoo.com'])[0]
    
    # Format: vless://[uuid]@[ip]:[port]?type=tcp&security=reality&sni=[sni]&pbk=[public_key]&flow=[flow]#Iran_VLESS
    link = f"vless://{uuid}@195.250.25.185:{port}?type=tcp&security=reality&sni={server_name}&fp=chrome&pbk={public_key}&sid={short_id}&flow={flow}#{remark}"
    
    print("LINK:")
    print(link)

conn.close()
