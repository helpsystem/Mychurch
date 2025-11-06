# 🚀 MyChurch Production Deployment Script

## Overview

The [`deploy-to-production.cjs`](deploy-to-production.cjs) script provides automated deployment of MyChurch to a remote production server. It handles the entire deployment process from server setup to testing and verification.

## Features

- **Automated Server Setup**: Installs Docker, Docker Compose, and required dependencies
- **Database Configuration**: Sets up PostgreSQL with secure credentials
- **SSL/HTTPS Setup**: Obtains and configures SSL certificates with Let's Encrypt
- **File Transfer**: Securely uploads application files to the server
- **Container Deployment**: Builds and deploys Docker containers
- **Automated Testing**: Tests all endpoints and functionality
- **Backup System**: Creates backups before deployment
- **Rollback Support**: Maintains backup files for rollback

## Prerequisites

### Server Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Minimum 2GB RAM, 2 CPU cores
- 50GB+ free disk space
- Internet connection for package downloads

### Network Requirements
- SSH access to the server
- Port 22 (SSH) open
- Port 80 (HTTP) and 443 (HTTPS) open
- Domain DNS pointing to server IP

### Local Requirements
- Node.js 18+
- SSH key pair for authentication
- Domain name configured

## Usage

### Basic Deployment

```bash
# Basic deployment with required parameters
node deploy-to-production.cjs \
  --host your-server-ip \
  --user root \
  --key ~/.ssh/id_rsa \
  --domain mychurch.com
```

### Advanced Deployment

```bash
# Complete deployment with all options
node deploy-to-production.cjs \
  --host 192.168.1.100 \
  --user deploy \
  --key ~/.ssh/deploy_key \
  --domain mychurch.com \
  --env custom.env \
  --docker docker-compose.custom.yml \
  --backup \
  --test
```

### Command Line Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--host` | Remote server hostname or IP | Yes | - |
| `--user` | SSH username | Yes | - |
| `--key` | SSH private key path | Yes | - |
| `--domain` | Domain name for the website | Yes | - |
| `--env` | Environment file path | No | `.env` |
| `--docker` | Docker compose file path | No | `docker-compose.prod.yml` |
| `--backup` | Create backup before deployment | No | `false` |
| `--test` | Run tests after deployment | No | `false` |
| `--help` | Show help message | No | - |

## Deployment Process

The script follows these steps:

1. **Connection Verification**
   - Tests SSH connection to the server
   - Validates server accessibility

2. **Backup Creation** (Optional)
   - Creates a backup of existing deployment
   - Stores it in `/var/backups/mychurch/`

3. **Server Setup**
   - Updates system packages
   - Installs Docker and Docker Compose
   - Configures Docker service

4. **Directory Setup**
   - Creates deployment directory structure
   - Sets up proper permissions
   - Creates required directories

5. **File Transfer**
   - Uploads Docker compose files
   - Uploads application configuration
   - Transfers environment files

6. **Environment Configuration**
   - Creates production environment file
   - Configures database settings
   - Sets up security parameters

7. **Database Setup**
   - Installs PostgreSQL
   - Creates database and users
   - Initializes database schema

8. **SSL Configuration**
   - Installs Certbot
   - Obtains SSL certificates
   - Configures automatic renewal

9. **Container Deployment**
   - Builds Docker images
   - Deploys containers
   - Starts services

10. **Testing and Verification**
    - Tests all endpoints
    - Verifies SSL certificates
    - Checks database connectivity
    - Validates container status

## Configuration

### Environment Variables

The script uses the following environment variables:

```bash
# Server Configuration
REMOTE_HOST=your-server-ip
REMOTE_USER=deploy
REMOTE_KEY=~/.ssh/deploy_key
REMOTE_PORT=22

# Application Configuration
REMOTE_DOMAIN=mychurch.com
REMOTE_API_DOMAIN=api.mychurch.com
CERTBOT_EMAIL=admin@mychurch.com

# Deployment Options
BACKUP_BEFORE_DEPLOY=true
TEST_AFTER_DEPLOY=true
```

### Server Configuration File

Create a `.env` file with your configuration:

```env
# Remote Server
REMOTE_HOST=192.168.1.100
REMOTE_USER=root
REMOTE_KEY=~/.ssh/id_rsa
REMOTE_PORT=22

# Domain Configuration
REMOTE_DOMAIN=mychurch.com
REMOTE_API_DOMAIN=api.mychurch.com
CERTBOT_EMAIL=admin@mychurch.com

# Deployment Options
BACKUP_BEFORE_DEPLOY=true
TEST_AFTER_DEPLOY=true
```

## Post-Deployment

### Access Information

After successful deployment, you'll have access to:

- **Website**: `https://mychurch.com`
- **API**: `https://api.mychurch.com`
- **Admin Login**: `admin@mychurch.com` / `MyChurchSecureAdmin2024!`

### Management Commands

```bash
# View container status
ssh -i ~/.ssh/id_rsa root@your-server-ip "docker-compose ps"

# View logs
ssh -i ~/.ssh/id_rsa root@your-server-ip "docker-compose logs -f"

# Restart services
ssh -i ~/.ssh/id_rsa root@your-server-ip "docker-compose restart"

# Update deployment
ssh -i ~/.ssh/id_rsa root@your-server-ip "cd /opt/mychurch && git pull && docker-compose build && docker-compose up -d"

# Create backup
ssh -i ~/.ssh/id_rsa root@your-server-ip "node backup-system.cjs --type full --compress --encrypt"

# Restore backup
ssh -i ~/.ssh/id_rsa root@your-server-ip "node backup-system.cjs --restore latest"
```

