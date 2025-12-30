import paramiko
import re
import requests

SERVER_HOST = "samanabyar.online"
SERVER_USER = "root"
SERVER_PASSWORD = "jIVeuzsrkoWPkhUY"

def check_live_deployment():
    print("=" * 60)
    print("🔍 Deep Investigation: Live Deployment Status")
    print("=" * 60)
    
    # Step 1: Download live index.html
    print("\n📥 Step 1: Downloading live index.html...")
    try:
        response = requests.get("https://samanabyar.online/", timeout=10)
        html_content = response.text
        
        # Find script tags
        script_matches = re.findall(r'<script[^>]+src="([^"]+)"', html_content)
        print(f"✅ Found {len(script_matches)} script tags")
        
        js_files = [s for s in script_matches if s.endswith('.js')]
        print(f"📦 JS files: {js_files[:3]}...")  # Show first 3
        
    except Exception as e:
        print(f"❌ Error downloading index.html: {e}")
        return
    
    # Step 2: Check if new content exists in JS files
    print("\n🔍 Step 2: Checking for new code in JS bundles...")
    search_terms = [
        "قابلیت‌های هوشمند",  # AI Capabilities in Persian
        "AI Capabilities",
        "Gemini Live Chat",
        "اولین پلتفرم هوشمند"  # First AI Platform
    ]
    
    found_new_code = False
    for js_file in js_files[:5]:  # Check first 5 JS files
        try:
            if not js_file.startswith('http'):
                js_url = f"https://samanabyar.online{js_file}"
            else:
                js_url = js_file
                
            print(f"\n   Checking: {js_file}")
            js_response = requests.get(js_url, timeout=10)
            js_content = js_response.text
            
            for term in search_terms:
                if term in js_content:
                    print(f"   ✅ FOUND: '{term}'")
                    found_new_code = True
                    break
            
            if found_new_code:
                break
                
        except Exception as e:
            print(f"   ⚠️ Couldn't check {js_file}: {e}")
    
    # Step 3: Check server files directly via SSH
    print("\n🔌 Step 3: Checking server files via SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER_HOST, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        
        # Check modification time of files
        stdin, stdout, stderr = ssh.exec_command("ls -lah /var/www/html/assets/*.js | head -n 5")
        output = stdout.read().decode('utf-8')
        print(f"📂 Server files (last modified):")
        print(output[:500])  # Show first 500 chars
        
        # Check index.html timestamp
        stdin, stdout, stderr = ssh.exec_command("stat /var/www/html/index.html")
        stat_output = stdout.read().decode('utf-8')
        print(f"\n📄 index.html timestamp:")
        print(stat_output[:300])
        
        ssh.close()
        
    except Exception as e:
        print(f"❌ SSH Error: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY:")
    print("=" * 60)
    if found_new_code:
        print("✅ New code EXISTS on server!")
        print("   → Problem is CLIENT-SIDE (Service Worker or cache)")
    else:
        print("❌ New code NOT FOUND on server!")
        print("   → Problem is DEPLOYMENT (files not uploaded correctly)")
    print("=" * 60)

if __name__ == "__main__":
    check_live_deployment()
