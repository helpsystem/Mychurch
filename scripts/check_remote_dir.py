import paramiko

HOST = 'samanabyar.online'
USER = 'root'
PASS = 'jIVeuzsrkoWPkhUY'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print('Connecting...')
ssh.connect(HOST, username=USER, password=PASS)

print('\nChecking remote directories...')
stdin, stdout, stderr = ssh.exec_command('ls -la /var/www/samanabyar.online/frontend/dist/worship/data/timings/ | head -20')
output = stdout.read().decode()
error = stderr.read().decode()

if error:
    print('ERROR:', error)
if output:
    print(output)

print('\nChecking if directory exists...')
stdin, stdout, stderr = ssh.exec_command('test -d /var/www/samanabyar.online/frontend/dist/worship/data/timings && echo "EXISTS" || echo "NOT FOUND"')
result = stdout.read().decode().strip()
print(result)

if result == 'NOT FOUND':
    print('\nCreating directory...')
    ssh.exec_command('mkdir -p /var/www/samanabyar.online/frontend/dist/worship/data/timings')
    print('Created')

ssh.close()
