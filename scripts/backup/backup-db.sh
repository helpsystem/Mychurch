#!/bin/bash
set -e

# Database backup script
DB_HOST=${DB_HOST:-postgres}
DB_NAME=${DB_NAME:-mychurch}
DB_USER=${DB_USER:-postgres}
BACKUP_DIR=${BACKUP_DIR:-/backups}
RETENTION_DAYS=${RETENTION_DAYS:-30}

echo "Starting database backup at $(date)"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

# Create database dump
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

echo "Backup created: $BACKUP_FILE"

# Check backup integrity
if gzip -t "$BACKUP_FILE"; then
    echo "Backup integrity verified"
else
    echo "Backup integrity check failed!"
    exit 1
fi

# Clean up old backups
echo "Cleaning up old backups (older than $RETENTION_DAYS days)"
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log backup completion
echo "Backup completed successfully at $(date)"
echo "Backup size: $(du -h $BACKUP_FILE | cut -f1)"

# Optional: Upload to cloud storage (uncomment and configure)
# aws s3 cp "$BACKUP_FILE" s3://your-backup-bucket/database-backups/
# echo "Backup uploaded to S3"