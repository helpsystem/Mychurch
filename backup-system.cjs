#!/usr/bin/env node

/**
 * MyChurch Production Backup System
 * Automated backup solution for database, files, and configuration
 * 
 * Usage:
 *   node backup-system.cjs [options]
 * 
 * Options:
 *   --type <type>        Backup type: full, database, files, config (default: full)
 *   --destination <path>  Backup destination directory
 *   --compress           Enable compression
 *   --encrypt            Enable encryption
 *   --schedule <cron>    Schedule backup (cron format)
 *   --cleanup            Clean old backups
 *   --verify             Verify backup integrity
 *   --help               Show help
 * 
 * Examples:
 *   node backup-system.cjs --type full --compress --encrypt
 *   node backup-system.cjs --type database --destination /backups
 *   node backup-system.cjs --schedule "0 2 * * *" --cleanup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');
const archiver = require('archiver');
const { promisify } = require('util');
const glob = require('glob');
const schedule = require('node-schedule');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const config = {
  // Database configuration
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'mychurch_prod',
    username: process.env.POSTGRES_USER || 'mychurch_admin',
    password: process.env.POSTGRES_PASSWORD || 'MyChurchSecureDB2024!',
    backupDir: process.env.BACKUP_DIR || './backups'
  },

  // Files configuration
  files: {
    sourceDirs: [
      './public',
      './uploads',
      './config',
      './logs'
    ],
    excludePatterns: [
      '**/*.tmp',
      '**/*.log',
      '**/node_modules/**',
      '**/.git/**',
      '**/backups/**'
    ]
  },

  // Backup retention
  retention: {
    full: 30,      // Keep 30 days of full backups
    database: 90,  // Keep 90 days of database backups
    files: 60,     // Keep 60 days of file backups
    config: 180    // Keep 180 days of config backups
  },

  // Compression
  compression: {
    enabled: process.env.COMPRESS_BACKUPS === 'true',
    format: 'zip' // zip, tar, gz
  },

  // Encryption
  encryption: {
    enabled: process.env.ENCRYPT_BACKUPS === 'true',
    algorithm: 'aes-256-cbc',
    password: process.env.ENCRYPTION_PASSWORD || process.env.JWT_SECRET || 'MyChurchSecureBackup2024!'
  },

  // Logging
  logging: {
    enabled: true,
    file: './logs/backup.log',
    level: 'info' // debug, info, warn, error
  }
};

// Utility functions
const log = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
  error: (message) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`),
  debug: (message) => {
    if (config.logging.level === 'debug') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`);
    }
  }
};

// Ensure backup directory exists
const ensureBackupDir = () => {
  const backupDir = config.database.backupDir;
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    log.info(`Created backup directory: ${backupDir}`);
  }
};

// Generate timestamp
const getTimestamp = () => {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
};

// Clean old backups
const cleanupOldBackups = (type) => {
  const retentionDays = config.retention[type];
  if (!retentionDays) {
    log.warn(`No retention policy defined for backup type: ${type}`);
    return;
  }

  const backupDir = config.database.backupDir;
  const files = fs.readdirSync(backupDir);
  const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));

  let cleanedCount = 0;
  files.forEach(file => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile() && stats.birthtime < cutoffDate) {
      // Check if file matches the backup type
      if (type === 'full' || file.includes(type)) {
        fs.unlinkSync(filePath);
        log.info(`Cleaned old backup: ${file}`);
        cleanedCount++;
      }
    }
  });

  log.info(`Cleaned ${cleanedCount} old ${type} backups`);
  return cleanedCount;
};

