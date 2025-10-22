# ⚡ شروع سریع سرور

## 🏠 اجرای محلی (Local Development)

```bash
cd backend
npm install
npm start
```

سرور روی `http://localhost:3001` اجرا می‌شود.

## 🌍 دسترسی Remote

برای دسترسی از خارج (مثلاً از تلفن همراه در شبکه‌ای دیگر):

### 1. تنظیم .env

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3001
```

### 2. اجرای سرور

```bash
npm start
```

### 3. دسترسی از دستگاه دیگر

```
http://[YOUR_IP]:3001/api/health
```

برای پیدا کردن IP خود:

**Windows:**
```bash
ipconfig
```
به دنبال "IPv4 Address" بگردید (مثلاً 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
# یا
ip addr show
```

## 🧪 تست دسترسی

```bash
npm run test:remote
```

این اسکریپت هم local و هم remote را تست می‌کند.

## 🚀 استقرار Production با PM2

```bash
# نصب PM2 (یکبار)
npm install -g pm2

# شروع سرور
npm run pm2:start

# مشاهده وضعیت
pm2 status

# مشاهده لاگ‌ها
npm run pm2:logs

# ریستارت
npm run pm2:restart

# متوقف کردن
npm run pm2:stop
```

## 🔍 تست سلامت سرور

**Local:**
```bash
curl http://localhost:3001/api/health
```

**Remote:**
```bash
curl http://[YOUR_IP]:3001/api/health
```

یا از مرورگر:
```
http://[YOUR_IP]:3001/api/health
```

باید پاسخ بدهد:
```json
{
  "status": "ok",
  "message": "Church API is running",
  "timestamp": "..."
}
```

## ⚙️ تنظیمات مهم

| تنظیم | Local | Production |
|-------|-------|------------|
| `NODE_ENV` | development | production |
| `HOST` | localhost | 0.0.0.0 |
| `PORT` | 3001 | 3001 |
| `ALLOWED_ORIGINS` | http://localhost:5173 | https://samanabyar.online |

## 🆘 عیب‌یابی

### ❌ Error: EADDRINUSE (پورت اشغال است)

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID [process_id] /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

### ❌ CORS Error

در `.env` چک کنید `ALLOWED_ORIGINS` شامل domain شما باشد:
```env
ALLOWED_ORIGINS=http://localhost:5173,https://samanabyar.online
```

### ❌ Cannot connect from other device

1. مطمئن شوید `HOST=0.0.0.0` در `.env` است
2. Firewall را چک کنید (پورت 3001 باید باز باشد)
3. هر دو دستگاه باید در یک شبکه باشند

## 📚 راهنماهای بیشتر

- [راهنمای کامل استقرار Remote](./REMOTE_DEPLOYMENT_GUIDE.md)
- [تنظیمات .env](./env.example)
