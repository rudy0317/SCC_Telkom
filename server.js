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

// 2. Playwright CDP Automation Endpoint
app.post('/api/scc/process', async (req, res) => {
  const { ticketId, nd, lat, lng } = req.body;

  if (!ticketId || !nd || !lat || !lng) {
    return res.status(400).json({ error: 'Missing required parameters (ticketId, nd, lat, lng).' });
  }

  const targetLat = parseFloat(lat);
  const targetLng = parseFloat(lng);

  console.log(`\n==============================================`);
  console.log(`[Automation Engine] Processing Ticket: ${ticketId}`);
  console.log(`[Automation Engine] ND: ${nd}`);
  console.log(`[Automation Engine] Native CDP Geolocation: Lat ${targetLat}, Lng ${targetLng}`);
  console.log(`==============================================\n`);

  let browser;
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

    // Log browser console output
    page.on('console', msg => console.log('[Browser Console]:', msg.text()));

    // Set Native CDP Geolocation Emulation explicitly
    const client = await context.newCDPSession(page);
    await client.send('Emulation.setGeolocationOverride', {
      latitude: targetLat,
      longitude: targetLng,
      accuracy: 3
    });

    const targetUrl = `https://scc.telkom.co.id/CloseTicket.Internet/Check_embededv1/?ticketId=${encodeURIComponent(ticketId)}&nd=${encodeURIComponent(nd)}`;
    console.log(`[Automation Engine] Navigating to: ${targetUrl}`);

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for jQuery & doTask function to be ready
    console.log(`[Automation Engine] Waiting for SCC Telkom scripts...`);
    await page.waitForFunction(() => typeof $ !== 'undefined' && typeof doTask === 'function', { timeout: 30000 });

    // Execute doTask() directly via evaluate (bypasses element visibility limits)
    console.log(`[Automation Engine] Executing doTask() on SCC Telkom...`);
    await page.evaluate(({ t, n }) => {
      $('#input-ticket').val(t);
      $('#input-nd').val(n);
      if (typeof doTask === 'function') {
        doTask();
      }
    }, { t: ticketId, n: nd });

    // Wait for QC execution and location save
    console.log(`[Automation Engine] Waiting 10s for QC execution & Geolocation save...`);
    await page.waitForTimeout(10000);

    // Capture final screenshot
    const screenshotBuffer = await page.screenshot({ fullPage: false });
    const screenshotBase64 = screenshotBuffer.toString('base64');
    const pageTitle = await page.title();

    await browser.close();

    return res.json({
      success: true,
      message: 'SCC Ticket Processed & Submitted with Native CDP Geolocation!',
      ticketId,
      nd,
      coordinates: { lat: targetLat, lng: targetLng },
      pageTitle,
      screenshot: `data:image/png;base64,${screenshotBase64}`
    });

  } catch (error) {
    console.error('[Automation Engine Error]:', error.message);
    if (browser) await browser.close();

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SCC Telkom Playwright Automation Engine Active!`);
  console.log(`🌐 Server running at: http://localhost:3000`);
  console.log(`======================================================\n`);
});
