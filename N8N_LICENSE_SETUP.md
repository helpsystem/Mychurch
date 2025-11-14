# N8n License Setup Guide

## ✅ Status: Ready for License Activation

### Current Setup
- **URL:** https://n8n.samanabyar.online
- **Version:** 1.119.1 (latest stable)
- **Status:** 🟢 Running
- **Old Config:** Removed successfully

---

## 🔑 License Information

**Your License Key:**
```
abb8b5d3-b865-400b-8a74-071344a28170
```

---

## 📝 How to Activate License

### Step 1: Login to N8n
1. Go to: https://n8n.samanabyar.online
2. Enter credentials:
   - **Username:** `admin`
   - **Password:** `Iranian@1989`

### Step 2: Add License Key
1. Click on your profile icon (top right)
2. Go to **Settings** → **License**
3. Click **"Add License Key"**
4. Paste the license key: `abb8b5d3-b865-400b-8a74-071344a28170`
5. Click **"Activate"**

### Alternative: Continue with Free Plan
If you don't want to activate the license now, you can continue using N8n's free plan which includes:
- Unlimited workflows
- Unlimited executions
- Community support

---

## 🔧 What Was Done

### Problem
Old license configuration was causing issues or needed to be reset.

### Solution
```bash
# Found config file location
docker exec n8n-n8n-1 find / -name 'config' -type f 2>/dev/null

# Removed old config
docker exec n8n-n8n-1 rm -vf /home/node/.n8n/config

# Restarted N8n
docker restart n8n-n8n-1
```

### Result
- ✅ Old config removed
- ✅ N8n restarted successfully
- ✅ Web interface accessible (HTTP 200)
- ✅ Version 1.119.1 confirmed
- ✅ Ready for new license activation

---

## 📊 N8n Environment Variables

Current configuration from `~/n8n/.env`:

```env
# Basic Setup
N8N_HOST=n8n.samanabyar.online
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=https://n8n.samanabyar.online/

# Security
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=Iranian@1989

# Database
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=f5d64c17e8d63743b9b6a514b9f870df

# Other
N8N_PAYLOAD_SIZE_MAX=33554432
GENERIC_TIMEZONE=Asia/Tehran
```

---

## ⚙️ Recommended Environment Variable Updates

N8n logs show some deprecation warnings. Consider adding these to `~/n8n/.env`:

```env
# Enable task runners (recommended)
N8N_RUNNERS_ENABLED=true

# Block environment variable access for security
N8N_BLOCK_ENV_ACCESS_IN_NODE=true

# Disable bare repositories in Git Node (security)
N8N_GIT_NODE_DISABLE_BARE_REPOS=true

# Enforce correct config file permissions
N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
```

To apply these:
```bash
# On server
cd ~/n8n
nano .env  # Add the variables above
docker compose down
docker compose up -d
```

---

## 🐛 Troubleshooting

### License Not Activating
1. Check N8n logs: `docker logs n8n-n8n-1 --tail 50`
2. Verify internet connection from container
3. Try removing config again and restart

### Can't Access N8n
1. Check container status: `docker ps | grep n8n`
2. Check nginx: `systemctl status nginx`
3. Test directly: `curl http://localhost:5678`

### Permission Issues
```bash
# Fix config file permissions
docker exec n8n-n8n-1 chmod 600 /home/node/.n8n/config
docker restart n8n-n8n-1
```

---

## 📚 Useful Commands

```bash
# Check N8n status
docker ps --filter name=n8n

# View N8n logs
docker logs n8n-n8n-1 --tail 50 -f

# Restart N8n
docker restart n8n-n8n-1

# Enter N8n container
docker exec -it n8n-n8n-1 bash

# Check N8n version
docker exec n8n-n8n-1 n8n --version

# Backup N8n data
docker exec n8n-n8n-1 tar czf - /home/node/.n8n > n8n-backup-$(date +%Y%m%d).tar.gz
```

---

## 🔗 Useful Links

- **N8n Documentation:** https://docs.n8n.io/
- **N8n Hosting:** https://docs.n8n.io/hosting/
- **License Info:** https://n8n.io/pricing/
- **Community:** https://community.n8n.io/

---

## ✅ Checklist

- [x] Old config removed
- [x] N8n restarted
- [x] Web interface accessible
- [x] SSL certificate valid
- [ ] **License key activated** (your next step)
- [ ] Workflows tested
- [ ] Environment variables optimized (optional)

---

**Last Updated:** November 11, 2025  
**N8n Version:** 1.119.1  
**Status:** 🟢 Ready for License Activation
