import paramiko
import os

HOST = 'samanabyar.online'
USER = 'root'
PASS = 'jIVeuzsrkoWPkhUY'
LOCAL = r'D:\Windows.old\Users\Sami\Desktop\Iran Church DC\Git\Mychurch\frontend\public\worship\data\timings\song_335_timing.json'
REMOTE = '/var/www/samanabyar.online/frontend/dist/worship/data/timings/song_335_timing.json'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print('Connecting...')
ssh.connect(HOST, username=USER, password=PASS, timeout=30)
print('Connected')

sftp = ssh.open_sftp()
print('Uploading...')
sftp.put(LOCAL, REMOTE)
print('Done. Size:', sftp.stat(REMOTE).st_size)

sftp.close()
ssh.close()
