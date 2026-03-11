#!/bin/bash
cd /tmp
if [ ! -f "xray" ]; then
    echo "Downloading Xray client..."
    wget -q https://github.com/XTLS/Xray-core/releases/download/v1.8.8/Xray-linux-64.zip
    unzip -o Xray-linux-64.zip
    chmod +x xray
fi

echo "Starting Xray with VLESS WS client config..."
./xray run -c /tmp/client.json > /tmp/xray.log 2>&1 &
XRAY_PID=$!

sleep 3 # Wait for proxy to bind

echo "Testing curl through VLESS tunnel (SOCKS5 10808)..."
curl -s --max-time 10 -x socks5h://127.0.0.1:10808 https://api.ipify.org > /tmp/curl_result.txt

RESULT=$(cat /tmp/curl_result.txt)
echo "Outbound IP seen by target: $RESULT"

kill $XRAY_PID