// Database backup
const backupDatabase = async () => {
  try {
    ensureBackupDir();
    
    const timestamp = getTimestamp();
    const backupFile = path.join(config.database.backupDir, `database-${timestamp}.sql`);
    const compressedFile = config.compression.enabled ? 
      path.join(config.database.backupDir, `database-${timestamp}.${config.compression.format}`) : 
      backupFile;

    log.info('Starting database backup...');

    // Create database dump
    const pgDumpCommand = `PGPASSWORD="${config.database.password}" pg_dump -h ${config.database.host} -p ${config.database.port} -U ${config.database.username} -d ${config.database.database} -f ${backupFile}`;
    execSync(pgDumpCommand, { stdio: 'inherit' });

    // Compress if enabled
    if (config.compression.enabled) {
      await compressFile(backupFile, compressedFile);
      fs.unlinkSync(backupFile);
      log.info(`Database backup compressed: ${compressedFile}`);
    } else {
      log.info(`Database backup created: ${backupFile}`);
    }

    // Encrypt if enabled
    if (config.encryption.enabled) {
      const encryptedFile = compressedFile + '.enc';
      await encryptFile(compressedFile, encryptedFile);
      fs.unlinkSync(compressedFile);
      log.info(`Database backup encrypted: ${encryptedFile}`);
      return encryptedFile;
    }

    return compressedFile;
  } catch (error) {
    log.error(`Database backup failed: ${error.message}`);
    throw error;
  }
};

// Files backup
const backupFiles = async () => {
  try {
    ensureBackupDir();
    
    const timestamp = getTimestamp();
    const backupFile = path.join(config.database.backupDir, `files-${timestamp}.${config.compression.format}`);
    
    log.info('Starting files backup...');

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(backupFile);
      const archive = archiver(config.compression.format, {
        zlib: { level: 9 } // Maximum compression
      });

      output.on('close', () => {
        log.info(`Files backup created: ${backupFile} (${archive.pointer()} bytes)`);
        resolve(backupFile);
      });

      archive.on('error', (err) => {
        log.error(`Files backup failed: ${err.message}`);
        reject(err);
      });

      archive.pipe(output);

      // Add files to archive
      config.files.sourceDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
          archive.directory(dir, false, {
            ignore: config.files.excludePatterns
          });
        } else {
          log.warn(`Source directory not found: ${dir}`);
        }
      });

      archive.finalize();
    });

    // Encrypt if enabled
    if (config.encryption.enabled) {
      const encryptedFile = backupFile + '.enc';
      await encryptFile(backupFile, encryptedFile);
      fs.unlinkSync(backupFile);
      log.info(`Files backup encrypted: ${encryptedFile}`);
      return encryptedFile;
    }

    return backupFile;
  } catch (error) {
    log.error(`Files backup failed: ${error.message}`);
    throw error;
  }
};

// Configuration backup
const backupConfig = async () => {
  try {
    ensureBackupDir();
    
    const timestamp = getTimestamp();
    const backupFile = path.join(config.database.backupDir, `config-${timestamp}.${config.compression.format}`);
    
    log.info('Starting configuration backup...');

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(backupFile);
      const archive = archiver(config.compression.format, {
        zlib: { level: 9 }
      });

      output.on('close', () => {
        log.info(`Configuration backup created: ${backupFile} (${archive.pointer()} bytes)`);
        resolve(backupFile);
      });

      archive.on('error', (err) => {
        log.error(`Configuration backup failed: ${err.message}`);
        reject(err);
      });

      archive.pipe(output);

      // Add config files
      const configFiles = [
        '.env',
        'docker-compose.yml',
        'docker-compose.prod.yml',
        'Dockerfile.frontend.prod',
        'package.json',
        'package-lock.json',
        'backend/package.json',
        'backend/package-lock.json'
      ];

      configFiles.forEach(file => {
        if (fs.existsSync(file)) {
          archive.file(file, { name: file });
        } else {
          log.warn(`Config file not found: ${file}`);
        }
      });

      archive.finalize();
    });

    // Encrypt if enabled
    if (config.encryption.enabled) {
      const encryptedFile = backupFile + '.enc';
      await encryptFile(backupFile, encryptedFile);
      fs.unlinkSync(backupFile);
      log.info(`Configuration backup encrypted: ${encryptedFile}`);
      return encryptedFile;
    }

    return backupFile;
  } catch (error) {
    log.error(`Configuration backup failed: ${error.message}`);
    throw error;
  }
};

