#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const SERVICES = (process.env.SERVICES || 'postgres,redis,backend,nginx').split(',');
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 60;
const ALERT_WEBHOOK = process.env.ALERT_WEBHOOK;
const LOG_FILE = '/logs/health.log';

class HealthMonitor {
  constructor() {
    this.status = {};
    this.alertsSent = new Set();
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    console.log(message);
    
    try {
      await fs.appendFile(LOG_FILE, logMessage);
    } catch (err) {
      console.error('Failed to write to log file:', err.message);
    }
  }

  async checkService(service) {
    try {
      switch (service) {
        case 'postgres':
          return await this.checkPostgres();
        case 'redis':
          return await this.checkRedis();
        case 'backend':
          return await this.checkBackend();
        case 'nginx':
          return await this.checkNginx();
        default:
          throw new Error(`Unknown service: ${service}`);
      }
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkPostgres() {
    try {
      const { stdout } = await execAsync('pg_isready -h postgres -p 5432');
      return {
        healthy: true,
        message: stdout.trim(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`PostgreSQL check failed: ${error.message}`);
    }
  }

  async checkRedis() {
    return new Promise((resolve, reject) => {
      const client = require('net').createConnection({ host: 'redis', port: 6379 }, () => {
        client.write('PING\r\n');
      });

      client.on('data', (data) => {
        client.end();
        if (data.toString().includes('+PONG')) {
          resolve({
            healthy: true,
            message: 'Redis responding to PING',
            timestamp: new Date().toISOString()
          });
        } else {
          reject(new Error('Redis did not respond with PONG'));
        }
      });

      client.on('error', (err) => {
        reject(new Error(`Redis connection failed: ${err.message}`));
      });

      setTimeout(() => {
        client.destroy();
        reject(new Error('Redis check timeout'));
      }, 5000);
    });
  }

  async checkBackend() {
    return new Promise((resolve, reject) => {
      const req = http.get('http://backend:5000/api/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.ok) {
              resolve({
                healthy: true,
                message: 'Backend API healthy',
                uptime: result.uptime,
                timestamp: new Date().toISOString()
              });
            } else {
              reject(new Error('Backend API reports unhealthy status'));
            }
          } catch (error) {
            reject(new Error(`Backend API invalid response: ${error.message}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Backend API request failed: ${err.message}`));
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Backend API check timeout'));
      });
    });
  }

  async checkNginx() {
    return new Promise((resolve, reject) => {
      const req = http.get('http://nginx:80/health', (res) => {
        if (res.statusCode === 200) {
          resolve({
            healthy: true,
            message: 'Nginx responding',
            statusCode: res.statusCode,
            timestamp: new Date().toISOString()
          });
        } else {
          reject(new Error(`Nginx returned status ${res.statusCode}`));
        }
      });

      req.on('error', (err) => {
        reject(new Error(`Nginx check failed: ${err.message}`));
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Nginx check timeout'));
      });
    });
  }

  async sendAlert(service, status) {
    if (!ALERT_WEBHOOK) return;

    const alertKey = `${service}-${status.healthy ? 'up' : 'down'}`;
    
    // Don't spam alerts
    if (this.alertsSent.has(alertKey)) return;
    
    const payload = {
      text: status.healthy 
        ? `✅ Service ${service} is back online`
        : `🚨 Service ${service} is down: ${status.error}`,
      service,
      healthy: status.healthy,
      timestamp: status.timestamp,
      error: status.error
    };

    try {
      const data = JSON.stringify(payload);
      const url = new URL(ALERT_WEBHOOK);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = (url.protocol === 'https:' ? https : http).request(options);
      req.write(data);
      req.end();

      this.alertsSent.add(alertKey);
      
      // Remove the opposite alert so we can send recovery notifications
      const oppositeKey = `${service}-${!status.healthy ? 'up' : 'down'}`;
      this.alertsSent.delete(oppositeKey);
      
    } catch (error) {
      await this.log(`Failed to send alert: ${error.message}`);
    }
  }

  async runHealthChecks() {
    await this.log('Starting health check cycle...');
    
    for (const service of SERVICES) {
      const status = await this.checkService(service);
      const prevStatus = this.status[service];
      
      this.status[service] = status;
      
      if (status.healthy) {
        await this.log(`✅ ${service}: ${status.message}`);
      } else {
        await this.log(`❌ ${service}: ${status.error}`);
      }
      
      // Send alert if status changed
      if (prevStatus && prevStatus.healthy !== status.healthy) {
        await this.sendAlert(service, status);
      }
    }
    
    // Write status summary
    const summary = {
      timestamp: new Date().toISOString(),
      services: this.status,
      overall: Object.values(this.status).every(s => s.healthy)
    };
    
    try {
      await fs.writeFile('/logs/health-status.json', JSON.stringify(summary, null, 2));
    } catch (err) {
      await this.log(`Failed to write status file: ${err.message}`);
    }
  }

  async start() {
    await this.log('Health monitor starting...');
    await this.log(`Monitoring services: ${SERVICES.join(', ')}`);
    await this.log(`Check interval: ${CHECK_INTERVAL} seconds`);
    
    // Initial check
    await this.runHealthChecks();
    
    // Schedule regular checks
    setInterval(async () => {
      await this.runHealthChecks();
    }, CHECK_INTERVAL * 1000);
  }
}

const monitor = new HealthMonitor();
monitor.start().catch(error => {
  console.error('Health monitor failed to start:', error);
  process.exit(1);
});