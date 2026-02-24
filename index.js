/**
 * Tariff Impact Analyzer
 * Real-time tariff impact analysis with Telegram alerts
 * 
 * Usage:
 *   node index.js                    # Run analysis
 *   node index.js --watch            # Watch mode (continuous)
 *   node index.js --sector tech     # Analyze specific sector
 *   node index.js --telegram        # Send to Telegram
 *   node index.js --history         # Show historical events
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ============== CONFIGURATION ==============
const CONFIG = {
  // Telegram config (set via environment)
  TELEGRAM: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID
  },
  
  // News API (set via environment)
  NEWS_API_KEY: process.env.NEWS_API_KEY,
  
  // Alert settings
  ALERT_THRESHOLD: 3, // Number of significant news to trigger alert
  MIN_IMPACT_SCORE: 5, // Minimum impact score for alert
  
  // Sectors to track
  SECTORS: {
    'Technology': {
      stocks: ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'TSLA', 'AMD', 'INTC'],
      keywords: ['semiconductor', 'chip', 'tech', 'AI', 'software', 'cloud'],
      tariff_vulnerability: 'HIGH'
    },
    'Manufacturing': {
      stocks: ['CAT', 'DE', 'BA', 'GE', 'MMM', 'HON'],
      keywords: ['manufacturing', 'industrial', 'factory', 'steel', 'aluminum'],
      tariff_vulnerability: 'HIGH'
    },
    'Energy': {
      stocks: ['XOM', 'CVX', 'COP', 'SLB', 'EOG'],
      keywords: ['energy', 'oil', 'gas', ' LNG', 'petroleum'],
      tariff_vulnerability: 'MEDIUM'
    },
    'Agriculture': {
      stocks: ['ADM', 'BG', 'MOS', 'FDP', 'TR'],
      keywords: ['agriculture', 'farm', 'soy', 'corn', 'wheat', 'pork', 'soybean'],
      tariff_vulnerability: 'HIGH'
    },
    'Retail': {
      stocks: ['WMT', 'TGT', 'COST', 'HD', 'LOW', 'TJX'],
      keywords: ['retail', 'consumer', 'import', 'warehouse'],
      tariff_vulnerability: 'MEDIUM'
    },
    'Automotive': {
      stocks: ['F', 'GM', 'TM', 'HMC', 'STLA'],
      keywords: ['automotive', 'car', 'vehicle', 'auto', 'EV'],
      tariff_vulnerability: 'HIGH'
    },
    'Pharmaceuticals': {
      stocks: ['JNJ', 'PFE', 'UNH', 'MRK', 'ABBV'],
      keywords: ['pharma', 'drug', 'medical', 'healthcare'],
      tariff_vulnerability: 'LOW'
    }
  },
  
  // Keywords to track
  TARIFF_KEYWORDS: [
    'tariff', 'tariffs', 'trade war', 'customs duty', 'import tax',
    'reciprocal tariff', 'Section 232', 'Section 301', 'dumping',
    'subsidy', 'countervailing duty', 'import quota', 'embargo'
  ],
  
  COUNTRIES: ['China', 'USA', 'EU', 'Mexico', 'Canada', 'Japan', 'Korea', 'India', 'Vietnam', 'Taiwan']
};

// ============== HISTORICAL DATA ==============
const HISTORICAL_EVENTS = [
  // 2018 Trade War
  { date: '2018-03-01', event: 'Trump announces steel tariffs (25%)', impact: 'Steel +25%, Markets -2%', sector: 'Manufacturing', severity: 8 },
  { date: '2018-04-02', event: 'China tariffs on pork ($500M)', impact: 'Pork sector -8%', sector: 'Agriculture', severity: 7 },
  { date: '2018-06-15', event: 'China tariffs on $50B goods', impact: 'China markets -4%', sector: 'Technology', severity: 7 },
  { date: '2018-07-06', event: 'China tariffs on $34B US goods', impact: 'Escalation continues', sector: 'Multiple', severity: 8 },
  { date: '2018-08-23', event: 'China tariffs on $60B US goods', impact: 'Further escalation', sector: 'Multiple', severity: 8 },
  { date: '2019-05-10', event: 'China tariffs increased to 25%', impact: 'Markets -3%', sector: 'Multiple', severity: 9 },
  { date: '2019-08-02', event: 'Trump threatens more tariffs', impact: 'Markets -3%', sector: 'Multiple', severity: 8 },
  
  // 2020-2021
  { date: '2020-01-15', event: 'Phase One Trade Deal', impact: 'Temporary relief', sector: 'Multiple', severity: 4 },
  { date: '2021-03-18', event: 'Trump tariffs on aluminum (10%)', impact: 'Metal costs rise', sector: 'Manufacturing', severity: 5 },
  
  // 2024
  { date: '2024-05-14', event: 'China tariffs on EVs (100%)', impact: 'EV sector -6%', sector: 'Automotive', severity: 8 },
  { date: '2024-08-01', event: 'Canada tariffs on Chinese EVs', impact: 'EV sector -3%', sector: 'Automotive', severity: 6 },
  
  // 2025-2026
  { date: '2025-01-20', event: 'Trump inauguration - tariff threats', impact: 'Market uncertainty', sector: 'Multiple', severity: 6 },
  { date: '2026-02-01', event: 'Steel/Aluminum tariffs announced', impact: 'Under analysis', sector: 'Manufacturing', severity: 7 }
];

// ============== CLI PARSER ==============
const args = process.argv.slice(2);
const COMMANDS = {
  '--help': 'Show help',
  '--watch': 'Run in watch mode (continuous)',
  '--sector': 'Analyze specific sector (e.g., --sector tech)',
  '--telegram': 'Send results to Telegram',
  '--history': 'Show historical tariff events',
  '--json': 'Output as JSON',
  '--alert': 'Send alert if significant'
};

function showHelp() {
  console.log(`
📊 Tariff Impact Analyzer v1.0.0

Usage: node index.js [options]

Options:
  --sector <name>    Analyze specific sector (tech, manufacturing, energy, agriculture, retail, automotive, pharma)
  --watch            Run continuously (every 15 min)
  --telegram         Send results to Telegram
  --history          Show historical tariff events
  --json             Output as JSON
  --alert            Send alert if significant impact detected
  --help             Show this help message

Examples:
  node index.js --sector tech
  node index.js --sector automotive --telegram
  node index.js --watch --alert

Environment Variables:
  TELEGRAM_BOT_TOKEN   Your Telegram bot token
  TELEGRAM_CHOT_ID     Your Telegram chat ID
  NEWS_API_KEY         Your News API key
`);
}

// ============== NEWS FETCHER ==============
async function fetchTariffNews() {
  console.log('📰 Fetching latest tariff news...');
  
  // Mock data - in production, integrate real APIs
  const mockNews = [
    {
      title: 'Trump administration announces new steel tariffs',
      description: '25% tariff on all steel imports, effective immediately',
      source: 'Reuters',
      url: 'https://reuters.com/...',
      publishedAt: new Date().toISOString(),
      country: 'USA',
      keywords: ['steel', 'tariff', 'import']
    },
    {
      title: 'China responds with tariffs on US agriculture',
      description: 'China announces 25% tariff on US agricultural products',
      source: 'Bloomberg',
      url: 'https://bloomberg.com/...',
      publishedAt: new Date().toISOString(),
      country: 'China',
      keywords: ['china', 'agriculture', 'tariff']
    },
    {
      title: 'EU considers counter-measures to US tariffs',
      description: 'European Union preparing retaliatory tariffs on US goods',
      source: 'Financial Times',
      url: 'https://ft.com/...',
      publishedAt: new Date().toISOString(),
      country: 'EU',
      keywords: ['EU', 'tariff', 'retaliation']
    }
  ];
  
  return mockNews;
}

// ============== ANALYSIS ENGINE ==============
function analyzeSector(sectorName, news) {
  const sector = CONFIG.SECTORS[sectorName];
  if (!sector) {
    throw new Error(`Unknown sector: ${sectorName}`);
  }
  
  // Count relevant news
  let relevantCount = 0;
  const relevantNews = [];
  
  for (const article of news) {
    const text = (article.title + ' ' + article.description).toLowerCase();
    
    // Check for sector keywords
    const hasSectorKeyword = sector.keywords.some(k => text.includes(k.toLowerCase()));
    // Check for tariff keywords
    const hasTariffKeyword = CONFIG.TARIFF_KEYWORDS.some(k => text.includes(k.toLowerCase()));
    
    if (hasSectorKeyword && hasTariffKeyword) {
      relevantCount++;
      relevantNews.push(article);
    }
  }
  
  // Calculate impact score (0-10)
  let impactScore = 0;
  if (relevantCount > 0) {
    impactScore = Math.min(10, relevantCount * 2 + (sector.tariff_vulnerability === 'HIGH' ? 2 : 0));
  }
  
  // Determine sentiment
  const sentiment = impactScore > 6 ? '🔴 NEGATIVE' : impactScore > 3 ? '🟡 CAUTIOUS' : '🟢 POSITIVE';
  
  return {
    sector: sectorName,
    impactScore: impactScore.toFixed(1),
    sentiment,
    vulnerability: sector.tariff_vulnerability,
    relevantNewsCount: relevantCount,
    relevantNews: relevantNews.slice(0, 3),
    stocks: sector.stocks,
    recommendation: generateRecommendation(sectorName, impactScore, sector.tariff_vulnerability)
  };
}

function generateRecommendation(sectorName, score, vulnerability) {
  if (score >= 7) {
    return { action: 'AVOID', reason: 'High tariff impact expected', risk: 'HIGH' };
  } else if (score >= 4) {
    return { action: 'CAUTION', reason: 'Monitor closely', risk: 'MEDIUM' };
  } else {
    return { action: 'NEUTRAL', reason: 'Low tariff impact expected', risk: 'LOW' };
  }
}

function analyzeAllSectors(news) {
  const sectors = Object.keys(CONFIG.SECTORS);
  const results = sectors.map(sector => analyzeSector(sector, news));
  
  // Sort by impact score
  return results.sort((a, b) => b.impactScore - a.impactScore);
}

// ============== REPORT GENERATOR ==============
function generateReport(sectorResults, news) {
  const worstSector = sectorResults[0];
  const bestSector = sectorResults[sectorResults.length - 1];
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalNews: news.length,
      sectorsAnalyzed: sectorResults.length,
      highestImpact: worstSector.sector,
      lowestImpact: bestSector.sector,
      overallRisk: worstSector.impactScore > 6 ? 'HIGH' : worstSector.impactScore > 3 ? 'MEDIUM' : 'LOW'
    },
    sectors: sectorResults,
    historicalContext: HISTORICAL_EVENTS.slice(0, 5),
    recommendations: {
      avoid: sectorResults.filter(s => s.impactScore >= 7).map(s => s.sector),
      cautious: sectorResults.filter(s => s.impactScore >= 4 && s.impactScore < 7).map(s => s.sector),
      safe: sectorResults.filter(s => s.impactScore < 4).map(s => s.sector)
    }
  };
  
  return report;
}

function formatTelegramMessage(report) {
  let message = '📊 *TARIFF IMPACT REPORT* 📊\n\n';
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🕐 ${new Date().toLocaleString()}\n\n`;
  
  message += `*⚠️ HIGH RISK SECTORS:*\n`;
  for (const sector of report.sectors.filter(s => s.impactScore >= 5)) {
    message += `• ${sector.sector}: ${sector.impactScore}/10 ${sector.sentiment}\n`;
  }
  
  message += `\n*📈 RECOMMENDATIONS:*\n`;
  if (report.recommendations.avoid.length > 0) {
    message += `🔴 AVOID: ${report.recommendations.avoid.join(', ')}\n`;
  }
  if (report.recommendations.cautious.length > 0) {
    message += `🟡 CAUTION: ${report.recommendations.cautious.join(', ')}\n`;
  }
  if (report.recommendations.safe.length > 0) {
    message += `🟢 SAFE: ${report.recommendations.safe.join(', ')}\n`;
  }
  
  message += `\n_Analysis based on ${report.summary.totalNews} news items_`;
  
  return message;
}

// ============== TELEGRAM ==============
async function sendToTelegram(message) {
  if (!CONFIG.TELEGRAM.botToken || !CONFIG.TELEGRAM.chatId) {
    console.log('⚠️ Telegram not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID');
    return false;
  }
  
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM.botToken}/sendMessage`;
  
  const payload = {
    chat_id: CONFIG.TELEGRAM.chatId,
    text: message,
    parse_mode: 'Markdown'
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error('Telegram error:', error.message);
    return false;
  }
}

// ============== MAIN ==============
async function main() {
  // Show help if requested
  if (args.includes('--help')) {
    showHelp();
    process.exit(0);
  }
  
  console.log('📊 Tariff Impact Analyzer v1.0.0\n');
  
  // Parse commands
  const sectorArg = args.find(a => a.startsWith('--sector='))?.split('=')[1] || 
                    args[args.indexOf('--sector') + 1];
  const watchMode = args.includes('--watch');
  const sendTelegram = args.includes('--telegram');
  const showHistory = args.includes('--history');
  const jsonOutput = args.includes('--json');
  const alertMode = args.includes('--alert');
  
  // Show historical events
  if (showHistory) {
    console.log('📜 HISTORICAL TARIFF EVENTS:\n');
    HISTORICAL_EVENTS.forEach(e => {
      console.log(`${e.date} | ${e.event}`);
      console.log(`   Impact: ${e.impact} | Severity: ${e.severity}/10\n`);
    });
    process.exit(0);
  }
  
  // Run analysis
  const news = await fetchTariffNews();
  
  let results;
  if (sectorArg) {
    // Single sector analysis
    const sectorName = sectorArg.charAt(0).toUpperCase() + sectorArg.slice(1).toLowerCase();
    results = [analyzeSector(sectorName, news)];
  } else {
    // All sectors
    results = analyzeAllSectors(news);
  }
  
  const report = generateReport(results, news);
  
  // Output
  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('\n📊 SECTOR ANALYSIS:\n');
    for (const r of results) {
      console.log(`${r.sector.padEnd(18)} ${r.impactScore}/10 ${r.sentiment} [${r.vulnerability}]`);
    }
    console.log('\n💡 RECOMMENDATIONS:');
    console.log(`   AVOID:    ${report.recommendations.avoid.join(', ') || 'None'}`);
    console.log(`   CAUTION:  ${report.recommendations.cautious.join(', ') || 'None'}`);
    console.log(`   SAFE:     ${report.recommendations.safe.join(', ') || 'None'}`);
  }
  
  // Telegram
  if (sendTelegram || alertMode) {
    const message = formatTelegramMessage(report);
    
    if (alertMode && results[0].impactScore < CONFIG.MIN_IMPACT_SCORE) {
      console.log('\n⚠️ No significant alerts (threshold not met)');
    } else {
      console.log('\n📱 Sending to Telegram...');
      const sent = await sendToTelegram(message);
      console.log(sent ? '✅ Sent successfully!' : '❌ Failed to send');
    }
  }
  
  // Save report
  const filename = `tariff-report-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\n💾 Report saved to: ${filename}`);
  
  // Watch mode
  if (watchMode) {
    console.log('\n🔄 Watch mode enabled. Running every 15 minutes...');
    setInterval(async () => {
      console.log('\n--- Running analysis ---');
      const n = await fetchTariffNews();
      const r = analyzeAllSectors(n);
      const rep = generateReport(r, n);
      
      console.log('\n📊 SECTOR ANALYSIS:');
      for (const s of r) {
        console.log(`${s.sector.padEnd(18)} ${s.impactScore}/10 ${s.sentiment}`);
      }
      
      if (r[0].impactScore >= CONFIG.MIN_IMPACT_SCORE) {
        const msg = formatTelegramMessage(rep);
        await sendToTelegram(msg);
        console.log('✅ Alert sent!');
      }
    }, 15 * 60 * 1000); // 15 minutes
  }
}

// Run
main().catch(console.error);
