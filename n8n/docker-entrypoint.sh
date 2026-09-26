#!/bin/sh
# n8n workflow auto-import and activation script.
# Runs BEFORE n8n daemon starts to ensure webhooks are registered on first boot.
set -e

echo "📦 StockSense n8n — importing workflows..."

# Import all workflow files
for wf in /workflows/*.json; do
  echo "  → Importing: $wf"
  n8n import:workflow --input="$wf" || echo "  ⚠️  Import skipped (may already exist): $wf"
done

echo "📋 Listing imported workflows..."
n8n list:workflow 2>/dev/null || true

echo "🚀 Starting n8n automation engine..."
exec n8n start
