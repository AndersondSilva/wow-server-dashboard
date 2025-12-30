#!/bin/bash

set -e

BACKUP_DIR="/var/backups/wow-server"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

echo "Iniciando backup do banco de dados WoW..."

DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-wowuser}"
DB_PASS="${DB_PASS}"

if [ -z "$DB_PASS" ]; then
  echo "Erro: Defina a variável DB_PASS"
  exit 1
fi

mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS acore_auth > $BACKUP_DIR/acore_auth_$DATE.sql
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS characters > $BACKUP_DIR/characters_$DATE.sql

gzip $BACKUP_DIR/acore_auth_$DATE.sql
gzip $BACKUP_DIR/characters_$DATE.sql

find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup concluído: $BACKUP_DIR/*_$DATE.sql.gz"
echo "Backups antigos (>$RETENTION_DAYS dias) foram removidos"
