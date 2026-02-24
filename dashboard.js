/**
 * Tariff Impact Analyzer - Web Dashboard
 * 
 * Usage: node dashboard.js
 * Then open http://localhost:3000
 */

const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API: Get current analysis
app.get('/api/analysis', (req, res) => {
  // In production, this would fetch real data
  const mockData = {
    timestamp: new Date().toISOString(),
    sectors: [
      { name: 'Technology', score: 7.5, vulnerability: 'HIGH', sentiment: 'NEGATIVE' },
      { name: 'Manufacturing', score: 8.2, vulnerability: 'HIGH', sentiment: 'NEGATIVE' },
      { name: 'Agriculture', score: 6.8, vulnerability: 'HIGH', sentiment: 'CAUTIOUS' },
      { name: 'Energy', score: 3.2, vulnerability: 'MEDIUM', sentiment: 'POSITIVE' },
      { name: 'Retail', score: 4.1, vulnerability: 'MEDIUM', sentiment: 'POSITIVE' },
      { name: 'Automotive', score: 7.9, vulnerability: 'HIGH', sentiment: 'NEGATIVE' },
      { name: 'Pharmaceuticals', score: 2.1, vulnerability: 'LOW', sentiment: 'POSITIVE' }
    ],
    overallRisk: 'HIGH'
  };
  
  res.json(mockData);
});

// API: Get alerts
app.get('/api/alerts', (req, res) => {
  const alerts = [
    { id: 1, sector: 'Manufacturing', severity: 8, message: 'New steel tariffs announced', time: '2 hours ago' },
    { id: 2, sector: 'Agriculture', severity: 7, message: 'China retaliatory tariffs', time: '5 hours ago' },
    { id: 3, sector: 'Automotive', severity: 6, message: 'EU tariffs consideration', time: '1 day ago' }
  ];
  
  res.json(alerts);
});

// API: Get historical data
app.get('/api/history', (req, res) => {
  const history = [
    { date: '2026-02-01', event: 'Steel tariffs announced', severity: 7, sector: 'Manufacturing' },
    { date: '2024-05-14', event: 'China EV tariffs', severity: 8, sector: 'Automotive' },
    { date: '2019-05-10', event: 'China tariffs increased', severity: 9, sector: 'Multiple' },
    { date: '2018-03-01', event: 'Trump steel tariffs', severity: 8, sector: 'Manufacturing' }
  ];
  
  res.json(history);
});

// API: Get sectors list
app.get('/api/sectors', (req, res) => {
  const sectors = [
    { name: 'Technology', vulnerability: 'HIGH', stocks: ['AAPL', 'MSFT', 'GOOGL', 'NVDA'] },
    { name: 'Manufacturing', vulnerability: 'HIGH', stocks: ['CAT', 'DE', 'BA'] },
    { name: 'Agriculture', vulnerability: 'HIGH', stocks: ['ADM', 'BG', 'MOS'] },
    { name: 'Energy', vulnerability: 'MEDIUM', stocks: ['XOM', 'CVX', 'COP'] },
    { name: 'Retail', vulnerability: 'MEDIUM', stocks: ['WMT', 'TGT', 'COST'] },
    { name: 'Automotive', vulnerability: 'HIGH', stocks: ['F', 'GM', 'TM'] },
    { name: 'Pharmaceuticals', vulnerability: 'LOW', stocks: ['JNJ', 'PFE', 'MRK'] }
  ];
  
  res.json(sectors);
});

// Dashboard HTML
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tariff Impact Analyzer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; }
    .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
    h1 { color: #60a5fa; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    .card { background: #1e293b; border-radius: 12px; padding: 20px; }
    .card h2 { color: #94a3b8; font-size: 14px; text-transform: uppercase; margin-bottom: 15px; }
    .sector { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #334155; }
    .sector:last-child { border: none; }
    .sector-name { font-weight: 600; }
    .score { font-weight: bold; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
    .score.high { background: #dc2626; color: white; }
    .score.medium { background: #f59e0b; color: black; }
    .score.low { background: #22c55e; color: white; }
    .alert { background: #7f1d1d; padding: 12px; border-radius: 8px; margin-bottom: 10px; }
    .alert-severity { color: #fca5a5; font-size: 12px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .risk-badge { background: #dc2626; padding: 8px 16px; border-radius: 8px; font-weight: bold; }
    .refresh { background: #3b82f6; border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
    .refresh:hover { background: #2563eb; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Tariff Impact Analyzer</h1>
      <button class="refresh" onclick="refresh()">🔄 Refresh</button>
    </div>
    
    <div class="grid">
      <div class="card">
        <h2>Sector Analysis</h2>
        <div id="sectors">Loading...</div>
      </div>
      
      <div class="card">
        <h2>Active Alerts</h2>
        <div id="alerts">Loading...</div>
      </div>
      
      <div class="card">
        <h2>Historical Events</h2>
        <div id="history">Loading...</div>
      </div>
      
      <div class="card">
        <h2>Risk Assessment</h2>
        <div id="risk">Loading...</div>
      </div>
    </div>
  </div>
  
  <script>
    async function refresh() {
      // Sectors
      const sectorsRes = await fetch('/api/analysis');
      const sectorsData = await sectorsRes.json();
      let sectorsHtml = '';
      sectorsData.sectors.forEach(s => {
        const scoreClass = s.score >= 7 ? 'high' : s.score >= 4 ? 'medium' : 'low';
        sectorsHtml += \`<div class="sector">
          <span class="sector-name">\${s.name}</span>
          <span class="score \${scoreClass}">\${s.score}/10</span>
        </div>\`;
      });
      document.getElementById('sectors').innerHTML = sectorsHtml;
      
      // Risk
      const riskColors = { HIGH: '#dc2626', MEDIUM: '#f59e0b', LOW: '#22c55e' };
      document.getElementById('risk').innerHTML = \`
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 48px; color: \${riskColors[sectorsData.overallRisk]}; font-weight: bold;">
            \${sectorsData.overallRisk}
          </div>
          <div style="color: #94a3b8; margin-top: 10px;">Overall Market Risk</div>
        </div>\`;
      
      // Alerts
      const alertsRes = await fetch('/api/alerts');
      const alertsData = await alertsRes.json();
      let alertsHtml = '';
      alertsData.forEach(a => {
        alertsHtml += \`<div class="alert">
          <div style="font-weight: 600;">\${a.sector}</div>
          <div>\${a.message}</div>
          <div class="alert-severity">\${a.time}</div>
        </div>\`;
      });
      document.getElementById('alerts').innerHTML = alertsHtml || '<div style="color: #22c55e;">No active alerts</div>';
      
      // History
      const histRes = await fetch('/api/history');
      const histData = await histRes.json();
      let histHtml = '';
      histData.forEach(h => {
        histHtml += \`<div class="sector">
          <span>\${h.date}</span>
          <span style="color: #94a3b8;">\${h.event}</span>
        </div>\`;
      });
      document.getElementById('history').innerHTML = histHtml;
    }
    
    refresh();
    setInterval(refresh, 300000); // Refresh every 5 min
  </script>
</body>
</html>
  `);
});

server.listen(PORT, () => {
  console.log(\`📊 Dashboard running at http://localhost:\${PORT}\`);
});
