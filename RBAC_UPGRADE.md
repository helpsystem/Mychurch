# 🔐 MyChurch RBAC — سیستم مدیریت سطوح دسترسی

## معماری جدید (Architecture)

### مشکلات قبلی (قبل از این ارتقا)
| مشکل | توضیح |
|---|---|
| **DB ناسازگار** | دیتابیس فقط ۳ نقش قبول می‌کرد (`USER`, `MANAGER`, `SUPER_ADMIN`) اما کد ۵+ نقش استفاده می‌کرد |
| **تک‌نقشی** | هر کاربر فقط یک نقش داشت — امکان Multi-role نبود |
| **JWT ناقص** | توکن فقط `email`, `role`, `name` داشت — بدون permissions |
| **permissions بلااستفاده** | ستون `permissions` در دیتابیس بود ولی هیچ‌جا بررسی نمی‌شد |

### راه‌حل پیاده‌سازی شده
```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Database   │────▶│   Backend    │────▶│    Frontend     │
│              │     │              │     │                 │
│ users.role   │     │ config/      │     │ types.ts        │
│ users.roles  │     │  roles.js    │     │  UserRole       │
│ users.perms  │     │              │     │  User.roles     │
│              │     │ middleware/  │     │  User.perms     │
│              │     │  auth.js    │     │                 │
│              │     │              │     │ AuthContext      │
│              │     │ JWT token:  │     │  hasPermission  │
│              │     │  role       │     │  hasRole        │
│              │     │  roles[]    │     │  canEdit        │
│              │     │  perms[]    │     │                 │
│              │     │  email      │     │ ProtectedRoute  │
│              │     │  name       │     │  roles + perm   │
└─────────────┘     └──────────────┘     └─────────────────┘
```

---

## نقش‌ها (Roles)

| نقش | سطح | توضیح |
|---|---|---|
| `USER` | 1 | عضو عادی — فقط مشاهده |
| `LEADER` | 2 | رهبر کلیسا — مدیریت موعظه‌ها، رویدادها، اعلان‌ها |
| `WORSHIP_LEADER` | 2 | رهبر پرستش — مدیریت موزیک، پخش زنده، اسلایدها |
| `MANAGER` | 3 | مدیر — همه امکانات LEADER + WORSHIP_LEADER + مدیریت کاربران |
| `SUPER_ADMIN` | 4 | مدیر ارشد — دسترسی کامل به همه بخش‌ها (`*`) |

### قابلیت چند‌نقشی (Multi-Role)
یک کاربر می‌تواند **چندین نقش همزمان** داشته باشد:
```json
{
  "email": "ali@church.com",
  "role": "WORSHIP_LEADER",
  "roles": ["LEADER", "WORSHIP_LEADER"]
}
```
در این حالت، علی دسترسی‌های **هر دو نقش** را دارد.

---

## مجوزها (Permissions)

فرمت: `resource:action`

### لیست کامل مجوزها

| دسته | مجوز | توضیح |
|---|---|---|
| **پرستش** | `worship:read` | مشاهده آهنگ‌ها |
| | `worship:edit` | ویرایش آهنگ‌ها |
| | `worship:delete` | حذف آهنگ‌ها |
| | `worship:manage` | مدیریت کامل پرستش |
| **کتاب‌مقدس** | `bible:read` | مشاهده آیات |
| | `bible:edit` | ویرایش ترجمه‌ها |
| | `bible:audio` | مدیریت صدای کتاب‌مقدس |
| **پخش زنده** | `broadcast:view` | مشاهده پخش |
| | `broadcast:control` | کنترل اسلایدها و دوربین |
| | `broadcast:settings` | تنظیمات پخش |
| | `broadcast:ai` | قابلیت‌های AI (زیرنویس زنده) |
| **موعظه‌ها** | `sermons:read/edit/delete` | |
| **رویدادها** | `events:read/edit/delete/record` | |
| **کاربران** | `users:read/edit/delete/roles` | |
| **تنظیمات** | `settings:read/edit` | |
| **فایل‌ها** | `files:read/upload/delete` | |
| **صفحات** | `pages:read/edit` | |
| **اعلان‌ها** | `announcements:read/edit` | |
| **ارائه‌ها** | `presentations:read/edit` | |
| **آنالیتیکس** | `analytics:view` | |
| **ارتباطات** | `communications:read/send` | |
| **wildcard** | `*` | دسترسی کامل (فقط SUPER_ADMIN) |

### نگاشت پیش‌فرض نقش → مجوز

```
USER ──────────── خواندن تمام بخش‌ها (read-only)
                  │
LEADER ───────── sermons:edit, events:edit, events:record
                  broadcast:view, announcements:edit
                  files:upload, daily_content:edit
                  letters:edit, prayer:manage
                  │
WORSHIP_LEADER ─ worship:edit, worship:manage
                  broadcast:view, broadcast:control, broadcast:ai
                  presentations:edit, bible:audio
                  files:upload
                  │
MANAGER ──────── همه موارد LEADER + WORSHIP_LEADER
                  + users:read/edit, settings:read
                  + files:delete, analytics:view
                  + pages:edit, galleries:edit
                  + communications:send
                  │
SUPER_ADMIN ──── * (همه مجوزها)
```

