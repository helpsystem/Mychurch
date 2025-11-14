const SftpClient = require('ssh2-sftp-client');

async function testHiDrive() {
  const client = new SftpClient();
  try {
    console.log('🔄 Connecting to HiDrive...');
    await client.connect({
      host: 'sftp.hidrive.ionos.com',
      port: 22,
      username: 'adminchurch',
      password: 'Iranian@1989',
      readyTimeout: 15000
    });
    
    console.log('✅ Connected to HiDrive');
    const files = await client.list('/users/adminchurch/mychurch/worship/audio');
    console.log(`\nFound ${files.length} files on HiDrive`);
    console.log('\nFirst 10 files:');
    files.slice(0, 10).forEach((f, i) => {
      console.log(`  ${i+1}. ${f.name} (${Math.round(f.size/1024/1024*100)/100} MB)`);
    });
    
    await client.end();
    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testHiDrive();