// Full backup
const backupFull = async () => {
  try {
    log.info('Starting full backup...');
    
    const timestamp = getTimestamp();
    const backupDir = path.join(config.database.backupDir, `full-${timestamp}`);
    
    // Create backup directory
    fs.mkdirSync(backupDir, { recursive: true });

    // Backup database
    const dbBackup = await backupDatabase();
    const dbBackupName = path.basename(dbBackup);
    fs.copyFileSync(dbBackup, path.join(backupDir, dbBackupName));

    // Backup files
    const filesBackup = await backupFiles();
    const filesBackupName = path.basename(filesBackup);
    fs.copyFileSync(filesBackup, path.join(backupDir, filesBackupName));

    // Backup configuration
    const configBackup = await backupConfig();
    const configBackupName = path.basename(configBackup);
    fs.copyFileSync(configBackup, path.join(backupDir, configBackupName));

    // Create manifest
    const manifest = {
      timestamp: timestamp,
      type: 'full',
      database: dbBackupName,
      files: filesBackupName,
      config: configBackupName,
      size: {
        database: fs.statSync(path.join(backupDir, dbBackupName)).size,
        files: fs.statSync(path.join(backupDir, filesBackupName)).size,
        config: fs.statSync(path.join(backupDir, configBackupName)).size
      }
    };

    fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    // Compress the full backup
    const compressedFile = path.join(config.database.backupDir, `full-${timestamp}.${config.compression.format}`);
    await compressDirectory(backupDir, compressedFile);
    
    // Clean up temporary directory
    fs.rmSync(backupDir, { recursive: true, force: true });

    log.info(`Full backup completed: ${compressedFile}`);
    return compressedFile;
  } catch (error) {
    log.error(`Full backup failed: ${error.message}`);
    throw error;
  }
};

// Compression utilities
const compressFile = (sourceFile, destFile) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(destFile);
    const archive = archiver(config.compression.format, {
      zlib: { level: 9 }
    });

    output.on('close', () => resolve(destFile));
    archive.on('error', reject);

    archive.pipe(output);
    archive.file(sourceFile, { name: path.basename(sourceFile) });
    archive.finalize();
  });
};

const compressDirectory = (sourceDir, destFile) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(destFile);
    const archive = archiver(config.compression.format, {
      zlib: { level: 9 }
    });

    output.on('close', () => resolve(destFile));
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
};

