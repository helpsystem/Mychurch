#!/usr/bin/env python3
import requests

BASE_URL = "https://samanabyar.online"

print("🔍 Testing Worship Page Data Loading on Production")
print("="*70)

# Test 1: Can we access the HTML page?
print("\n1. Testing HTML Page Access:")
try:
    response = requests.get(f"{BASE_URL}/#/worship", timeout=10)
    print(f"   Status: {response.status_code}")
    print(f"   ✅ Page loads" if response.status_code == 200 else f"   ❌ Failed")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Can we load JSON from relative path?
print("\n2. Testing JSON from /worship/data/worship_songs.json:")
try:
    response = requests.get(f"{BASE_URL}/worship/data/worship_songs.json", timeout=10)
    print(f"   Status: {response.status_code}")
    print(f"   Content-Type: {response.headers.get('content-type', 'N/A')}")
    if response.status_code == 200:
        if 'json' in response.headers.get('content-type', '').lower():
            data = response.json()
            print(f"   ✅ JSON loaded: {len(data)} songs")
        else:
            print(f"   ❌ Wrong content type (not JSON)")
            print(f"   First 200 chars: {response.text[:200]}")
    else:
        print(f"   ❌ Failed to load")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Can we load JSON from /worship-songs path?
print("\n3. Testing JSON from /worship-songs/data/worship_songs.json:")
try:
    response = requests.get(f"{BASE_URL}/worship-songs/data/worship_songs.json", timeout=10)
    print(f"   Status: {response.status_code}")
    print(f"   Content-Type: {response.headers.get('content-type', 'N/A')}")
    if response.status_code == 200:
        if 'json' in response.headers.get('content-type', '').lower():
            data = response.json()
            print(f"   ✅ JSON loaded: {len(data)} songs")
        else:
            print(f"   ❌ Wrong content type (not JSON)")
    else:
        print(f"   ❌ Failed to load")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 4: Check if dist folder has worship folder
print("\n4. Checking production server structure:")
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("samanabyar.online", 22, "root", "jIVeuzsrkoWPkhUY", timeout=10)

print("\n   a) Does /root/Mychurch/dist/worship exist?")
stdin, stdout, stderr = ssh.exec_command("test -L /root/Mychurch/dist/worship && echo 'SYMLINK' || test -d /root/Mychurch/dist/worship && echo 'DIRECTORY' || echo 'NOT FOUND'")
result = stdout.read().decode('utf-8').strip()
print(f"      {result}")

if result in ['SYMLINK', 'DIRECTORY']:
    print("\n   b) Contents of /root/Mychurch/dist/worship/data/:")
    stdin, stdout, stderr = ssh.exec_command("ls -lh /root/Mychurch/dist/worship/data/")
    print("      " + stdout.read().decode('utf-8').replace('\n', '\n      '))

print("\n   c) When was /root/Mychurch/dist last updated?")
stdin, stdout, stderr = ssh.exec_command("ls -lh /root/Mychurch/dist/index.html")
print("      " + stdout.read().decode('utf-8').strip())

ssh.close()

print("\n" + "="*70)
print("💡 Diagnosis:")
print("   If JSON from /worship-songs works but /worship doesn't:")
print("   → The production build doesn't have worship folder")
print("   → Need to rebuild and upload: npm run build + upload script")
print("="*70)
