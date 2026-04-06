$nginxConf = Get-Content ".\vps-nginx.txt" -Raw

# Replace everything from the API proxy marker to the end of the file
$pattern = "(?s)    # API Proxy - .*"
$replacement = @"
    # Protected old media folders (Bibles, audio, uploads, etc.)
    location ~ ^/(uploads|audio|images|bible_data|media)/ {
        try_files `$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy everything else to Next.js PM2 instance (Port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
"@

$newNginxConf = $nginxConf -replace $pattern, $replacement

# Use LF instead of CRLF for linux
$newNginxConf = $newNginxConf.Replace("`r`n", "`n")

$newFilePath = ".\vps-nginx-nextjs.conf"
[IO.File]::WriteAllText((Resolve-Path .).Path + "\vps-nginx-nextjs.conf", $newNginxConf)

Write-Host "Generated vps-nginx-nextjs.conf locally!" -ForegroundColor Green
Write-Host "Uploading to VPS and restarting NGINX..." -ForegroundColor Yellow

scp $newFilePath root@samanabyar.online:/etc/nginx/sites-available/default
if ($?) {
    ssh root@samanabyar.online "if [ -f /etc/nginx/sites-enabled/mychurch ]; then sed -i 's/listen 443 ssl http2;/listen 443 ssl;/g' /etc/nginx/sites-enabled/mychurch; sed -i 's/listen \[::\]:443 ssl http2;/listen [::]:443 ssl;/g' /etc/nginx/sites-enabled/mychurch; sed -i 's/listen \[::\]:443 ssl ipv6only=on;/listen [::]:443 ssl;/g' /etc/nginx/sites-enabled/mychurch; cp /etc/nginx/sites-enabled/mychurch /etc/nginx/sites-available/mychurch || true; fi; if [ -f /etc/nginx/sites-enabled/n8n ]; then sed -i 's/listen 443 ssl http2;/listen 443 ssl;/g' /etc/nginx/sites-enabled/n8n; sed -i 's/listen \[::\]:443 ssl http2;/listen [::]:443 ssl;/g' /etc/nginx/sites-enabled/n8n; sed -i 's/listen \[::\]:443 ssl ipv6only=on;/listen [::]:443 ssl;/g' /etc/nginx/sites-enabled/n8n; fi; find /etc/nginx/sites-enabled -maxdepth 1 -type f -name '*.bak-*' -delete || true; nginx -t && systemctl reload nginx && nginx -t"
    Write-Host "NGINX successfully updated! Your Next.js site is now LIVE!" -ForegroundColor Cyan
}
else {
    Write-Host "Failed to upload NGINX config." -ForegroundColor Red
}
