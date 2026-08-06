/**
 * SCC Telkom Reverse Proxy Worker
 * - Strip X-Frame-Options & CSP headers dari response Telkom
 * - Inject fake GPS koordinat sebelum halaman SCC dimuat
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      }
    })
  }

  const ticketId = url.searchParams.get('ticketId') || ''
  const nd = url.searchParams.get('nd') || ''
  const lat = parseFloat(url.searchParams.get('lat') || '0')
  const lng = parseFloat(url.searchParams.get('lng') || '0')

  if (!ticketId || !nd || lat === 0 || lng === 0) {
    return new Response('Missing required params: ticketId, nd, lat, lng', { status: 400 })
  }

  const targetUrl = `https://scc.telkom.co.id/CloseTicket.Internet/Check_embededv1/?ticketId=${encodeURIComponent(ticketId)}&nd=${encodeURIComponent(nd)}`

  let sccResponse
  try {
    sccResponse = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://scc.telkom.co.id/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
      }
    })
  } catch (err) {
    return new Response('Gagal menghubungi server SCC Telkom: ' + err.message, { status: 502 })
  }

  const contentType = sccResponse.headers.get('Content-Type') || ''

  // Hanya inject GPS ke response HTML
  if (!contentType.includes('text/html')) {
    // Passthrough non-HTML (JS, CSS, images)
    const passthroughHeaders = new Headers(sccResponse.headers)
    passthroughHeaders.set('Access-Control-Allow-Origin', '*')
    passthroughHeaders.delete('X-Frame-Options')
    passthroughHeaders.delete('Content-Security-Policy')
    return new Response(sccResponse.body, {
      status: sccResponse.status,
      headers: passthroughHeaders
    })
  }

  let html = await sccResponse.text()

  // GPS Override Script - diinject sebelum script apapun di halaman SCC
  const gpsScript = `<script>
(function() {
  var _fakeLat = ${lat};
  var _fakeLng = ${lng};
  var _fakePos = {
    coords: {
      latitude: _fakeLat,
      longitude: _fakeLng,
      accuracy: 3,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    },
    timestamp: Date.now()
  };
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition = function(success) {
      if (typeof success === 'function') success(_fakePos);
    };
    navigator.geolocation.watchPosition = function(success) {
      if (typeof success === 'function') success(_fakePos);
      return 1;
    };
  }
})();
</script>`

  // Inject sebelum </head> atau di awal <body> sebagai fallback
  if (html.includes('</head>')) {
    html = html.replace('</head>', gpsScript + '</head>')
  } else if (html.includes('<body')) {
    html = html.replace('<body', gpsScript + '<body')
  } else {
    html = gpsScript + html
  }

  const responseHeaders = new Headers()
  responseHeaders.set('Content-Type', 'text/html; charset=utf-8')
  responseHeaders.set('Access-Control-Allow-Origin', '*')
  // X-Frame-Options & CSP sengaja dihapus agar bisa di-embed sebagai iframe

  return new Response(html, {
    status: sccResponse.status,
    headers: responseHeaders
  })
}