// Encryption utilities
const encryptFile = (sourceFile, destFile) => {
  return new Promise((resolve, reject) => {
    const key = crypto.scryptSync(config.encryption.password, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(config.encryption.algorithm, key);

    const output = fs.createWriteStream(destFile);
    const input = fs.createReadStream(sourceFile);

    input.pipe(cipher).pipe(output);

    output.on('finish', () => {
      // Save IV for decryption
      const ivFile = destFile + '.iv';
      fs.writeFileSync(ivFile, iv);
      resolve(destFile);
    });

    output.on('error', reject);
  });
};

// Backup verification
const verifyBackup = (backupFile) => {
  try {
    log.info(`Verifying backup: ${backupFile}`);

    if (config.encryption.enabled && backupFile.endsWith('.enc')) {
      // Verify encrypted backup
      const ivFile = backupFile + '.iv';
      if (!fs.existsSync(ivFile)) {
        throw new Error('IV file not found for encrypted backup');
      }
      log.info('Encrypted backup verification passed');
      return true;
    }

    if (config.compression.enabled && backupFile.endsWith(config.compression.format)) {
      // Verify compressed backup
      const stats = fs.statSync(backupFile);
      if (stats.size === 0) {
        throw new Error('Compressed backup file is empty');
      }
      log.info('Compressed backup verification passed');
      return true;
    }

    // Verify regular backup
    const stats = fs.statSync(backupFile);
    if (stats.size === 0) {
      throw new Error('Backup file is empty');
    }
    log.info('Backup verification passed');
    return true;
  } catch (error) {
    log.error(`Backup verification failed: ${error.message}`);
    return false;
  }
};

// Main backup function
const backup = async (type = 'full') => {
  try {
    log.info(`Starting ${type} backup...`);

    let backupFile;
    switch (type) {
      case 'database':
        backupFile = await backupDatabase();
        break;
      case 'files':
        backupFile = await backupFiles();
        break;
      case 'config':
        backupFile = await backupConfig();
        break;
      case 'full':
        backupFile = await backupFull();
        break;
      default:
        throw new Error(`Unknown backup type: ${type}`);
    }

    // Verify backup
    if (process.argv.includes('--verify')) {
      const verified = verifyBackup(backupFile);
      if (!verified) {
        throw new Error('Backup verification failed');
      }
    }

    // Clean old backups
    if (process.argv.includes('--cleanup')) {
      cleanupOldBackups(type);
    }

    log.info(`${type} backup completed successfully: ${backupFile}`);
    return backupFile;
  } catch (error) {
    log.error(`${type} backup failed: ${error.message}`);
    throw error;
  }
};

// Schedule backup
const scheduleBackup = (cronExpression) => {
  try {
    const job = schedule.scheduleJob(cronExpression, async () => {
      try {
        await backup('full');
        log.info('Scheduled backup completed successfully');
      } catch (error) {
        log.error(`Scheduled backup failed: ${error.message}`);
      }
    });

    log.info(`Backup scheduled with cron: ${cronExpression}`);
    return job;
  } catch (error) {
    log.error(`Failed to schedule backup: ${error.message}`);
    throw error;
  }
};

// Command line interface
const cli = () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
MyChurch Backup System

Usage: node backup-system.cjs [options]

Options:
  --type <type>        Backup type: full, database, files, config (default: full)
  --destination <path>  Backup destination directory
  --compress           Enable compression
  --encrypt            Enable encryption
  --schedule <cron>    Schedule backup (cron format)
  --cleanup            Clean old backups
  --verify             Verify backup integrity
  --help               Show help

Examples:
  node backup-system.cjs --type full --compress --encrypt
  node backup-system.cjs --type database --destination /backups
  node backup-system.cjs --schedule "0 2 * * *" --cleanup
    `);
    process.exit(0);
  }

  // Parse arguments
  const options = {
    type: 'full',
    destination: config.database.backupDir,
    compress: config.compression.enabled,
    encrypt: config.encryption.enabled,
    schedule: null,
    cleanup: false,
    verify: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--type':
        options.type = args[++i];
        break;
      case '--destination':
        options.destination = args[++i];
        break;
      case '--compress':
        options.compress = true;
        break;
      case '--encrypt':
        options.encrypt = true;
        break;
      case '--schedule':
        options.schedule = args[++i];
        break;
      case '--cleanup':
        options.cleanup = true;
        break;
      case '--verify':
        options.verify = true;
        break;
    }
  }

  // Update config with options
  config.database.backupDir = options.destination;
  config.compression.enabled = options.compress;
  config.encryption.enabled = options.encrypt;

  // Execute backup
  if (options.schedule) {
    scheduleBackup(options.schedule);
  } else {
    backup(options.type)
      .then((backupFile) => {
        console.log(`Backup completed: ${backupFile}`);
        process.exit(0);
      })
      .catch((error) => {
        console.error(`Backup failed: ${error.message}`);
        process.exit(1);
      });
  }
};

// If this file is run directly, execute CLI
if (require.main === module) {
  cli();
}

module.exports = {
  backup,
  backupDatabase,
  backupFiles,
  backupConfig,
  backupFull,
  cleanupOldBackups,
  verifyBackup,
  scheduleBackup,
  config
};
