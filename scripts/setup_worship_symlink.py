#!/usr/bin/env python3
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("samanabyar.online", 22, "root", "jIVeuzsrkoWPkhUY", timeout=10)

print("Setting up worship-songs redirect:")
print("="*70)

commands = [
    # Backup old folder
    "mv /var/www/html/worship-songs /var/www/html/worship-songs.backup",
    
    # Create symlink to new location
    "ln -s /var/www/mychurch-frontend/dist/worship /var/www/html/worship-songs",
    
    # Verify
    "ls -la /var/www/html/ | grep worship",
    
    # Test if files are accessible
    "ls -la /var/www/html/worship-songs/data/ | head -5"
]

for cmd in commands:
    print(f"\n$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    output = stdout.read().decode('utf-8')
    error = stderr.read().decode('utf-8')
    
    if output:
        print(output)
    if error:
        print(f"Error: {error}")

ssh.close()

print("\n" + "="*70)
print("Done! Now test: https://samanabyar.online/worship-songs/data/worship_songs.json")
print("="*70)
