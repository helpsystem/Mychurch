# اطلاعات مهم پروژه - Church Management System

## 🗄️ Database Configuration

### ⚠️ مهم: دیتابیس محلی است (نه Supabase)

**نوع دیتابیس**: PostgreSQL (Local on Server)

**اتصال**: 
- از Supabase استفاده نمی‌شود
- دیتابیس به صورت local روی سرور نصب است
- باید از PostgreSQL client مستقیم استفاده شود

**محل فایل‌های Migration**:
```
backend/migrations/
```

**نحوه اجرای Migration**:
```bash
# روش 1: با psql
psql -U username -d database_name -f migration_file.sql

# روش 2: از طریق Node.js script
node backend/run-migration.js
```

---

## 📝 Routes که به database متصل هستند

### Routes نیاز به به‌روزرسانی:
- `/api/widgets` - Widget Management (جدید)
- `/api/bible` - Bible content
- `/api/users` - User management
- `/api/worship-songs` - Worship songs
- و سایر routes...

### نکته مهم برای Developers:
- **استفاده از `req.supabase` اشتباه است**
- باید از PostgreSQL client مستقیم استفاده شود
- در `widgetRoutes.js` باید تغییر کند

---

## 🔧 Environment Variables

```env
# Database (PostgreSQL Local)
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=church_db

# نه این (قدیمی):
# SUPABASE_URL=...
# SUPABASE_KEY=...
```

---

## 📚 Tech Stack

### Backend
- Node.js + Express
- PostgreSQL (Local)
- Multer (File upload)
- JWT (Authentication)

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- React Router

---

## 🚨 تغییرات مورد نیاز در کدهای جدید

هر route جدید باید:
1. از `pg` client استفاده کند (نه supabase)
2. Connection pool داشته باشد
3. Error handling مناسب داشته باشد

**مثال صحیح**:
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// در route:
const result = await pool.query('SELECT * FROM widgets');
```

**مثال غلط** (استفاده از Supabase):
```javascript
const { supabase } = req;
const { data } = await supabase.from('widgets').select('*');
```

---

## 📋 Checklist قبل از Deploy

- [ ] همه migrations اجرا شده‌اند
- [ ] Environment variables تنظیم شده‌اند
- [ ] Database connection test شده
- [ ] Routes از PostgreSQL مستقیم استفاده می‌کنند
- [ ] Backup از database گرفته شده

---

## 📞 در صورت مشکل

1. بررسی connection به database
2. بررسی environment variables
3. بررسی permissions در PostgreSQL
4. بررسی migrations اجرا شده‌اند یا نه

---

**آخرین به‌روزرسانی**: 2026-01-20
**نگهداری شده توسط**: Development Team
