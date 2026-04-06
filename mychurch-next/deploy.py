import os
import subprocess
import zipfile

def run_cmd(cmd):
    print(f"🚀 Running: {cmd}")
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0:
        print(f"❌ Command failed with exit code {result.returncode}")
        exit(1)

def zipdir(path, ziph):
    for root, dirs, files in os.walk(path):
        # Ignore Next.js dev and cache folders to prevent recursive symlink bugs
        if 'dev' in root.split(os.sep) or 'cache' in root.split(os.sep):
            continue
        for file in files:
            file_path = os.path.join(root, file)
            try:
                ziph.write(file_path, os.path.relpath(file_path, os.path.join(path, '..')))
            except FileNotFoundError:
                pass

print("\n--- Next.js 1-Click Deploy Script ---")

print("\n🛡️ STEP 0: Running local Audio KPI gate...")
run_cmd('"d:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/mychurch-next/Bible/.venv/Scripts/python.exe" scripts/check_audio_kpis.py')
run_cmd('"d:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/mychurch-next/Bible/.venv/Scripts/python.exe" scripts/audio_kpi_brief.py --lang fa --output Bible/bible_output/audio_kpi_brief.txt')

print("\n📦 STEP 1: Building Next.js production bundle...")
run_cmd("npm run build")

print("\n🗜️ STEP 2: Zipping the build safely...")
try:
    zipf = zipfile.ZipFile('next_build.zip', 'w', zipfile.ZIP_DEFLATED)
    zipdir('.next', zipf)
    zipf.close()
    print("✅ Build zipped successfully.")
except Exception as e:
    print(f"❌ Zip failed: {e}")
    exit(1)

print("\n📤 STEP 3: Uploading Next.js build and sql.js WASM to VPS...")
run_cmd("scp next_build.zip root@samanabyar.online:/root/mychurch-v2/mychurch-next/")
run_cmd("scp -r public/wasm root@samanabyar.online:/root/mychurch-v2/mychurch-next/public/")

print("\n🔄 STEP 4: Extracting and Restarting PM2 Server...")
run_cmd('ssh root@samanabyar.online "cd /root/mychurch-v2/mychurch-next/ && unzip -o next_build.zip && pm2 restart mychurch-next"')

print("\n📣 STEP 5: Sending optional KPI notification (Slack/Telegram)...")
notify_cmd = '"d:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/mychurch-next/Bible/.venv/Scripts/python.exe" scripts/send_audio_kpi_notification.py --text-file Bible/bible_output/audio_kpi_brief.txt'
result = subprocess.run(notify_cmd, shell=True)
if result.returncode != 0:
    print("⚠️ Notification step reported an issue (deployment continues).")

print("\n🎉 DEPLOYMENT COMPLETE! The Live Site has been updated without any PowerShell errors.")
