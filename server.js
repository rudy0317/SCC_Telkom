const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Load ODP Data into memory for ultra-fast lookup (<1ms)
let odpData = [];
const odpPath = path.join(__dirname, 'odp.json');

if (fs.existsSync(odpPath)) {
  try {
    const raw = fs.readFileSync(odpPath, 'utf8');
    odpData = JSON.parse(raw);
    console.log(`[ODP Engine] Loaded ${odpData.length} ODP records in memory.`);
  } catch (err) {
    console.error('[ODP Engine] Error reading odp.json:', err.message);
  }
}

// 1. ODP Search API Endpoint
app.get('/api/odp/search', (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  if (query.length < 2) {
    return res.json([]);
  }

  const results = [];
  for (const item of odpData) {
    if (item.n && item.n.toLowerCase().includes(query)) {
      results.push({
        id: item.n,
        name: item.n,
        lat: parseFloat(item.la),
        lng: parseFloat(item.lo)
      });
      if (results.length >= 15) break;
    }
  }

  return res.json(results);
});

// 2. Playwright Realtime SSE Streaming Endpoint with Fault-Tolerant Loop
app.post('/api/scc/process-stream', async (req, res) => {
  const { ticketId, nd, lat, lng } = req.body;

  if (!ticketId || !nd || !lat || !lng) {
    return res.status(400).json({ error: 'Missing required parameters (ticketId, nd, lat, lng).' });
  }

  const targetLat = parseFloat(lat);
  const targetLng = parseFloat(lng);

  // Setup Server-Sent Events (SSE) Stream
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event, data) => {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch (e) {}
  };

  sendEvent('status', { message: '🚀 Launching Chromium Native CDP Browser...', color: '#38bdf8' });

  let browser;
  let streamInterval;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    const context = await browser.newContext({
      geolocation: { latitude: targetLat, longitude: targetLng },
      permissions: ['geolocation'],
      viewport: { width: 1280, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // Set Native CDP Geolocation Emulation explicitly
    const client = await context.newCDPSession(page);
    await client.send('Emulation.setGeolocationOverride', {
      latitude: targetLat,
      longitude: targetLng,
      accuracy: 3
    });

    // Start 300ms Realtime Screen Frame Streaming
    streamInterval = setInterval(async () => {
      try {
        if (page && !page.isClosed()) {
          const imgBuffer = await page.screenshot({ type: 'jpeg', quality: 50 });
          sendEvent('frame', { image: `data:image/jpeg;base64,${imgBuffer.toString('base64')}` });
        }
      } catch (e) {}
    }, 300);

    const targetUrl = `https://scc.telkom.co.id/CloseTicket.Internet/Check_embededv1/?ticketId=${encodeURIComponent(ticketId)}&nd=${encodeURIComponent(nd)}`;
    sendEvent('status', { message: `🌐 Navigating to SCC Telkom URL...`, color: '#f59e0b' });

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    sendEvent('status', { message: '⌛ Waiting for SCC Telkom scripts to settle...', color: '#f59e0b' });
    await page.waitForFunction(() => typeof $ !== 'undefined' && typeof doTask === 'function', { timeout: 30000 });

    sendEvent('status', { message: '⚡ Executing doTask() form submit with ODP Geolocation...', color: '#38bdf8' });
    await page.evaluate(({ t, n }) => {
      $('#input-ticket').val(t);
      $('#input-nd').val(n);
      if (typeof doTask === 'function') {
        doTask();
      }
    }, { t: ticketId, n: nd });

    sendEvent('status', { message: '📍 Injecting ODP GPS & Auto-driving QC steps until completion...', color: '#22c55e' });

    // Safe sequential async loop instead of unhandled setInterval inside Promise
    for (let i = 0; i < 45; i++) {
      await page.waitForTimeout(1000);
      try {
        if (page && !page.isClosed()) {
          await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'));
            buttons.forEach(btn => {
              const text = (btn.innerText || btn.value || '').toLowerCase();
              if ((text.includes('continue') || text.includes('lanjut') || text.includes('close ticket') || text.includes('ok')) && !btn.disabled && !btn.classList.contains('hide')) {
                btn.click();
              }
            });
          });
        }
      } catch (e) {}
    }

    sendEvent('status', { message: '✅ QC & Geolocation Injection Full Cycle Finished!', color: '#22c55e' });

    const finalBuffer = await page.screenshot({ type: 'png' });
    sendEvent('frame', { image: `data:image/png;base64,${finalBuffer.toString('base64')}` });
    sendEvent('done', { success: true });

    if (streamInterval) clearInterval(streamInterval);
    await browser.close();
    res.end();

  } catch (error) {
    console.error('[Automation Engine Error]:', error.message);
    if (streamInterval) clearInterval(streamInterval);
    if (browser) await browser.close();

    sendEvent('status', { message: `❌ Error: ${error.message}`, color: '#ef4444' });
    sendEvent('done', { success: false, error: error.message });
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SCC Telkom Playwright Automation Engine Active!`);
  console.log(`🌐 Server running at: http://localhost:3000`);
  console.log(`======================================================\n`);
});
