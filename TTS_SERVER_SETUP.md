# 🎤 نصب و راه‌اندازی سرویس TTS فارسی
## Persian TTS Server Setup Guide

این راهنما نحوه نصب و راه‌اندازی سرویس TTS فارسی با Coqui را توضیح می‌دهد.

---

## 📋 پیش‌نیازها

### Windows:
```powershell
# 1. Python 3.8+ (دانلود از python.org)
python --version

# 2. espeak-ng (برای phoneme processing)
# دانلود از: https://github.com/espeak-ng/espeak-ng/releases
# یا با chocolatey:
choco install espeak-ng

# 3. ffmpeg (برای تبدیل فرمت صوتی)
choco install ffmpeg
```

### Linux (Ubuntu/Debian):
```bash
# Python
sudo apt-get update
sudo apt-get install python3 python3-pip

# espeak-ng
sudo apt-get install espeak-ng

# ffmpeg
sudo apt-get install ffmpeg
```

### macOS:
```bash
# با Homebrew
brew install python espeak-ng ffmpeg
```

---

## 🚀 نصب سرویس TTS

### مرحله 1: نصب کتابخانه‌های Python

```bash
cd "d:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\Git\\Mychurch"

# نصب dependencies
pip install -r requirements-tts.txt

# یا به صورت دستی:
pip install TTS flask flask-cors gunicorn pydub requests
```

### مرحله 2: تست نصب

```bash
# بررسی نصب TTS
python -c "from TTS.api import TTS; print('✅ TTS installed')"

# بررسی espeak
espeak-ng --version
```

---

## 🎯 راه‌اندازی سرویس

### حالت Development (تست محلی):

```bash
# روش 1: مستقیماً با Python
python scripts/tts_server.py

# روش 2: با متغیر محیطی برای تغییر port
TTS_PORT=5000 python scripts/tts_server.py
```

سرویس روی **http://localhost:5000** اجرا می‌شود.

### حالت Production:

```bash
# با gunicorn (بهتر برای production)
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 scripts.tts_server:app

# یا با کانفیگ کامل:
gunicorn -w 4 \
  -b 0.0.0.0:5000 \
  --timeout 120 \
  --access-logfile logs/tts-access.log \
  --error-logfile logs/tts-error.log \
  --log-level info \
  scripts.tts_server:app
```

---

## 🔧 پیکربندی Backend Node.js

فایل `.env` را ویرایش کنید:

```env
# TTS Service URL
TTS_SERVICE_URL=http://localhost:5000

# یا برای production server:
# TTS_SERVICE_URL=http://your-server.com:5000
```

راه‌اندازی Backend:

```bash
npm run backend
```

---

## 🧪 تست سرویس

### تست 1: Health Check

```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing | Select-Object -ExpandProperty Content

# یا با curl
curl http://localhost:5000/health
```

خروجی مورد انتظار:
```json
{
  "status": "ok",
  "service": "Persian TTS Server",
  "model": "Coqui VITS (Kamtera)",
  "cache_files": 0
}
```

### تست 2: تولید صدا

```bash
curl -X POST http://localhost:5000/api/tts/synthesize \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"سلام دنیا\", \"voice\": \"male\", \"format\": \"mp3\"}" \
  --output test.mp3
```

### تست 3: از طریق Frontend

1. باز کردن: http://localhost:5173/#/bible-presentation-sample
2. کلیک روی Play
3. باید صدای با کیفیت فارسی پخش شود!

---

## 📊 استفاده از Hook در React

```typescript
import { usePersianTTS } from '@/hooks/usePersianTTS';

function MyComponent() {
  const { speak, isLoading, isPlaying, error, serviceAvailable } = usePersianTTS();

  const handleSpeak = async () => {
    const result = await speak('سلام دنیا، این یک تست است', {
      voice: 'male',
      format: 'mp3',
      onStart: () => console.log('Started'),
      onEnd: () => console.log('Ended'),
      onError: (err) => console.error(err)
    });

    if (result.fallback) {
      // Fallback to Web Speech API
      window.speechSynthesis.speak(new SpeechSynthesisUtterance('سلام دنیا'));
    }
  };

  return (
    <div>
      {serviceAvailable === false && (
        <div className="alert">⚠️ سرویس TTS در دسترس نیست</div>
      )}
      
      <button onClick={handleSpeak} disabled={isLoading}>
        {isLoading ? 'در حال تولید...' : isPlaying ? '⏸ توقف' : '▶ پخش'}
      </button>
      
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

---

## 🐳 Docker (اختیاری)

```dockerfile
FROM python:3.9-slim

