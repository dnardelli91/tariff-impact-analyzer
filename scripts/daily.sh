#!/bin/bash
# Daily Tariff Analysis Script
# Run this via cron: 0 8 * * * /path/to/scripts/daily.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "📊 Running daily tariff analysis..."

# Run analysis
node index.js --json > "reports/daily-$(date +%Y%m%d).json"

# If alert threshold met, send to Telegram
node index.js --alert --telegram

# Save to history
echo "$(date): Daily analysis complete" >> logs/cron.log

echo "✅ Done!"
