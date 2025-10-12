# 🚀 Deployment Instructions for Mychurch

## Prerequisites

### Server Requirements
- Ubuntu/Debian Linux server
- Node.js v18+ installed
- npm installed
- PM2 process manager installed
- Nginx web server configured
- Git installed
- Sudo/root access

### First Time Setup

1. **Install PM2 (if not installed)**
```bash
npm install -g pm2
```

2. **Clone Repository**
```bash
cd /root
git clone https://github.com/helpsystem/Mychurch.git
cd Mychurch
```

3. **Create Web Directory**
```bash
mkdir -p /var/www/mychurch
```

4. **Setup Backend with PM2**
```bash
cd /root/Mychurch/backend
npm install
pm2 start dev-server.js --name mychurch-backend
pm2 save
pm2 startup
```

5. **Configure Nginx**
Create `/etc/nginx/sites-available/mychurch`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    root /var/www/mychurch;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/mychurch /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

6. **Add Leaders to Database**
```bash
cd /root/Mychurch/backend
node scripts/add-leaders.js
```

---

## 🔄 Deploy Updates (Every Time)

### Method 1: Using Deployment Script (Recommended)

1. **Make script executable** (first time only):
```bash
cd /root/Mychurch
chmod +x deploy-server.sh
```

2. **Run deployment**:
```bash
./deploy-server.sh
```

### Method 2: Manual Deployment

Run these commands on your server:

```bash
cd /root/Mychurch
git pull origin main
npm install
cd backend
npm install
cd ..
npm run build
rm -rf /var/www/mychurch/*
cp -r dist/* /var/www/mychurch/
pm2 restart mychurch-backend
pm2 save
pm2 status
```

---

## 📋 Post-Deployment Checklist

- [ ] Website loads: `http://your-domain.com`
- [ ] Backend health: `http://your-domain.com/api/health`
- [ ] Leaders section shows data: `http://your-domain.com/api/leaders`
- [ ] AI Helper widget loads: `http://your-domain.com/#/ai-helper`
- [ ] Bible reader works
- [ ] Images load correctly

---

## 🔍 Troubleshooting

### Website doesn't load
```bash
# Check Nginx status
systemctl status nginx

# Check Nginx error log
tail -f /var/log/nginx/error.log

# Check if files exist
ls -la /var/www/mychurch/
```

### Backend API not working
```bash
# Check PM2 status
pm2 status

# Check backend logs
pm2 logs mychurch-backend

# Restart backend
pm2 restart mychurch-backend
```

### Leaders not showing
```bash
# Run the script to add leaders
cd /root/Mychurch/backend
node scripts/add-leaders.js

# Check database connection
node -e "const {pool} = require('./db-postgres'); pool.query('SELECT * FROM leaders').then(r => console.log(r.rows));"
```

### Permission issues
```bash
# Fix permissions
chown -R www-data:www-data /var/www/mychurch
chmod -R 755 /var/www/mychurch
```

---

## 🔐 Environment Variables

Make sure these are set in `/root/Mychurch/backend/.env`:

```env
DATABASE_URL=your_supabase_connection_string
PORT=3001
NODE_ENV=production
```

---

## 📊 Monitoring

### View Backend Logs
```bash
pm2 logs mychurch-backend
```

### Monitor Resources
```bash
pm2 monit
```

### View All PM2 Processes
```bash
pm2 list
```

---

## 🔄 Rollback (If Something Goes Wrong)

If deployment fails, restore from backup:

```bash
# Find latest backup
ls -lt /var/backups/mychurch/

# Restore from backup
rm -rf /var/www/mychurch/*
cp -r /var/backups/mychurch/backup-YYYYMMDD-HHMMSS/* /var/www/mychurch/

# Restart services
pm2 restart mychurch-backend
systemctl reload nginx
```

---

## 📞 Support

If you encounter issues:
1. Check logs: `pm2 logs mychurch-backend`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify environment variables: `cat /root/Mychurch/backend/.env`
4. Test database connection: `cd /root/Mychurch/backend && node scripts/check-leaders-table.js`

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Deploy | `cd /root/Mychurch && ./deploy-server.sh` |
| View Logs | `pm2 logs mychurch-backend` |
| Restart Backend | `pm2 restart mychurch-backend` |
| Check Status | `pm2 status` |
| Reload Nginx | `systemctl reload nginx` |
| Add Leaders | `cd /root/Mychurch/backend && node scripts/add-leaders.js` |

---

## 🔒 Security Notes

- Keep `.env` file secure (never commit to Git)
- Use SSL certificate (Let's Encrypt recommended)
- Keep dependencies updated: `npm audit fix`
- Use firewall rules to restrict access
- Regular backups of database

---

**Last Updated**: October 12, 2025
