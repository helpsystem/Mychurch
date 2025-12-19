# 📋 دستورات Deploy به ترتیب - اجرا کنید توی SSH سرور

# ═══════════════════════════════════════
# قدم 1: رفتن به پوشه پروژه
# ═══════════════════════════════════════
cd ~/Mychurch

# ═══════════════════════════════════════
# قدم 2: دریافت آخرین تغییرات
# ═══════════════════════════════════════
git stash
git pull origin main

# اگر خطا داد، این دستور رو اجرا کنید:
# git fetch origin && git reset --hard origin/main

# ═══════════════════════════════════════
# قدم 3: نصب Dependencies
# ═══════════════════════════════════════
npm install --production
cd backend && npm install --production && cd ..

# ═══════════════════════════════════════
# قدم 4: Build Production
# ═══════════════════════════════════════
npm run build

# ═══════════════════════════════════════
# قدم 5: Deploy Frontend
# ═══════════════════════════════════════
sudo mkdir -p /var/www/html/Mychurch
sudo cp -r dist/* /var/www/html/Mychurch/
sudo chown -R www-data:www-data /var/www/html/Mychurch

# ═══════════════════════════════════════
# قدم 6: نصب PM2 (اگه نداره)
# ═══════════════════════════════════════
# بررسی PM2:
pm2 --version

# اگر PM2 نداره، نصب کنید:
# sudo npm install -g pm2

# ═══════════════════════════════════════
# قدم 7: راه‌اندازی Backend
# ═══════════════════════════════════════
cd backend

# ایجاد .env اگه نداره:
if [ ! -f ".env" ]; then cp ../.env .env; fi

# استارت Backend با PM2:
pm2 start server.js --name mychurch-backend
pm2 save
pm2 startup

cd ..

# ═══════════════════════════════════════
# قدم 8: Health Check
# ═══════════════════════════════════════
sleep 3
curl http://localhost:3001/api/health

# ═══════════════════════════════════════
# قدم 9: بررسی وضعیت
# ═══════════════════════════════════════
pm2 status
pm2 logs mychurch-backend --lines 20

# ═══════════════════════════════════════
# ✅ تمام! سایت شما آماده است:
# ═══════════════════════════════════════
# Frontend: http://samanabyar.online
# Backend: http://samanabyar.online/api
# 
# دستورات مفید:
#   pm2 logs mychurch-backend    # لاگ‌ها
#   pm2 restart mychurch-backend # ری‌استارت
#   pm2 stop mychurch-backend    # متوقف کردن
