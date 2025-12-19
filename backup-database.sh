#!/bin/bash
# Backup Database Script - برای اجرا روی سرور VPS
# این اسکریپت هر شب ساعت 2 بامداد دیتابیس رو backup می‌گیره

# Configuration
DATE=$(date +%Y-%m-%d)
MONTH=$(date +%Y-%m)
DAY_OF_MONTH=$(date +%d)

BACKUP_ROOT="/var/www/storage/backups"
DB_BACKUP_DIR="$BACKUP_ROOT/database"
DAILY_DIR="$DB_BACKUP_DIR/daily"
MONTHLY_DIR="$DB_BACKUP_DIR/monthly"

# Database info (از .env بخون)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mychurch}"
DB_USER="${DB_USER:-postgres}"

# Log file
LOG_FILE="$BACKUP_ROOT/backup.log"

# Functions
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# ایجاد فولدرها
mkdir -p "$DAILY_DIR"
mkdir -p "$MONTHLY_DIR"

log_message "========================================="
log_message "Starting database backup"
log_message "========================================="

# بکاپ روزانه
log_message "Creating daily backup: $DATE.sql"

PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$DAILY_DIR/$DATE.sql"

if [ $? -eq 0 ]; then
    log_message "✅ Daily backup created successfully"
    
    # فشرده‌سازی برای صرفه‌جویی در فضا
    gzip "$DAILY_DIR/$DATE.sql"
    log_message "✅ Backup compressed: $DATE.sql.gz"
    
    # اندازه فایل
    SIZE=$(du -h "$DAILY_DIR/$DATE.sql.gz" | cut -f1)
    log_message "📊 Backup size: $SIZE"
else
    log_message "❌ Daily backup failed!"
    exit 1
fi

# بکاپ ماهیانه (روز اول هر ماه)
if [ "$DAY_OF_MONTH" = "01" ]; then
    log_message "Creating monthly backup: $MONTH.sql"
    
    cp "$DAILY_DIR/$DATE.sql.gz" "$MONTHLY_DIR/$MONTH.sql.gz"
    
    if [ $? -eq 0 ]; then
        log_message "✅ Monthly backup created"
    else
        log_message "⚠️  Monthly backup failed (non-critical)"
    fi
fi

# حذف بکاپ‌های قدیمی‌تر از 30 روز
log_message "Cleaning old backups..."
DELETED=$(find "$DAILY_DIR" -name "*.sql.gz" -mtime +30 -delete -print | wc -l)
log_message "🗑️  Removed $DELETED old backup(s)"

# حذف بکاپ‌های ماهیانه قدیمی‌تر از 12 ماه
DELETED_MONTHLY=$(find "$MONTHLY_DIR" -name "*.sql.gz" -mtime +365 -delete -print | wc -l)
if [ "$DELETED_MONTHLY" -gt 0 ]; then
    log_message "🗑️  Removed $DELETED_MONTHLY old monthly backup(s)"
fi

# آمار فضای استفاده شده
TOTAL_SIZE=$(du -sh "$DB_BACKUP_DIR" | cut -f1)
log_message "📊 Total backup storage: $TOTAL_SIZE"

# تعداد بکاپ‌ها
DAILY_COUNT=$(ls -1 "$DAILY_DIR" | wc -l)
MONTHLY_COUNT=$(ls -1 "$MONTHLY_DIR" | wc -l)
log_message "📊 Daily backups: $DAILY_COUNT files"
log_message "📊 Monthly backups: $MONTHLY_COUNT files"

log_message "========================================="
log_message "Backup completed successfully"
log_message "========================================="

# ارسال نوتیفیکیشن (اختیاری)
# اگه webhook داری می‌تونی uncomment کنی:
# curl -X POST https://your-webhook-url.com/notify \
#   -H "Content-Type: application/json" \
#   -d "{\"message\": \"Database backup completed: $DATE\", \"size\": \"$SIZE\"}"

exit 0
