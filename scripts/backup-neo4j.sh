#!/bin/bash
set -e

BACKUP_DIR="/opt/backups/neo4j"
RETENTION_DAYS=14
TIMESTAMP=$(date +%F_%H%M)

mkdir -p "$BACKUP_DIR"

cd /opt/splitty
docker compose stop neo4j
docker run --rm -v splitty_neo4j_data:/data -v "$BACKUP_DIR":/backup alpine \
  tar czf /backup/neo4j-$TIMESTAMP.tar.gz -C /data .
docker compose start neo4j

# delete backups older than RETENTION_DAYS
find "$BACKUP_DIR" -name "neo4j-*.tar.gz" -mtime +$RETENTION_DAYS -delete
