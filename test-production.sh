#!/bin/bash
# Test worship-songs endpoint from production server

echo "🔍 Testing worship-songs API from production server..."
echo ""

# Test 1: Check if backend is running
echo "1️⃣ Checking backend process..."
pm2 describe mychurch-backend | grep -E "status|uptime|memory"
echo ""

# Test 2: Test API locally (from server)
echo "2️⃣ Testing API from localhost..."
curl -s -w "\nHTTP Code: %{http_code}\nTime: %{time_total}s\n" http://localhost:3001/api/worship-songs | head -200
echo ""

# Test 3: Check database connection
echo "3️⃣ Testing database query directly..."
cd /root/Mychurch/backend
node -e "
const {pool} = require('./db-postgres');
pool.query('SELECT COUNT(*) FROM worship_songs')
  .then(r => {
    console.log('✅ Database OK: ' + r.rows[0].count + ' songs');
    return pool.query('SELECT id, title FROM worship_songs LIMIT 3');
  })
  .then(r => {
    console.log('First 3 songs:');
    r.rows.forEach((s, i) => console.log(\`  \${i+1}. \${s.title}\`));
  })
  .catch(e => console.error('❌ DB Error:', e.message))
  .finally(() => pool.end());
"

echo ""
echo "✅ Test complete"