### Monitoring

```bash
# System monitoring
ssh -i ~/.ssh/id_rsa root@your-server-ip "htop"

# Disk usage
ssh -i ~/.ssh/id_rsa root@your-server-ip "df -h"

# Docker stats
ssh -i ~/.ssh/id_rsa root@your-server-ip "docker stats"

# Log monitoring
ssh -i ~/.ssh/id_rsa root@your-server-ip "tail -f /var/log/nginx/access.log"
```

## Troubleshooting

### Common Issues

#### SSH Connection Failed
```bash
# Check SSH connectivity
ssh -i ~/.ssh/id_rsa -p 22 root@your-server-ip "echo 'Connection test'"

# Check SSH key permissions
chmod 600 ~/.ssh/id_rsa

# Check server SSH service
ssh -i ~/.ssh/id_rsa root@your-server-ip "systemctl status ssh"
```

#### Docker Installation Failed
```bash
# Check Docker installation
ssh -i ~/.ssh/id_rsa root@your-server-ip "docker --version"

# Check Docker service
ssh -i ~/.ssh/id_rsa root@your-server-ip "systemctl status docker"

# Restart Docker service
ssh -i ~/.ssh/id_rsa root@your-server-ip "systemctl restart docker"
```

#### SSL Certificate Issues
```bash
# Check SSL certificate
ssh -i ~/.ssh/id_rsa root@your-server-ip "echo | openssl s_client -connect mychurch.com:443 -servername mychurch.com | openssl x509 -noout -dates"

# Renew SSL certificate
ssh -i ~/.ssh/id_rsa root@your-server-ip "certbot renew"

# Check Nginx configuration
ssh -i ~/.ssh/id_rsa root@your-server-ip "nginx -t"
```

#### Database Connection Issues
```bash
# Check PostgreSQL service
ssh -i ~/.ssh/id_rsa root@your-server-ip "systemctl status postgresql"

# Check database connectivity
ssh -i ~/.ssh/id_rsa root@your-server-ip "docker-compose exec postgres psql -U mychurch_admin -d mychurch_prod -c 'SELECT 1;'"

# Check database logs
ssh -i ~/.ssh/id_rsa root@your-server-ip "tail -f /var/log/postgresql/postgresql-15-main.log"
```

#### Application Issues
```bash
# Check application logs
ssh -i ~/.ssh/id_rsa root@your-server-ip "docker-compose logs backend"

# Check container status
ssh -i ~/.ssh/id_rsa root@your-server-ip "docker-compose ps"

# Restart application
ssh -i ~/.ssh/id_rsa root@your-server-ip "docker-compose restart"
```

### Debug Mode

Enable debug logging:

```bash
DEBUG=true node deploy-to-production.cjs --host your-server --user deploy --key ~/.ssh/key --domain mychurch.com
```

### Rollback

If deployment fails, you can rollback:

```bash
# List available backups
ssh -i ~/.ssh/id_rsa root@your-server-ip "ls -la /var/backups/mychurch/"

# Restore from backup
ssh -i ~/.ssh/id_rsa root@your-server-ip "cd /opt/mychurch && tar -xzf /var/backups/mychurch/backup-file.tar.gz"

# Restart services
ssh -i ~/.ssh/id_rsa root@your-server-ip "docker-compose up -d"
```

## Security Considerations

### Server Security
- Use SSH key authentication instead of passwords
- Regularly update system packages
- Configure firewall rules
- Monitor system logs

### Application Security
- Use strong passwords
- Enable SSL/TLS
- Regular security updates
- Monitor for suspicious activity

### Database Security
- Use strong database passwords
- Regular database backups
- Limit database access
- Monitor database queries

## Performance Optimization

### System Optimization
- Allocate sufficient system resources
- Use SSD storage
- Optimize network settings
- Regular system maintenance

### Application Optimization
- Use caching (Redis)
- Optimize database queries
- Use CDN for static assets
- Monitor application performance

### Database Optimization
- Regular database maintenance
- Optimize database indexes
- Use connection pooling
- Monitor database performance

## Backup and Recovery

### Backup Strategy
- Regular automated backups
- Off-site backup storage
- Backup verification
- Backup testing

### Recovery Procedures
- Document recovery steps
- Test recovery procedures
- Maintain recovery documentation
- Regular recovery drills

## Support and Resources

- **Documentation**: [MyChurch Documentation](https://docs.mychurch.com)
- **Issue Tracker**: [GitHub Issues](https://github.com/your-username/mychurch/issues)
- **Community Forum**: [MyChurch Community](https://community.mychurch.com)
- **Support Email**: support@mychurch.com

## Conclusion

The production deployment script provides a comprehensive solution for deploying MyChurch to a remote server. It automates the entire deployment process and ensures proper configuration and security.

For additional support or questions, please refer to the resources listed above or contact the MyChurch development team.

---

*Last Updated: November 2024*
*Version: 1.0.0*