# Widget Management System - به‌روزرسانی برای PostgreSQL Local

## ✅ تغییرات انجام شده

### 1. `widgetRoutes.js` - به‌روزرسانی شد
- ❌ حذف استفاده از `req.supabase`
- ✅ استفاده از `pool` از `db-postgres.js`
- ✅ Query های SQL مستقیم با parameterized statements
- ✅ Error handling مناسب برای PostgreSQL

### 2. `PROJECT_INFO.md` - ساخته شد
- ⚠️ مستندسازی: **دیتابیس local است (نه Supabase)**
- 📝 راهنمای استفاده از PostgreSQL
- 🔧 نحوه اجرای migrations
- ✅ مثال‌های کد صحیح و غلط

---

## 📋 ад امات بعدی

### 1. اضافه کردن migration به initDB
```javascript
// در backend/initDB-postgres.js
const queries = [
  // ... existing queries ...
  
  // اضافه کردن widgets table
  `CREATE TABLE IF NOT EXISTS widgets (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('calendar', 'qr-generator', 'audio-sync', 'bible-unified')),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    position VARCHAR(50) NOT NULL CHECK (position IN ('homepage-hero', 'homepage-sidebar', 'sidebar-global', 'footer', 'admin-tools')),
    order_index INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(type, position)
  );`
];
```

### 2. Register routes در server.js
```javascript
// Import
const widgetRoutes = require('./routes/widgetRoutes');

// Register
app.use('/api/widgets', widgetRoutes);
```

### 3. تست API
```bash
# با curl
curl http://localhost:3001/api/widgets

# یا با browser
http://localhost:3001/api/widgets
```

---

## ✅ Checklist

- [x] `widgetRoutes.js` به‌روزرسانی شد (PostgreSQL)
- [x] `PROJECT_INFO.md` ساخته شد
- [ ] Migration به `initDB-postgres.js` اضافه شود
- [ ] Routes در `server.js` register شود
- [ ] تست API
- [ ] Frontend components ساخته شوند

---

## 🔧 نکات فنی

### استفاده صحیح از Pool:
```javascript
const { pool } = require('../db-postgres');

// Query با parameters
const result = await pool.query(
  'SELECT * FROM widgets WHERE id = $1',
  [id]
);
```

### Error Handling:
```javascript
try {
  const result = await pool.query(...);
  res.json(result.rows);
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'Message' });
}
```

### JSONB در PostgreSQL:
```javascript
// ذخیره
settings: JSON.stringify(settingsObject)

// خواندن (PostgreSQL خودش parse می‌کند)
const widget = result.rows[0];
const settings = widget.settings; // Already an object
```

---

**همه چیز آماده است برای استفاده با PostgreSQL Local!** 🎉
