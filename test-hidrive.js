const SftpClient = require('ssh2-sftp-client');

async function testHiDrive() {
  const client = new SftpClient();
  try {
    await client.connect({
      host: 'sftp.hidrive.ionos.com',
      port: 22,
      username: 'adminchurch',
      password: 'Iranian@1989'
    });
    
    console.log(' Connected to HiDrive');
    const files = await client.list('/users/adminchurch/mychurch/worship/audio');
    console.log(Found  files);
    console.log('First 5 files:');
    files.slice(0, 5).forEach(f => console.log(  - ));
    
    await client.end();
  } catch (error) {
    console.error(' Error:', error.message);
  }
}

testHiDrive();
