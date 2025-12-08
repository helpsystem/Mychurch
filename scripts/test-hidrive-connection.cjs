#!/usr/bin/env node

/**
 * 🔍 Test HiDrive Connection
 * بررسی اتصال به IONOS HiDrive
 */

require('dotenv').config({ path: './backend/.env' });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

async function testConnection() {
  console.log(`
${colors.cyan}${colors.bright}╔════════════════════════════════════════════╗
║      🔍 HiDrive Connection Test            ║
╚════════════════════════════════════════════╝${colors.reset}
`);

  // بررسی تنظیمات
  console.log(`${colors.cyan}📋 Configuration:${colors.reset}`);
  console.log(`   Host:     ${process.env.HIDRIVE_HOST || 'sftp.hidrive.ionos.com'}`);
  console.log(`   Port:     ${process.env.HIDRIVE_PORT || '22'}`);
  console.log(`   User:     ${process.env.HIDRIVE_USER || 'adminchurch'}`);
  console.log(`   Password: ${process.env.HIDRIVE_PASSWORD ? '✅ Set' : '❌ Not set'}`);
  console.log(`   Path:     ${process.env.HIDRIVE_BASE_PATH || '/users/adminchurch/mychurch'}`);
  console.log(`   URL:      ${process.env.HIDRIVE_PUBLIC_URL || 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch'}`);

  if (!process.env.HIDRIVE_PASSWORD) {
    console.log(`\n${colors.red}❌ HIDRIVE_PASSWORD is not set in backend/.env${colors.reset}`);
    console.log(`\n${colors.yellow}Please add to backend/.env:${colors.reset}`);
    console.log(`   HIDRIVE_PASSWORD=your_actual_password`);
    process.exit(1);
  }

  // تلاش برای اتصال
  console.log(`\n${colors.cyan}🔌 Connecting to HiDrive...${colors.reset}`);
  
  try {
    // Lazy load the service
    let hidriveService;
    
    // Try old service first
    try {
      hidriveService = require('../backend/services/hidriveStorage');
    } catch {
      // Try new service
      hidriveService = require('../backend/services/hidriveService');
    }

    await hidriveService.connect();
    console.log(`${colors.green}✅ Successfully connected to HiDrive!${colors.reset}`);

    // لیست فایل‌ها در root
    console.log(`\n${colors.cyan}📁 Listing root directory...${colors.reset}`);
    
    try {
      if (hidriveService.sftpClient && hidriveService.sftpClient.list) {
        const files = await hidriveService.sftpClient.list(
          process.env.HIDRIVE_BASE_PATH || '/users/adminchurch/mychurch'
        );
        
        console.log(`\n${colors.green}Found ${files.length} items:${colors.reset}`);
        files.slice(0, 10).forEach(file => {
          const icon = file.type === 'd' ? '📁' : '📄';
          const size = file.type === '-' ? `(${(file.size / 1024).toFixed(1)} KB)` : '';
          console.log(`   ${icon} ${file.name} ${size}`);
        });
        
        if (files.length > 10) {
          console.log(`   ${colors.yellow}... and ${files.length - 10} more${colors.reset}`);
        }
      }
    } catch (listError) {
      console.log(`${colors.yellow}⚠️  Could not list files: ${listError.message}${colors.reset}`);
    }

    await hidriveService.disconnect();
    console.log(`\n${colors.green}${colors.bright}✅ Connection test passed!${colors.reset}`);
    console.log(`\n${colors.cyan}You can now run:${colors.reset}`);
    console.log(`   node scripts/migrate-to-hidrive.cjs`);
    
    process.exit(0);
  } catch (error) {
    console.log(`\n${colors.red}❌ Connection failed!${colors.reset}`);
    console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
    
    console.log(`\n${colors.yellow}Troubleshooting:${colors.reset}`);
    console.log(`1. Check your password in backend/.env`);
    console.log(`2. Make sure ssh2-sftp-client is installed:`);
    console.log(`   npm install ssh2-sftp-client`);
    console.log(`3. Verify HiDrive credentials from IONOS dashboard`);
    console.log(`4. Check firewall/network settings`);
    
    process.exit(1);
  }
}

testConnection();
