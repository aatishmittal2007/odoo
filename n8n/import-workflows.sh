#!/bin/sh
set -e

echo "⏳ Waiting for n8n to become ready..."
until wget --no-verbose --tries=1 --spider http://localhost:5678/healthz; do
  sleep 2
done

echo "✅ n8n is ready. Importing workflows..."
for wf in /workflows/*.json; do
  if [ -f "$wf" ]; then
    echo "Importing $wf..."
    n8n import:workflow --input="$wf" || true
  fi
done

echo "🎉 All workflows imported successfully!"
