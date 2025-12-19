#!/usr/bin/env node

/**
 * Manual Deployment Script for samanabyar.online
 * Uses the credentials from backend/.env to deploy the built files
 */

require('dotenv').config({ path: './backend/.env' });
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration from backend/.env
const config = {
  host: process.env.SSH_HOST || '195.250.25.185',
  user: process.env.SSH_USER || 'root',
  password: process.env.SSH_PASS,
  remotePath: process.env.SSH_PROJECT_PATH || '/root/Mychurch/public',
  localPath: path.join(__dirname, 'dist')
};

console.log('🚀 Manual Deployment Script for samanabyar.online');
console.log('==============================================');
console.log(`📂 Local path: ${config.localPath}`);
console.log(`🌐 Remote host: ${config.user}@${config.host}`);
console.log(`📁 Remote path: ${config.remotePath}`);
console.log('');

if (!config.password) {
  console.error('❌ Error: SSH password not found in backend/.env');
  console.error('Please check SSH_PASS in backend/.env file');
  process.exit(1);
}

// Create a temporary script to run on the remote server
const remoteScript = `
echo "🔄 Starting deployment on server..."
cd ${config.remotePath}

# Create backup of current index.html if it exists
if [ -f "index.html" ]; then
    cp index.html index.html.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Created backup of index.html"
fi

# Clear the public directory except for backups and certain files
echo "🗑️  Cleaning up old files..."
find . -maxdepth 1 ! -name 'index.html.backup.*' ! -name 'backup' ! -name '.git' -exec rm -rf {} +

# Copy the new files (using tar for efficiency)
echo "📦 Extracting new files..."
tar -xzf /tmp/mychurch-dist.tar.gz

echo "✅ Deployment completed successfully!"
echo "🌐 Website should be available at: https://samanabyar.online/Mychurch/"
`;

try {
  console.log('📦 Creating archive of dist files...');
  const archivePath = 'mychurch-dist.tar.gz';
  
  // Create archive on local machine
  execSync(`cd ${config.localPath} && tar -czf ../${archivePath} .`, {
    stdio: 'inherit'
  });

  console.log('🔐 Creating SSH connection...');
  
  // Use PowerShell for SSH on Windows
  const sshCommand = `plink.exe -pw ${config.password} ${config.user}@${config.host} "mkdir -p /tmp && exit"`;
  execSync(sshCommand, { stdio: 'inherit' });

  console.log('📤 Uploading archive...');
  
  // Use PowerShell for SCP on Windows
  const scpCommand = `pscp.exe -pw ${config.password} "../${archivePath}" ${config.user}@${config.host}:/tmp/mychurch-dist.tar.gz`;
  execSync(scpCommand, { stdio: 'inherit' });

  console.log('🔄 Running deployment script on server...');
  
  // Run the deployment script
  const deployCommand = `plink.exe -pw ${config.password} ${config.user}@${config.host} "${remoteScript}"`;
  execSync(deployCommand, { stdio: 'inherit' });

  console.log('');
  console.log('🎉 Deployment completed successfully!');
  console.log('🌐 Website URL: https://samanabyar.online/Mychurch/');
  console.log('📊 Check the website to verify deployment');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.error('');
  console.error('🔍 Troubleshooting steps:');
  console.error('1. Check if SSH credentials are correct in backend/.env');
  console.error('2. Verify network connectivity to the server');
  console.error('3. Check if the remote directory exists');
  console.error('4. Ensure proper permissions on the server');
  process.exit(1);
}