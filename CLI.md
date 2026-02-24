# Tariff Impact Analyzer - CLI Guide

## Quick Start

```bash
# Install dependencies
npm install

# Run basic analysis
npm start

# Run with specific sector
npm run analyze -- --sector=tech

# Show historical events
npm run history
```

## Command Line Options

### Basic Analysis
```bash
node index.js
```

### Specific Sector Analysis
```bash
# Analyze Technology sector
node index.js --sector=tech

# Analyze Automotive sector
node index.js --sector=automotive

# Analyze Agriculture
node index.js --sector=agriculture
```

### Watch Mode (Continuous)
```bash
# Run every 15 minutes
node index.js --watch

# With Telegram alerts
node index.js --watch --alert --telegram
```

### Historical Data
```bash
# Show historical tariff events
node index.js --history
```

### Output Formats
```bash
# JSON output
node index.js --json

# Pretty output (default)
node index.js
```

### Telegram Alerts
```bash
# Send to Telegram
node index.js --telegram

# Only send if significant impact
node index.js --alert --telegram
```

## Environment Variables

Create a `.env` file:

```bash
# Required for Telegram alerts
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Optional: News API
NEWS_API_KEY=your_api_key
```

## Examples

### Daily Report
```bash
node index.js --sector=all --telegram
```

### High Impact Only
```bash
node index.js --alert --telegram
```

### Watch Mode
```bash
# Run in background
nohup node index.js --watch > /tmp/tariff.log 2>&1 &
```

## Cron Setup

Add to your crontab:

```bash
# Run daily at 8 AM
0 8 * * * /path/to/scripts/daily.sh

# Run every hour during market hours
0 9-16 * * 1-5 /path/to/scripts/hourly.sh
```

## Docker

```bash
# Build
docker build -t tariff-analyzer .

# Run
docker run -d --env-file .env tariff-analyzer

# Docker Compose
docker-compose up -d
```
