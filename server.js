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
    // Launch Chromium Browser in Headless mode
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    // Create Context with Native CDP Geolocation Override & Granted Permissions
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

    const targetUrl = `https://scc.telkom.co.id/CloseTicket.Internet/Check_embededv1/?ticketId=${encodeURIComponent(ticketId)}&nd=${encodeURIComponent(nd)}`;
    console.log(`[Automation Engine] Navigating to: ${targetUrl}`);

    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });

    // Wait 3 seconds for page scripts & Radius checks to settle
    await page.waitForTimeout(3000);

    // Capture Page Screenshot
    const screenshotBuffer = await page.screenshot({ fullPage: false });
    const screenshotBase64 = screenshotBuffer.toString('base64');

    const pageTitle = await page.title();
    const content = await page.content();

    await browser.close();

    return res.json({
      success: true,
      message: 'SCC Ticket Processed Successfully with Native CDP Geolocation Injection!',
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
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