# نصب dependencies
RUN apt-get update && \
    apt-get install -y espeak-ng ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# کپی requirements
COPY requirements-tts.txt .
RUN pip install --no-cache-dir -r requirements-tts.txt

# کپی کد
COPY scripts/tts_server.py scripts/

# مدل‌ها را از قبل دانلود کن (optional)
RUN python -c "from TTS.api import TTS; TTS(model_path='https://huggingface.co/Kamtera/persian-tts-male1-vits/resolve/main/checkpoint_88000.pth', config_path='https://huggingface.co/Kamtera/persian-tts-male1-vits/resolve/main/config.json')"

EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "scripts.tts_server:app"]
```

ساخت و اجرا:
```bash
docker build -t persian-tts .
docker run -p 5000:5000 persian-tts
```

---

## 🌐 Deploy به Production

### گزینه 1: سرور مجزا برای TTS

```bash
# در سرور TTS
sudo systemctl create /etc/systemd/system/tts.service

[Unit]
Description=Persian TTS Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/mychurch
ExecStart=/usr/bin/gunicorn -w 4 -b 0.0.0.0:5000 scripts.tts_server:app
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable tts
sudo systemctl start tts
```

### گزینه 2: در همان سرور با Nginx

```nginx
# /etc/nginx/sites-available/mychurch

# TTS Service
upstream tts_backend {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name yourchurch.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
    }

    # TTS Service (internal only)
    location /tts-internal/ {
        internal;
        proxy_pass http://tts_backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔍 عیب‌یابی

### مشکل: "Import TTS could not be resolved"

```bash
pip install --upgrade TTS
python -c "import TTS; print(TTS.__version__)"
```

### مشکل: "espeak-ng not found"

**Windows:**
- دانلود از: https://github.com/espeak-ng/espeak-ng/releases
- اضافه کردن به PATH

**Linux:**
```bash
sudo apt-get install espeak-ng
espeak-ng --version
```

### مشکل: "Model download failed"

مدل را دستی دانلود کنید:
```bash
wget https://huggingface.co/Kamtera/persian-tts-male1-vits/resolve/main/checkpoint_88000.pth
wget https://huggingface.co/Kamtera/persian-tts-male1-vits/resolve/main/config.json
```

و path را در `tts_server.py` تغییر دهید.

### مشکل: "Port 5000 already in use"

```bash
# تغییر port
TTS_PORT=5001 python scripts/tts_server.py

# یا پیدا کردن process
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

---

## 📈 بهینه‌سازی Performance

### 1. Pre-load Model

مدل را هنگام startup لود کنید (در `tts_server.py`).

### 2. Cache Management

```bash
# پاک کردن cache
curl -X POST http://localhost:5000/api/tts/cache/clear

# بررسی حجم cache
curl http://localhost:5000/api/tts/cache/info
```

### 3. Worker Count

```bash
# برای سرور 4-core
gunicorn -w 4 ...

# برای سرور 8-core
gunicorn -w 8 ...
```

---

## ✅ چک‌لیست نصب

- [ ] Python 3.8+ نصب شد
- [ ] espeak-ng نصب شد
- [ ] ffmpeg نصب شد
- [ ] `pip install -r requirements-tts.txt` اجرا شد
- [ ] `python scripts/tts_server.py` کار می‌کند
- [ ] Health check موفق است: http://localhost:5000/health
- [ ] تست تولید صدا موفق است
- [ ] Backend Node.js متصل است
- [ ] Frontend می‌تواند صدا بگیرد

---

## 🎉 تمام!

حالا سرویس TTS فارسی با کیفیت بالا آماده است! 🚀

برای سوالات:
- GitHub Issues: https://github.com/karim23657/Persian-tts-coqui/issues
- Telegram: https://t.me/persian_tts
