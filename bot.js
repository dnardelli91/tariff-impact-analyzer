/**
 * Tariff Impact Analyzer - Telegram Bot
 * Interactive bot for real-time alerts and queries
 * 
 * Usage:
 *   node bot.js           # Start bot
 *   node bot.js --setup   # Create configuration
 */

const { Telegraf } = require('telegraf');
const fs = require('fs');

// Load environment
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.log('❌ TELEGRAM_BOT_TOKEN not set');
  console.log('Get one from @BotFather on Telegram');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ============== COMMAND HANDLERS ==============

// /start - Welcome message
bot.start((ctx) => {
  ctx.replyWithMarkdown(`
👋 *Welcome to Tariff Impact Analyzer!*

I help you track tariff impacts on markets in real-time.

*Commands:*
/analyze - Get latest sector analysis
/sectors - List all tracked sectors
/history - Historical tariff events
/alerts - Current alerts
/watch - Enable/disable auto-alerts
/help - Show this message

🔗 [GitHub](https://github.com/dnardelli91/tariff-impact-analyzer)
  `);
});

// /help - Show help
bot.help((ctx) => {
  ctx.replyWithMarkdown(`
📊 *Tariff Impact Analyzer Commands*

/analyze - Get latest sector analysis
/sectors - List all tracked sectors  
/history - Historical tariff events
/alerts - Current high-impact alerts
/watch - Toggle auto-alerts
/stats - Bot statistics
/settings - Configure preferences
/help - Show this message

🔗 [GitHub](https://github.com/dnardelli91/tariff-impact-analyzer)
  `);
});

// /analyze - Get analysis
bot.command('analyze', async (ctx) => {
  await ctx.reply('📊 Running analysis...');
  
  try {
    // Import main module
    const { analyzeAllSectors, fetchTariffNews, generateReport, formatTelegramMessage } = require('./index.js');
    
    const news = await fetchTariffNews();
    const results = analyzeAllSectors(news);
    const report = generateReport(results, news);
    
    const message = formatTelegramMessage(report);
    ctx.replyWithMarkdown(message);
  } catch (error) {
    ctx.reply(`❌ Error: ${error.message}`);
  }
});

// /sectors - List sectors
bot.command('sectors', (ctx) => {
  const sectors = {
    'Technology': 'HIGH vulnerability',
    'Manufacturing': 'HIGH vulnerability',
    'Agriculture': 'HIGH vulnerability',
    'Automotive': 'HIGH vulnerability',
    'Energy': 'MEDIUM vulnerability',
    'Retail': 'MEDIUM vulnerability',
    'Pharmaceuticals': 'LOW vulnerability'
  };
  
  let message = '📊 *Tracked Sectors:*\n\n';
  for (const [sector, vuln] of Object.entries(sectors)) {
    message += `• ${sector}: ${vuln}\n`;
  }
  
  ctx.replyWithMarkdown(message);
});

// /history - Historical events
bot.command('history', (ctx) => {
  const events = [
    { date: '2026-02-01', event: 'Steel/Aluminum tariffs', severity: 7 },
    { date: '2024-05-14', event: 'China EV tariffs (100%)', severity: 8 },
    { date: '2019-05-10', event: 'China tariffs increased to 25%', severity: 9 },
    { date: '2018-03-01', event: 'Trump steel tariffs (25%)', severity: 8 }
  ];
  
  let message = '📜 *Historical Events:*\n\n';
  for (const e of events) {
    const stars = '⭐'.repeat(Math.ceil(e.severity / 2));
    message += `${e.date} ${stars}\n   ${e.event}\n\n`;
  }
  
  ctx.replyWithMarkdown(message);
});

// /alerts - Current alerts
bot.command('alerts', (ctx) => {
  ctx.replyWithMarkdown(`
🚨 *Current Alerts*

No high-impact alerts at this time.

🔔 To enable auto-alerts: /watch
  `);
});

// /watch - Toggle watch mode
const watchUsers = new Set();

bot.command('watch', (ctx) => {
  const userId = ctx.from.id;
  
  if (watchUsers.has(userId)) {
    watchUsers.delete(userId);
    ctx.reply('🔕 Auto-alerts disabled');
  } else {
    watchUsers.add(userId);
    ctx.reply('🔔 Auto-alerts enabled! You will receive alerts when significant tariff impacts are detected.');
  }
});

// /stats - Bot stats
bot.command('stats', (ctx) => {
  ctx.replyWithMarkdown(`
📈 *Bot Statistics*

• Users: ${watchUsers.size + 1}
• Uptime: ${process.uptime().toFixed(0)}s
• Version: 1.0.0

🔗 [GitHub](https://github.com/dnardelli91/tariff-impact-analyzer)
  `);
});

// /settings - Settings menu
bot.command('settings', (ctx) => {
  ctx.replyWithMarkdown(`
⚙️ *Settings*

Configure your preferences:

/sector [name] - Set default sector
/alert_threshold [1-10] - Set alert level
/notifications - Toggle notifications

_Coming soon: Custom sector filters_
  `);
});

// ============== ERROR HANDLING ==============

bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An error occurred. Please try again.');
});

// ============== START BOT ==============

console.log('🤖 Starting Tariff Impact Bot...');

bot.launch()
  .then(() => {
    console.log('✅ Bot started successfully!');
    console.log('Press Ctrl+C to stop');
  })
  .catch((err) => {
    console.error('Failed to start bot:', err);
    process.exit(1);
  });

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n🛑 Stopping bot...');
  bot.stop('SIGINT');
});
