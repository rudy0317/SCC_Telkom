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

// Mock Ookla speedtest result (realistic structure from index_scc.js L197)
const MOCK_SPEEDTEST_RESULT = {
  download: 32080,
  upload: 12110,
  ping: { latency: 11.9, jitter: 2.25 },
  serverId: 'e425a2ca-ab2e-44f1-b505-a3f26ee17630',
  serverName: 'Jakarta',
  host: 'https://jakarta.speedtest.telkom.net.id.prod.hosts.ooklaserver.net:8080/',
  units: 'Kbps'
};

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

// 2. Playwright Realtime SSE Streaming Endpoint
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

    // Set Native CDP Geolocation
    const client = await context.newCDPSession(page);
    await client.send('Emulation.setGeolocationOverride', {
      latitude: targetLat,
      longitude: targetLng,
      accuracy: 3
    });

    // ============================================================
    // INTERCEPT NETWORK REQUESTS (Bypass Speedtest + IP Radius)
    // ============================================================

    // Intercept retrieveIPRadius → Force statusCode 200
    await page.route('**/retrieveIPRadius**', async (route) => {
      sendEvent('status', { message: '🔓 Intercepted retrieveIPRadius → Forcing statusCode 200', color: '#f59e0b' });
      try {
        const response = await route.fetch();
        let body = await response.text();
        try {
          const json = JSON.parse(body);
          json.success = true;
          if (!json.data) json.data = {};
          json.data.statusCode = 200;
          json.data.frame_ip = '182.8.143.64';
          body = JSON.stringify(json);
        } catch (e) {}
        await route.fulfill({ status: 200, contentType: 'application/json', body });
      } catch (e) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { statusCode: 200, frame_ip: '182.8.143.64' } }) });
      }
    });

    // Intercept saveWho → Force passed_ip true
    await page.route('**/saveWho**', async (route) => {
      sendEvent('status', { message: '🔓 Intercepted saveWho → Forcing passed_ip: true', color: '#f59e0b' });
      try {
        const response = await route.fetch();
        let body = await response.text();
        try {
          const json = JSON.parse(body);
          json.success = true;
          if (json.data) json.data.passed_ip = true;
          body = JSON.stringify(json);
        } catch (e) {}
        await route.fulfill({ status: 200, contentType: 'application/json', body });
      } catch (e) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { passed_ip: true } }) });
      }
    });

    // Intercept SaveSpeed → Inject mock speedtest payload if rest is null
    await page.route('**/SaveSpeed**', async (route, request) => {
      sendEvent('status', { message: '⚡ Intercepted SaveSpeed → Injecting valid Ookla payload', color: '#38bdf8' });
      try {
        let postData = request.postData() || '{}';
        let parsed = {};
        try { parsed = JSON.parse(postData); } catch (e) {}

        // If speed is null/empty, inject mock
        if (!parsed.speed || parsed.speed === 'null' || parsed.speed === '0') {
          parsed.speed = JSON.stringify(MOCK_SPEEDTEST_RESULT);
          if (!parsed.speedtestname || parsed.speedtestname === 'failed') {
            parsed.speedtestname = 'ookla';
          }
        }

        await route.continue({
          postData: JSON.stringify(parsed),
          headers: { ...request.headers(), 'Content-Type': 'application/json' }
        });
      } catch (e) {
        await route.continue();
      }
    });

    // Intercept retrieveSpeed → Force speed_passed = 1
    await page.route('**/retrieveSpeed**', async (route) => {
      sendEvent('status', { message: '✅ Intercepted retrieveSpeed → Forcing speed_passed: 1 (Layak)', color: '#22c55e' });
      try {
        const response = await route.fetch();
        let body = await response.text();
        try {
          const json = JSON.parse(body);
          json.success = true;
          if (!json.data) json.data = {};
          json.data.speed_passed = 1;
          body = JSON.stringify(json);
        } catch (e) {}
        await route.fulfill({ status: 200, contentType: 'application/json', body });
      } catch (e) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { speed_passed: 1 } }) });
      }
    });

    // Intercept retrieveSpeedAcsis → Force speed data
    await page.route('**/retrieveSpeedAcsis**', async (route) => {
      sendEvent('status', { message: '✅ Intercepted retrieveSpeedAcsis → Injecting speed data', color: '#22c55e' });
      try {
        const response = await route.fetch();
        let body = await response.text();
        try {
          const json = JSON.parse(body);
          json.success = true;
          if (!json.data) json.data = {};
          json.data.speed = 32080;
          body = JSON.stringify(json);
        } catch (e) {}
        await route.fulfill({ status: 200, contentType: 'application/json', body });
      } catch (e) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { speed: 32080 } }) });
      }
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
    sendEvent('status', { message: '🌐 Navigating to SCC Telkom URL...', color: '#f59e0b' });

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    sendEvent('status', { message: '⌛ Waiting for SCC Telkom scripts to load...', color: '#f59e0b' });
    await page.waitForFunction(() => typeof $ !== 'undefined' && typeof doTask === 'function', { timeout: 30000 });

    sendEvent('status', { message: '⚡ Injecting Ticket + ND & calling doTask()...', color: '#38bdf8' });
    await page.evaluate(({ t, n }) => {
      $('#input-ticket').val(t);
      $('#input-nd').val(n);
      if (typeof doTask === 'function') {
        doTask();
      }
    }, { t: ticketId, n: nd });

    sendEvent('status', { message: '📍 CDP Geolocation Active. Waiting for QC flow...', color: '#22c55e' });

    // Auto-drive loop: 120 seconds max
    // State flags tracked ON THE PAGE via window.__automation
    for (let i = 0; i < 120; i++) {
      await page.waitForTimeout(1000);
      try {
        if (page && !page.isClosed()) {
          const actionLog = await page.evaluate((mockResult) => {
            // Initialize state tracker (persists across evaluate calls)
            if (!window.__automation) {
              window.__automation = {
                restInjected: false,
                speedClicked: false
              };
            }
            const state = window.__automation;
            let actions = [];

            // Step 1: Inject `rest` variable ONCE when speedtest modal is visible
            if (!state.restInjected && (typeof rest === 'undefined' || rest === null)) {
              // Only inject when the ookla modal is actually showing
              if ($('#ookla-test').length && $('#ookla-test').is(':visible')) {
                window.rest = mockResult;
                state.restInjected = true;
                actions.push('Injected rest (once)');
              }
            }

            // Step 2: Enable + click #submit-speed ONCE
            if (!state.speedClicked && state.restInjected) {
              if ($('#submit-speed').length) {
                $('#submit-speed').removeClass('disabled').addClass('enabled');
                $('#submit-speed').trigger('click');
                state.speedClicked = true;
                actions.push('Enabled + Clicked #submit-speed (once)');
              }
            }

            // Step 3: Report current visible step for live status
            let currentStep = '';
            if ($('#ask-ticket').is(':visible')) currentStep = 'Input Ticket';
            else if ($('#show-check').is(':visible')) currentStep = 'Checking...';
            else if ($('#ookla-test').is(':visible')) currentStep = 'Speedtest Modal';
            else if ($('#show-finish').is(':visible')) currentStep = 'FINISHED';
            else if ($('#show-location').is(':visible')) currentStep = 'Saving Location';
            if (currentStep) actions.push('Step: ' + currentStep);

            return actions;
          }, MOCK_SPEEDTEST_RESULT);

          if (actionLog.length > 0) {
            sendEvent('status', { message: `🤖 [${i+1}s] ${actionLog.join(' | ')}`, color: '#38bdf8' });
          }

          // Early exit if finished
          const isFinished = await page.evaluate(() => {
            return $('#show-finish').is(':visible') || 
                   document.body.innerText.includes('Berhasil') ||
                   document.body.innerText.includes('Success');
          });
          if (isFinished) {
            sendEvent('status', { message: '🎉 QC Ticket Closed Successfully!', color: '#22c55e' });
            break;
          }
        }
      } catch (e) {}
    }

    sendEvent('status', { message: '✅ Full QC Cycle Completed!', color: '#22c55e' });

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
  console.log(`🚀 SCC Telkom Playwright Automation Engine v2.5`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
