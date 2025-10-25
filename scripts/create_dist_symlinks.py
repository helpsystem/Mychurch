#!/usr/bin/env python3
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("samanabyar.online", 22, "root", "jIVeuzsrkoWPkhUY", timeout=10)

print("Creating symlinks for worship folders in /root/Mychurch/dist/...")
print("="*70)

# Create worship symlink
print("\n1. Creating worship symlink...")
stdin, stdout, stderr = ssh.exec_command("ln -s /var/www/mychurch-frontend/dist/worship /root/Mychurch/dist/worship")
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
if err and "File exists" not in err:
    print(f"   ⚠️  {err}")
else:
    print("   ✅ Symlink created: /root/Mychurch/dist/worship -> /var/www/mychurch-frontend/dist/worship")

# Create worship-songs symlink (for backward compatibility)
print("\n2. Creating worship-songs symlink...")
stdin, stdout, stderr = ssh.exec_command("ln -s /var/www/mychurch-frontend/dist/worship /root/Mychurch/dist/worship-songs")
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
if err and "File exists" not in err:
    print(f"   ⚠️  {err}")
else:
    print("   ✅ Symlink created: /root/Mychurch/dist/worship-songs -> /var/www/mychurch-frontend/dist/worship")

# Verify
print("\n3. Verifying symlinks...")
stdin, stdout, stderr = ssh.exec_command("ls -la /root/Mychurch/dist/ | grep worship")
result = stdout.read().decode('utf-8')
print(result)

# Test file access
print("\n4. Testing file access...")
stdin, stdout, stderr = ssh.exec_command("test -f /root/Mychurch/dist/worship/data/worship_songs.json && echo 'worship/data/worship_songs.json: ✅' || echo 'worship/data/worship_songs.json: ❌'")
print("   " + stdout.read().decode('utf-8').strip())

stdin, stdout, stderr = ssh.exec_command("test -f /root/Mychurch/dist/worship-songs/data/worship_songs.json && echo 'worship-songs/data/worship_songs.json: ✅' || echo 'worship-songs/data/worship_songs.json: ❌'")
print("   " + stdout.read().decode('utf-8').strip())

print("\n" + "="*70)
print("✅ Done! Now test:")
print("   https://samanabyar.online/worship/data/worship_songs.json")
print("   https://samanabyar.online/worship-songs/data/worship_songs.json")
print("="*70)

ssh.close()