---

## JWT Token (بهینه‌شده)

### قبل از ارتقا:
```json
{ "email": "user@ex.com", "role": "USER", "name": "Ali" }
```

### بعد از ارتقا:
```json
{
  "email": "user@ex.com",
  "role": "WORSHIP_LEADER",
  "roles": ["LEADER", "WORSHIP_LEADER"],
  "permissions": ["bible:read", "worship:read", "worship:edit", "broadcast:view", "broadcast:control", ...],
  "name": "Ali"
}
```

مزیت: فرانت‌اند **بدون API call اضافی** می‌تواند دسترسی کاربر را بررسی کند.

---

## فایل‌های تغییر‌یافته

### Backend
| فایل | تغییر |
|---|---|
| `backend/config/roles.js` | **جدید** — تعریف نقش‌ها، مجوزها، نگاشت‌ها |
| `backend/middleware/auth.js` | ارتقا — `authorizePermissions()`, `authorizeAllPermissions()` اضافه شد |
| `backend/routes/authRoutes.js` | ارتقا — JWT شامل `roles[]` و `permissions[]` |
| `backend/routes/userRoutes.js` | ارتقا — `PUT /roles` endpoint + multi-role support |
| `backend/initDB-postgres.js` | ارتقا — schema شامل 5 نقش + ستون `roles` |
| `backend/migrations/rbac_upgrade.sql` | **جدید** — migration دیتابیس |
| `backend/migrations/create_tables.sql` | ارتقا — CHECK constraint جدید |
| `backend/scripts/run-rbac-migration.js` | **جدید** — اجرای migration |

### Frontend
| فایل | تغییر |
|---|---|
| `frontend/src/types.ts` | `UserRole` type + `User.roles` + `AuthContextType.hasPermission/hasRole` |
| `frontend/src/context/AuthContext.tsx` | `hasPermission()`, `hasRole()`, `updateUserRoles()` |
| `frontend/src/components/ProtectedRoute.tsx` | multi-role + permission-based routing |
| `frontend/src/lib/auth.ts` | `updateUserRoles()` API call |

---

## مراحل Deploy

### 1. اجرای Migration دیتابیس
```bash
# از طریق runner script:
cd backend
node scripts/run-rbac-migration.js

# یا مستقیم از SQL:
psql -U your_user -d your_db -f migrations/rbac_upgrade.sql
```

### 2. Deploy بک‌اند
```bash
# Build و deploy معمولی — تغییرات backward compatible هستند
```

### 3. Deploy فرانت‌اند
```bash
npm run build
# Deploy dist/
```

### Backward Compatibility
- ✅ کاربران قبلی با JWT قدیمی همچنان کار می‌کنند (middleware fallback)
- ✅ `role` (تک‌نقشی) هنوز برگردانده می‌شود + `roles` (چند‌نقشی)
- ✅ API‌های قبلی (`PUT /role`, `PUT /permissions`) بدون تغییر کار می‌کنند

---

## API Endpoints جدید

### `PUT /api/users/:email/roles`
تنظیم نقش‌های یک کاربر (Multi-role):
```json
// Request
PUT /api/users/ali@church.com/roles
{ "roles": ["LEADER", "WORSHIP_LEADER"] }

// Response
{ "success": true, "user": { ... } }
```

### `GET /api/users/roles/definitions`
دریافت لیست نقش‌ها و مجوزهای قابل‌استفاده (برای UI مدیریت):
```json
// Response
{
  "roles": ["USER", "LEADER", "WORSHIP_LEADER", "MANAGER", "SUPER_ADMIN"],
  "permissions": ["worship:read", "worship:edit", ...],
  "rolePermissions": { "USER": [...], "LEADER": [...], ... }
}
```

---

## مثال استفاده در کد

### Backend — بررسی مجوز:
```javascript
const { authorizePermissions } = require('../middleware/auth');

// فقط کسانی که مجوز ویرایش پرستش دارند:
router.put('/worship/:id', 
  authenticateToken, 
  authorizePermissions('worship:edit'),
  async (req, res) => { ... }
);
```

### Frontend — بررسی مجوز:
```tsx
const { hasPermission, hasRole } = useAuth();

// بررسی مجوز خاص:
if (hasPermission('worship:edit')) {
  // نمایش دکمه ویرایش
}

// بررسی نقش:
if (hasRole('WORSHIP_LEADER')) {
  // نمایش بخش پرستش
}
```

### Frontend — ProtectedRoute با permission:
```tsx
<ProtectedRoute permission="broadcast:control">
  <BroadcastConsole />
</ProtectedRoute>
```
