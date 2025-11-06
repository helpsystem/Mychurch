#!/usr/bin/env node

/**
 * MyChurch Production Deployment Script
 * Automated deployment to remote production server
 * 
 * Usage:
 *   node deploy-to-production.cjs [options]
 * 
 * Options:
 *   --host <host>        Remote server hostname or IP
 *   --user <user>        SSH username
 *   --key <path>         SSH private key path
 *   --domain <domain>    Domain name for the website
 *   --env <path>         Environment file path
 *   --docker <path>      Docker compose file path
 *   --backup             Create backup before deployment
 *   --test               Run tests after deployment
 *   --help               Show help
 * 
 * Examples:
 *   node deploy-to-production.cjs --host 192.168.1.100 --user root --key ~/.ssh/id_rsa --domain mychurch.com
 *   node deploy-to-production.cjs --host server.com --user deploy --key ~/.ssh/deploy_key --domain mychurch.com --backup --test
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = require('glob');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const config = {
  // Remote server configuration
  server: {
    host: process.env.REMOTE_HOST || '',
    user: process.env.REMOTE_USER || 'root',
    key: process.env.REMOTE_KEY || process.env.HOME + '/.ssh/id_rsa',
    port: process.env.REMOTE_PORT || 22,
    deployPath: '/opt/mychurch',
    backupPath: '/var/backups/mychurch',
    logPath: '/var/log/mychurch'
  },

  // Application configuration
  app: {
    name: 'MyChurch',
    version: '1.0.0',
    domain: process.env.REMOTE_DOMAIN || 'mychurch.com',
    apiDomain: process.env.REMOTE_API_DOMAIN || 'api.mychurch.com'
  },

  // Docker configuration
  docker: {
    composeFile: 'docker-compose.prod.yml',
    imageName: 'mychurch-frontend-prod',
    containerName: 'mychurch-frontend-prod'
  },

  // SSL configuration
  ssl: {
    certPath: '/etc/nginx/ssl/cert.pem',
    keyPath: '/etc/nginx/ssl/key.pem',
    certbotEmail: process.env.CERTBOT_EMAIL || 'admin@mychurch.com'
  },

  // Backup configuration
  backup: {
    enabled: process.env.BACKUP_BEFORE_DEPLOY === 'true',
    keepDays: 30
  },

  // Testing configuration
  test: {
    enabled: process.env.TEST_AFTER_DEPLOY === 'true',
    endpoints: [
      'https://' + process.env.REMOTE_DOMAIN + '/api/health',
      'https://' + process.env.REMOTE_API_DOMAIN + '/api/health',
      'https://' + process.env.REMOTE_DOMAIN + '/',
      'https://' + process.env.REMOTE_API_DOMAIN + '/'
    ]
  }
};

// Utility functions
const log = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  error: (message) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`),
  debug: (message) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`);
    }
  }
};

// SSH command execution
const sshExec = async (command, options = {}) => {
  try {
    const sshCommand = `ssh -i ${config.server.key} -p ${config.server.port} ${config.server.user}@${config.server.host} "${command}"`;
    log.debug(`Executing SSH command: ${sshCommand}`);
    return execSync(sshCommand, { ...options, stdio: 'inherit' });
  } catch (error) {
    log.error(`SSH command failed: ${command}`);
    throw error;
  }
};

// SCP file transfer
const scpUpload = async (localPath, remotePath) => {
  try {
    const scpCommand = `scp -i ${config.server.key} -P ${config.server.port} ${localPath} ${config.server.user}@${config.server.host}:${remotePath}`;
    log.debug(`Executing SCP command: ${scpCommand}`);
    execSync(scpCommand, { stdio: 'inherit' });
    log.info(`File uploaded successfully: ${localPath} -> ${remotePath}`);
  } catch (error) {
    log.error(`SCP upload failed: ${localPath} -> ${remotePath}`);
    throw error;
  }
};

// Check if remote server is accessible
const checkServerConnection = async () => {
  try {
    log.info('Checking server connection...');
    await sshExec('echo "Server connection successful"');
    log.info('Server connection verified');
    return true;
  } catch (error) {
    log.error('Failed to connect to server');
    throw error;
  }
};

// Install Docker and Docker Compose on remote server
const installDocker = async () => {
  try {
    log.info('Installing Docker and Docker Compose...');
    
    // Update system
    await sshExec('apt-get update');
    
    // Install prerequisites
    await sshExec('apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release');
    
    // Add Docker official GPG key
    await sshExec('curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg');
    
    // Add Docker repository
    await sshExec('echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null');
    
    // Install Docker
    await sshExec('apt-get update');
    await sshExec('apt-get install -y docker-ce docker-ce-cli containerd.io');
    
    // Install Docker Compose
    await sshExec('curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose');
    await sshExec('chmod +x /usr/local/bin/docker-compose');
    
    // Add user to docker group
    await sshExec(`usermod -aG docker ${config.server.user}`);
    
    // Enable Docker service
    await sshExec('systemctl enable docker');
    await sshExec('systemctl start docker');
    
    log.info('Docker and Docker Compose installed successfully');
  } catch (error) {
    log.error('Failed to install Docker');
    throw error;
  }
};

// Create deployment directory structure
const setupDirectories = async () => {
  try {
    log.info('Setting up deployment directories...');
    
    const commands = [
      `mkdir -p ${config.server.deployPath}`,
      `mkdir -p ${config.server.backupPath}`,
      `mkdir -p ${config.server.logPath}`,
      `mkdir -p ${config.server.deployPath}/docker`,
      `mkdir -p ${config.server.deployPath}/config`,
      `mkdir -p ${config.server.deployPath}/logs`,
      `mkdir -p ${config.server.deployPath}/backups`,
      `mkdir -p /etc/nginx/ssl`,
      `chown -R ${config.server.user}:${config.server.user} ${config.server.deployPath}`,
      `chmod -R 755 ${config.server.deployPath}`
    ];
    
    for (const command of commands) {
      await sshExec(command);
    }
    
    log.info('Directories created successfully');
  } catch (error) {
    log.error('Failed to create directories');
    throw error;
  }
};

// Upload application files
const uploadApplicationFiles = async () => {
  try {
    log.info('Uploading application files...');
    
    // Upload Docker compose file
    await scpUpload('docker-compose.prod.yml', `${config.server.deployPath}/docker-compose.yml`);
    
    // Upload Dockerfile
    await scpUpload('Dockerfile.frontend.prod', `${config.server.deployPath}/docker/`);
    
    // Upload SSL generation script
    await scpUpload('docker/nginx/ssl/generate-ssl.sh', `${config.server.deployPath}/docker/`);
    
    // Upload backup system
    await scpUpload('backup-system.cjs', `${config.server.deployPath}/`);
    
    // Upload database initialization script
    await scpUpload('docker/postgres/init-db-prod.sql', `${config.server.deployPath}/docker/`);
    
    // Upload nginx configuration
    await scpUpload('docker/nginx/nginx.conf', `${config.server.deployPath}/docker/`);
    
    // Upload environment file
    const envFile = process.argv.includes('--env') ? 
      process.argv[process.argv.indexOf('--env') + 1] : 
      '.env';
    await scpUpload(envFile, `${config.server.deployPath}/.env`);
    
    log.info('Application files uploaded successfully');
  } catch (error) {
    log.error('Failed to upload application files');
    throw error;
  }
};

// Create production environment file
const createProductionEnv = async () => {
  try {
    log.info('Creating production environment file...');
    
    const envContent = `
# Production Environment Configuration
NODE_ENV=production
PORT=3001
VITE_API_URL=https://${config.app.apiDomain}
VITE_APP_NAME=${config.app.name}
VITE_APP_VERSION=${config.app.version}

# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=mychurch_prod
POSTGRES_USER=mychurch_admin
POSTGRES_PASSWORD=MyChurchSecureDB2024!

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=MyChurchSecureRedis2024!

# Security Configuration
JWT_SECRET=MyChurchSuperSecretJWTKey2024!LongRandomString
CORS_ORIGIN=https://${config.app.domain}
API_KEY=MyChurchSecureAPIKey2024!

# AI Services Configuration
GOOGLE_API_KEY=${process.env.GOOGLE_API_KEY}
GEMINI_API_KEY=${process.env.GEMINI_API_KEY}
HF_API_KEY=${process.env.HF_API_KEY}

# FTP Configuration
FTP_HOST=ftp.${config.app.domain}
FTP_USER=mychurch_ftp
FTP_PASS=MyChurchSecureFTP2024!
FTP_PORT=21

# SSL Configuration
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem

# Backup Configuration
BACKUP_DIR=${config.server.backupPath}
COMPRESS_BACKUPS=true
ENCRYPT_BACKUPS=true
ENCRYPTION_PASSWORD=MyChurchSecureBackup2024!

# Logging Configuration
LOG_LEVEL=info
LOG_DIR=${config.server.logPath}
`;
    
    // Write environment file
    fs.writeFileSync('.env.production', envContent);
    
    // Upload production environment file
    await scpUpload('.env.production', `${config.server.deployPath}/.env.production`);
    
    // Clean up
    fs.unlinkSync('.env.production');
    
    log.info('Production environment file created successfully');
  } catch (error) {
    log.error('Failed to create production environment file');
    throw error;
  }
};

// Install and setup PostgreSQL
const setupPostgreSQL = async () => {
  try {
    log.info('Setting up PostgreSQL...');
    
    // Install PostgreSQL
    await sshExec('apt-get install -y postgresql postgresql-contrib');
    
    // Create PostgreSQL user and database
    const sqlCommands = `
      CREATE USER mychurch_admin WITH PASSWORD 'MyChurchSecureDB2024!';
      CREATE DATABASE mychurch_prod OWNER mychurch_admin;
      GRANT ALL PRIVILEGES ON DATABASE mychurch_prod TO mychurch_admin;
      \q
    `;
    
    await sshExec(`psql -c "${sqlCommands.replace(/\n/g, ' ')}"`);
    
    // Initialize database
    await sshExec(`psql -U mychurch_admin -d mychurch_prod -f ${config.server.deployPath}/docker/init-db-prod.sql`);
    
    log.info('PostgreSQL setup completed');
  } catch (error) {
    log.error('Failed to setup PostgreSQL');
    throw error;
  }
};

// Setup SSL certificates
const setupSSL = async () => {
  try {
    log.info('Setting up SSL certificates...');
    
    // Install Certbot
    await sshExec('apt-get install -y certbot python3-certbot-nginx');
    
    // Obtain SSL certificate
    const certbotCommand = `certbot certonly --standalone -d ${config.app.domain} -d ${config.app.apiDomain} --email ${config.ssl.certbotEmail} --agree-tos --non-interactive`;
    await sshExec(certbotCommand);
    
    // Copy certificates to nginx ssl directory
    await sshExec(`cp /etc/letsencrypt/live/${config.app.domain}/fullchain.pem /etc/nginx/ssl/cert.pem`);
    await sshExec(`cp /etc/letsencrypt/live/${config.app.domain}/privkey.pem /etc/nginx/ssl/key.pem`);
    
    // Set proper permissions
    await sshExec('chmod 600 /etc/nginx/ssl/cert.pem');
    await sshExec('chmod 600 /etc/nginx/ssl/key.pem');
    
    // Setup certificate renewal
    const renewalCommand = `0 2 * * * /usr/bin/certbot renew --quiet --post-hook "systemctl restart nginx"`;
    await sshExec(`(crontab -l 2>/dev/null; echo "${renewalCommand}") | crontab -`);
    
    log.info('SSL certificates setup completed');
  } catch (error) {
    log.error('Failed to setup SSL certificates');
    throw error;
  }
};

// Deploy Docker containers
const deployDocker = async () => {
  try {
    log.info('Deploying Docker containers...');
    
    // Navigate to deployment directory
    await sshExec(`cd ${config.server.deployPath}`);
    
    // Stop existing containers
    await sshExec('docker-compose down');
    
    // Build new images
    await sshExec('docker-compose build --no-cache');
    
    // Start services
    await sshExec('docker-compose up -d');
    
    // Check service status
    await sshExec('docker-compose ps');
    
    log.info('Docker containers deployed successfully');
  } catch (error) {
    log.error('Failed to deploy Docker containers');
    throw error;
  }
};

// Test deployment
const testDeployment = async () => {
  try {
    log.info('Testing deployment...');
    
    const testResults = [];
    
    for (const endpoint of config.test.endpoints) {
      try {
        const testCommand = `curl -s -o /dev/null -w "%{http_code}" ${endpoint}`;
        const response = await sshExec(testCommand);
        
        if (response === '200') {
          log.info(`✅ Test passed: ${endpoint}`);
          testResults.push({ endpoint, status: 'passed' });
        } else {
          log.warn(`❌ Test failed: ${endpoint} - Status: ${response}`);
          testResults.push({ endpoint, status: 'failed', code: response });
        }
      } catch (error) {
        log.error(`❌ Test error: ${endpoint} - ${error.message}`);
        testResults.push({ endpoint, status: 'error', message: error.message });
      }
    }
    
    // Check Docker containers
    const containers = await sshExec('docker-compose ps');
    log.info('Docker containers status:');
    console.log(containers.toString());
    
    // Check database connectivity
    const dbTest = await sshExec('docker-compose exec postgres psql -U mychurch_admin -d mychurch_prod -c "SELECT 1;"');
    log.info('Database connectivity test passed');
    
    // Check SSL certificate
    const sslTest = await sshExec(`echo | openssl s_client -connect ${config.app.domain}:443 -servername ${config.app.domain} 2>/dev/null | openssl x509 -noout -dates`);
    log.info('SSL certificate test passed');
    console.log(sslTest.toString());
    
    log.info('Deployment testing completed');
    return testResults;
  } catch (error) {
    log.error('Deployment testing failed');
    throw error;
  }
};

// Create backup before deployment
const createBackup = async () => {
  try {
    log.info('Creating backup before deployment...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = `${config.server.backupPath}/pre-deploy-${timestamp}.tar.gz`;
    
    // Create backup
    await sshExec(`cd ${config.server.deployPath} && tar -czf ${backupFile} .`);
    
    // Verify backup
    const backupSize = await sshExec(`du -sh ${backupFile}`);
    log.info(`Backup created: ${backupFile}`);
    log.info(`Backup size: ${backupSize.toString().trim()}`);
    
    return backupFile;
  } catch (error) {
    log.error('Failed to create backup');
    throw error;
  }
};

// Main deployment function
const deploy = async () => {
  try {
    log.info('Starting deployment process...');
    
    // Parse command line arguments
    const options = {
      host: null,
      user: null,
      key: null,
      domain: null,
      env: null,
      docker: null,
      backup: false,
      test: false
    };
    
    for (let i = 0; i < process.argv.length; i++) {
      switch (process.argv[i]) {
        case '--host':
          options.host = process.argv[++i];
          break;
        case '--user':
          options.user = process.argv[++i];
          break;
        case '--key':
          options.key = process.argv[++i];
          break;
        case '--domain':
          options.domain = process.argv[++i];
          break;
        case '--env':
          options.env = process.argv[++i];
          break;
        case '--docker':
          options.docker = process.argv[++i];
          break;
        case '--backup':
          options.backup = true;
          break;
        case '--test':
          options.test = true;
          break;
        case '--help':
          console.log(`
MyChurch Production Deployment Script

Usage: node deploy-to-production.cjs [options]

Options:
  --host <host>        Remote server hostname or IP
  --user <user>        SSH username
  --key <path>         SSH private key path
  --domain <domain>    Domain name for the website
  --env <path>         Environment file path
  --docker <path>      Docker compose file path
  --backup             Create backup before deployment
  --test               Run tests after deployment
  --help               Show help

Examples:
  node deploy-to-production.cjs --host 192.168.1.100 --user root --key ~/.ssh/id_rsa --domain mychurch.com
  node deploy-to-production.cjs --host server.com --user deploy --key ~/.ssh/deploy_key --domain mychurch.com --backup --test
          `);
          process.exit(0);
      }
    }
    
    // Update configuration with options
    if (options.host) config.server.host = options.host;
    if (options.user) config.server.user = options.user;
    if (options.key) config.server.key = options.key;
    if (options.domain) config.app.domain = options.domain;
    if (options.env) config.docker.composeFile = options.env;
    if (options.docker) config.docker.composeFile = options.docker;
    if (options.backup) config.backup.enabled = true;
    if (options.test) config.test.enabled = true;
    
    // Validate required parameters
    if (!config.server.host) {
      throw new Error('Remote server host is required. Use --host option.');
    }
    
    if (!config.server.user) {
      throw new Error('SSH username is required. Use --user option.');
    }
    
    if (!config.server.key) {
      throw new Error('SSH private key path is required. Use --key option.');
    }
    
    if (!config.app.domain) {
      throw new Error('Domain name is required. Use --domain option.');
    }
    
    log.info(`Deploying ${config.app.name} v${config.app.version} to ${config.server.user}@${config.server.host}`);
    log.info(`Domain: ${config.app.domain}`);
    log.info(`API Domain: ${config.app.apiDomain}`);
    
    // Step 1: Check server connection
    await checkServerConnection();
    
    // Step 2: Create backup if enabled
    if (config.backup.enabled) {
      await createBackup();
    }
    
    // Step 3: Install Docker
    await installDocker();
    
    // Step 4: Setup directories
    await setupDirectories();
    
    // Step 5: Upload application files
    await uploadApplicationFiles();
    
    // Step 6: Create production environment
    await createProductionEnv();
    
    // Step 7: Setup PostgreSQL
    await setupPostgreSQL();
    
    // Step 8: Setup SSL certificates
    await setupSSL();
    
    // Step 9: Deploy Docker containers
    await deployDocker();
    
    // Step 10: Test deployment
    if (config.test.enabled) {
      const testResults = await testDeployment();
      
      // Print test summary
      console.log('\n=== Deployment Test Summary ===');
      testResults.forEach(result => {
        const status = result.status === 'passed' ? '✅' : '❌';
        console.log(`${status} ${result.endpoint} - ${result.status}`);
      });
      
      // Check if all tests passed
      const allPassed = testResults.every(result => result.status === 'passed');
      if (!allPassed) {
        throw new Error('Some tests failed');
      }
    }
    
    log.info('🎉 Deployment completed successfully!');
    log.info(`Website URL: https://${config.app.domain}`);
    log.info(`API URL: https://${config.app.apiDomain}`);
    log.info(`Admin credentials: admin@mychurch.com / MyChurchSecureAdmin2024!`);
    
  } catch (error) {
    log.error(`❌ Deployment failed: ${error.message}`);
    process.exit(1);
  }
};

// If this file is run directly, execute deployment
if (require.main === module) {
  deploy();
}

module.exports = {
  deploy,
  checkServerConnection,
  installDocker,
  setupDirectories,
  uploadApplicationFiles,
  createProductionEnv,
  setupPostgreSQL,
  setupSSL,
  deployDocker,
  testDeployment,
  createBackup
};