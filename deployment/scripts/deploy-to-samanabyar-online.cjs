
#!/usr/bin/env node

/**
 * MyChurch Deployment Script for samanabyar.online
 * 
 * This script automates the deployment process for the MyChurch project
 * on the samanabyar.online domain. It handles server setup, Docker installation,
 * database configuration, SSL setup, and complete deployment.
 * 
 * Usage:
 * node deploy-to-samanabyar-online.cjs [options]
 * 
 * Options:
 *   --host, -h        Server hostname/IP (required)
 *   --user, -u        SSH username (required)
 *   --key, -k         SSH private key path (required)
 *   --domain, -d      Domain name (required)
 *   --env, -e         Environment file path (optional)
 *   --backup          Create backup before deployment
 *   --test            Run comprehensive tests after deployment
 *   --verbose, -v     Verbose output
 *   --help, -h        Show help
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { promisify } = require('util');
const glob = require('glob');
const yaml = require('js-yaml');

// Configuration for samanabyar.online
const SAMANABYAR_CONFIG = {
  domain: 'samanabyar.online',
  apiDomain: 'api.samanabyar.online',
  adminEmail: 'admin@samanabyar.online',
  backupDir: '/var/backups/mychurch',
  logDir: '/var/log/mychurch',
  appDir: '/opt/mychurch',
  dockerDir: '/opt/mychurch/docker',
  nginxDir: '/etc/nginx/sites-available',
  sslDir: '/etc/nginx/ssl',
  
  // Database configuration
  db: {
    host: 'localhost',
    port: 5432,
    name: 'mychurch_prod',
    user: 'mychurch_admin',
    password: 'MyChurchSecureDB2024!',
    ssl: false
  },
  
  // Redis configuration
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'MyChurchSecureRedis2024!'
  },
  
  // Security configuration
  security: {
    jwtSecret: 'MyChurchSuperSecretJWTKey2024!LongRandomString',
    corsOrigin: 'https://samanabyar.online',
    apiKey: 'MyChurchSecureAPIKey2024!'
  },
  
  // Docker configuration
  docker: {
    network: 'mychurch-network',
    backendPort: 3002,
    frontendPort: 3001,
    dbPort: 5432,
    redisPort: 6379
  },
  
  // SSL configuration
  ssl: {
    certPath: '/etc/nginx/ssl/cert.pem',
    keyPath: '/etc/nginx/ssl/key.pem',
    letsencryptDir: '/etc/letsencrypt/live/samanabyar.online'
  }
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
};

const error = (message) => log(message, 'error');
const success = (message) => log(message, 'success');
const warning = (message) => log(message, 'warning');

// SSH connection management
class SSHConnection {
  constructor(host, user, keyPath, verbose = false) {
    this.host = host;
    this.user = user;
    this.keyPath = keyPath;
    this.verbose = verbose;
    this.connected = false;
  }

  async connect() {
    try {
      // Test SSH connection
      execSync(`ssh -i ${this.keyPath} -o StrictHostKeyChecking=no ${this.user}@${this.host} "echo 'SSH connection successful'"`);
      this.connected = true;
      success(`SSH connection established to ${this.host}`);
      return true;
    } catch (err) {
      error(`Failed to connect to ${this.host}: ${err.message}`);
      return false;
    }
  }

  async execute(command, options = {}) {
    if (!this.connected) {
      error('Not connected to SSH');
      return null;
    }

    const sshCommand = `ssh -i ${this.keyPath} -o StrictHostKeyChecking=no ${this.user}@${this.host} "${command}"`;
    
    try {
      if (this.verbose) {
        log(`Executing: ${sshCommand}`);
      }
      
      const result = execSync(sshCommand, { 
        encoding: 'utf8',
        timeout: options.timeout || 30000,
        maxBuffer: options.maxBuffer || 1024 * 1024
      });
      
      if (this.verbose) {
        log(`Command output: ${result.trim()}`);
      }
      
      return result;
    } catch (err) {
      error(`Command failed: ${command}`);
      error(`Error: ${err.message}`);
      if (this.verbose) {
        error(`Stderr: ${err.stderr}`);
      }
      return null;
    }
  }

  async upload(localPath, remotePath) {
    if (!this.connected) {
      error('Not connected to SSH');
      return false;
    }

    const scpCommand = `scp -i ${this.keyPath} -o StrictHostKeyChecking=no ${localPath} ${this.user}@${this.host}:${remotePath}`;
    
    try {
      if (this.verbose) {
        log(`Uploading: ${localPath} -> ${remotePath}`);
      }
      
      execSync(scpCommand);
      success(`Uploaded ${localPath} to ${remotePath}`);
      return true;
    } catch (err) {
      error(`Failed to upload ${localPath}: ${err.message}`);
      return false;
    }
  }

  async download(remotePath, localPath) {
    if (!this.connected) {
      error('Not connected to SSH');
      return false;
    }

    const scpCommand = `scp -i ${this.keyPath} -o StrictHostKeyChecking=no ${this.user}@${this.host}:${remotePath} ${localPath}`;
    
    try {
      if (this.verbose) {
        log(`Downloading: ${remotePath} -> ${localPath}`);
      }
      
      execSync(scpCommand);
      success(`Downloaded ${remotePath} to ${localPath}`);
      return true;
    } catch (err) {
      error(`Failed to download ${remotePath}: ${err.message}`);
      return false;
    }
  }
}

// Deployment manager
class DeploymentManager {
  constructor(options) {
    this.host = options.host;
    this.user = options.user;
    this.keyPath = options.keyPath;
    this.domain = options.domain;
    this.envFile = options.envFile;
    this.backup = options.backup;
    this.test = options.test;
    this.verbose = options.verbose;
    
    this.ssh = new SSHConnection(this.host, this.user, this.keyPath, this.verbose);
    this.config = { ...SAMANABYAR_CONFIG, domain: this.domain };
  }

  async deploy() {
    try {
      log('Starting deployment process for samanabyar.online...');
      
      // Step 1: Connect to server
      if (!(await this.ssh.connect())) {
        error('Failed to connect to server');
        return false;
      }

      // Step 2: Create backup if requested
      if (this.backup) {
        if (!(await this.createBackup())) {
          error('Failed to create backup');
          return false;
        }
      }

      // Step 3: Update system and install dependencies
      if (!(await this.updateSystem())) {
        error('Failed to update system');
        return false;
      }

      // Step 4: Install Docker and Docker Compose
      if (!(await this.installDocker())) {
        error('Failed to install Docker');
        return false;
      }

      // Step 5: Setup directories
      if (!(await this.setupDirectories())) {
        error('Failed to setup directories');
        return false;
      }

      // Step 6: Install and configure PostgreSQL
      if (!(await this.setupPostgreSQL())) {
        error('Failed to setup PostgreSQL');
        return false;
      }

      // Step 7: Install and configure Redis
      if (!(await this.setupRedis())) {
        error('Failed to setup Redis');
        return false;
      }

      // Step 8: Setup SSL certificates
      if (!(await this.setupSSL())) {
        error('Failed to setup SSL certificates');
        return false;
      }

      // Step 9: Deploy Docker containers
      if (!(await this.deployDocker())) {
        error('Failed to deploy Docker containers');
        return false;
      }

      // Step 10: Setup Nginx
      if (!(await this.setupNginx())) {
        error('Failed to setup Nginx');
        return false;
      }

      // Step 11: Run tests if requested
      if (this.test) {
        if (!(await this.runTests())) {
          error('Some tests failed');
          return false;
        }
      }

      success('Deployment completed successfully!');
      await this.printDeploymentInfo();
      return true;

    } catch (err) {
      error(`Deployment failed: ${err.message}`);
      return false;
    }
  }

  async createBackup() {
    log('Creating backup...');
    
    // Create backup directory
    await this.ssh.execute(`mkdir -p ${this.config.backupDir}`);
    
    // Create backup script
    const backupScript = `#!/bin/bash
# Backup script for samanabyar.online
BACKUP_DIR="${this.config.backupDir}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.tar.gz"

echo "Creating backup at $BACKUP_FILE"

# Create backup directory structure
mkdir -p "$BACKUP_DIR"

# Backup application files
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" -C /opt mychurch 2>/dev/null || echo "Warning: App backup failed"

# Backup database
docker exec mychurch-postgres pg_dump -U ${this.config.db.user} ${this.config.db.name} > "$BACKUP_DIR/db_$DATE.sql" 2>/dev/null || echo "Warning: Database backup failed"

# Backup configuration files
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" -C /etc nginx 2>/dev/null || echo "Warning: Config backup failed"

# Create combined backup
tar -czf "$BACKUP_FILE" -C "$BACKUP_DIR" app_$DATE.tar.gz db_$DATE.sql config_$DATE.tar.gz 2>/dev/null || echo "Warning: Combined backup failed"

# Clean up individual files
rm -f "$BACKUP_DIR/app_$DATE.tar.gz" "$BACKUP_DIR/db_$DATE.sql" "$BACKUP_DIR/config_$DATE.tar.gz"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
ls -la "$BACKUP_DIR/backup_*.tar.gz"
`;

    // Upload backup script
    const backupScriptPath = '/tmp/backup.sh';
    await this.ssh.uploadContent(backupScript, backupScriptPath);
    
    // Make script executable
    await this.ssh.execute(`chmod +x ${backupScriptPath}`);
    
    // Run backup
    await this.ssh.execute(backupScriptPath);
    
    success('Backup created successfully');
    return true;
  }

  async updateSystem() {
    log('Updating system packages...');
    
    // Update package lists
    await this.ssh.execute('apt-get update');
    
    // Upgrade packages
    await this.ssh.execute('apt-get upgrade -y');
    
    // Install essential packages
    const packages = [
      'curl',
      'wget',
      'git',
      'unzip',
      'htop',
      'ufw',
      'certbot',
      'python3-certbot-nginx',
      'nginx',
      'postgresql',
      'redis-server'
    ];
    
