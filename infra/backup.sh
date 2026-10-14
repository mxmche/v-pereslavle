#!/usr/bin/env bash
# Nightly: pg_dump → S3 (Timeweb). Requires aws CLI configured with S3_ENDPOINT/S3_BUCKET.
set -euo pipefail
FILE="vp-$(date +%F).sql.gz"
docker compose exec -T postgres pg_dump -U vp vp | gzip > "/tmp/$FILE"
aws --endpoint-url "$S3_ENDPOINT" s3 cp "/tmp/$FILE" "s3://$S3_BUCKET/backups/$FILE"
rm "/tmp/$FILE"
