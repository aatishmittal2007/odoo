#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL database to become available..."
MAX_RETRIES=30
RETRY_COUNT=0

until npx prisma db push --skip-generate 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Failed to connect to database after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "Database not ready yet (attempt $RETRY_COUNT/$MAX_RETRIES) - waiting 2 seconds..."
  sleep 2
done

echo "✅ PostgreSQL schema synchronized with Prisma!"

# Only seed if database is empty (idempotent — prevents data wipe on container restart)
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then(c => { console.log(c); p.\$disconnect(); }).catch(() => { console.log('0'); p.\$disconnect(); });
" 2>/dev/null || echo "0")

echo "🔍 Current user count: $USER_COUNT"

if [ "$USER_COUNT" = "0" ]; then
  echo "🌱 Seeding StockSense baseline data (first run)..."
  npx tsx prisma/seed.ts || echo "⚠️  Seed encountered an issue — continuing with existing data."
else
  echo "✅ Database already initialized with $USER_COUNT users — skipping seed."
fi

echo "🚀 Launching StockSense Server on port ${PORT:-5000}..."
exec node dist/server.js
