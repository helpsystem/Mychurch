# دستورالعمل اجرای Migration روی سرور

## روش 1: SSH و اجرای مستقیم

```bash
# 1. اتصال به سرور
ssh user@samanabyar.online

# 2. اجرای migration
PGPASSWORD='MyChurch2024Secure!' psql -h localhost -p 5433 -U mychurch_user -d mychurch -c "
ALTER TABLE leaders 
ADD COLUMN IF NOT EXISTS bio JSONB DEFAULT '{\"fa\": \"\", \"en\": \"\"}'::jsonb,
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
"

# 3. تأیید ستون‌ها
PGPASSWORD='MyChurch2024Secure!' psql -h localhost -p 5433 -U mychurch_user -d mychurch -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leaders' 
AND column_name IN ('bio', 'whatsapp_number');
"
```

## روش 2: از طریق فایل SQL

```bash
# 1. آپلود فایل migration به سرور
scp backend/migrations/add_leader_bio_whatsapp.sql user@samanabyar.online:/tmp/

# 2. SSH به سرور
ssh user@samanabyar.online

# 3. اجرای migration
PGPASSWORD='MyChurch2024Secure!' psql -h localhost -p 5433 -U mychurch_user -d mychurch -f /tmp/add_leader_bio_whatsapp.sql
```

## روش 3: از طریق pgAdmin یا DBeaver

1. اتصال به database با:
   - Host: `samanabyar.online`
   - Port: `5433`
   - Database: `mychurch`
   - User: `mychurch_user`
   - Password: `MyChurch2024Secure!`

2. اجرای این SQL:
```sql
ALTER TABLE leaders 
ADD COLUMN IF NOT EXISTS bio JSONB DEFAULT '{"fa": "", "en": ""}'::jsonb,
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
```

## ⚠️ نکته مهم

اگر خطای **"must be owner of table"** دریافت کردید:
- از یک user با دسترسی بیشتر استفاده کنید (مثلاً `postgres` superuser)
- یا از طریق panel هاستینگ migration را اجرا کنید

## ✅ تأیید موفقیت

بعد از اجرا، این دستور را برای بررسی اجرا کنید:
```bash
PGPASSWORD='MyChurch2024Secure!' psql -h localhost -p 5433 -U mychurch_user -d mychurch -c "\d leaders"
```

باید ستون‌های `bio` و `whatsapp_number` را ببینید.
