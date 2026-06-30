# 🤖 Aras Tax Services AI Setup Guide

## Overview

This plugin includes **local AI** powered by [Ollama](https://ollama.ai), providing:
- **AI Chatbot** — answers tax questions in real-time
- **AI Translator** — translates content between 14 languages
- All processing runs **locally on your server** (no API keys, no cloud costs)

---

## Step 1: Install Ollama

### On Linux (Ubuntu/Debian):
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### On Linux (systemd service):
```bash
# Create service file
sudo tee /etc/systemd/system/ollama.service > /dev/null << 'EOF'
[Unit]
Description=Ollama AI Service
After=network.target

[Service]
Type=simple
User=ollama
Group=ollama
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=10
Environment="OLLAMA_HOST=0.0.0.0:11434"

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama
```

### On macOS:
```bash
brew install ollama
ollama serve &
```

### On Windows:
1. Download from [ollama.ai/download](https://ollama.ai/download)
2. Run the installer
3. Ollama runs automatically as a background service

---

## Step 2: Pull an AI Model

### Recommended for tax support (English focused):
```bash
ollama pull llama3.2
```

### Recommended for multilingual (Arabic, Kurdish, Persian):
```bash
ollama pull qwen2.5      # Best for Arabic/Persian/Kurdish
# OR
ollama pull mistral      # Good multilingual support
```

### Lightweight option (4GB+ RAM):
```bash
ollama pull phi3
```

---

## Step 3: Verify Ollama is Running

```bash
curl http://localhost:11434/api/tags
```

You should see a JSON response with your downloaded models.

---

## Step 4: Configure the Plugin

1. Go to **WordPress Admin → Aras Tax → AI Settings**
2. ✅ Enable all AI features
3. ✅ Enable Chatbot widget
4. ✅ Enable Translator shortcode
5. Select your model (e.g., `llama3.2`, `qwen2.5`)
6. Verify the Ollama URL (default: `http://localhost:11434`)
7. Click **Save AI Settings**

---

## Step 5: Use on Your Website

### AI Chatbot
The floating chat button appears automatically on all pages when enabled.

### AI Translator
Add to any page or post:
```
[aras_ai_translate]
```

With custom defaults:
```
[aras_ai_translate default_from="en" default_to="ar" title="مترجم ذکی"]
```

---

## Supported Languages

| Code | Language |
|------|----------|
| en | 🇺🇸 English |
| ar | 🇸🇦 العربية |
| ku | 🇮🇶 کوردی |
| fa | 🇮🇷 فارسی |
| es | 🇪🇸 Español |
| fr | 🇫🇷 Français |
| de | 🇩🇪 Deutsch |
| tr | 🇹🇷 Türkçe |
| zh | 🇨🇳 中文 |
| ru | 🇷🇺 Русский |
| hi | 🇮🇳 हिन्दी |
| pt | 🇧🇷 Português |
| ja | 🇯🇵 日本語 |
| ko | 🇰🇷 한국어 |

---

## Hardware Requirements

| Model | Minimum RAM | Recommended RAM |
|-------|------------|-----------------|
| phi3 | 4 GB | 8 GB |
| llama3.2 | 8 GB | 16 GB |
| mistral | 8 GB | 16 GB |
| qwen2.5 | 8 GB | 16 GB |

---

## Troubleshooting

### Chatbot shows "Offline"
1. Check Ollama is running: `systemctl status ollama`
2. Verify the URL in plugin settings
3. Check firewall allows port 11434

### Translation returns errors
1. Make sure you have a multilingual model (qwen2.5 or mistral)
2. Check Ollama logs: `journalctl -u ollama -f`

### Slow responses
1. Use a smaller model (phi3)
2. Increase server RAM
3. Run: `ollama serve --num-ctx 4096`

### CORS issues (if Ollama on different server)
Start Ollama with:
```bash
OLLAMA_ORIGINS=* ollama serve
```

---

## Security Notes

- All AI processing happens **locally** — no data is sent to external servers
- The Ollama API should be accessible only from your WordPress server
- For production, restrict Ollama access with a firewall rule

---

## Support

📧 Email: info@aras-cpa.com
📞 Phone: (205) 555-0100
🌐 Website: https://aras-cpa.com/
