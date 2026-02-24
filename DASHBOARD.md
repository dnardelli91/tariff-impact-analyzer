# Tariff Impact Analyzer - Dashboard

A simple web dashboard to visualize tariff impacts in real-time.

## Quick Start

```bash
# Install dashboard dependencies
npm install express socket.io

# Run with dashboard
npm run dashboard
```

Then open http://localhost:3000

## Features

### Real-time Updates
- WebSocket-powered live updates
- Auto-refresh every 5 minutes
- Manual refresh button

### Sector Overview
- Color-coded impact scores
- Vulnerability ratings
- Stock tickers for each sector

### Historical Timeline
- Interactive chart of past tariff events
- Filter by date range
- Filter by sector

### Alerts Panel
- High-impact notifications
- Alert history
- Configure thresholds

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/analysis | GET | Current sector analysis |
| /api/alerts | GET | Recent alerts |
| /api/history | GET | Historical events |
| /api/sectors | GET | List of tracked sectors |

## WebSocket Events

| Event | Description |
|-------|-------------|
| analysis | New analysis data |
| alert | New high-impact alert |
| sector_update | Sector score change |

## Configuration

```javascript
// config.js
module.exports = {
  port: 3000,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  alertThreshold: 7,
  historyDays: 90
};
```

## Screenshots

See `/docs/screenshots` for examples.

---

*Part of Tariff Impact Analyzer*
