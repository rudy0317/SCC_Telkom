// Content script di scc.telkom.co.id (all frames, document_start)
// 1. Inject Fake GPS ke halaman SCC Telkom + Ookla Speedtest
// 2. Bypass retrieveIPRadius error untuk pelanggan GPON (is_bng: false)

chrome.storage.local.get(['scc_lat', 'scc_lng'], function(result) {
  const lat = result.scc_lat;
  const lng = result.scc_lng;

  const gpsCode = (lat && lng) ? `
    var _lat = ${parseFloat(lat)};
    var _lng = ${parseFloat(lng)};
    var _pos = {
      coords: {
        latitude: _lat, longitude: _lng, accuracy: 3,
        altitude: null, altitudeAccuracy: null, heading: null, speed: null
      },
      timestamp: Date.now()
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition = function(s) { if(typeof s==='function') s(_pos); };
      navigator.geolocation.watchPosition = function(s) { if(typeof s==='function') s(_pos); return 1; };
    }
    console.log('[SCC Tools] Fake GPS aktif:', _lat, _lng);
  ` : '';

  // Bypass Radius error: deteksi via MutationObserver lalu force-start speedtest
  const bypassCode = `
    (function() {
      function waitForJQ(cb, tries) {
        tries = tries || 0;
        if (tries > 100) return;
        if (typeof $ !== 'undefined' && typeof $.fn !== 'undefined') { cb(); }
        else { setTimeout(function() { waitForJQ(cb, tries+1); }, 100); }
      }

      waitForJQ(function() {
        var radiusErrPanel = document.getElementById('show-finish-ipradius');
        if (!radiusErrPanel) return;

        var obs = new MutationObserver(function() {
          if (!radiusErrPanel.classList.contains('hide')) {
            console.log('[SCC Tools] Radius error terdeteksi → bypass ke Speedtest!');

            // Sembunyikan panel error Radius
            radiusErrPanel.classList.add('hide');

            // Clear timer Radius
            if (typeof timerWait3 !== 'undefined') clearTimeout(timerWait3);
            if (typeof timerWait4 !== 'undefined') clearTimeout(timerWait4);

            // Force variabel flag yg dibutuhkan ooklaListener
            window.flagcontinue = true;
            window.VarSpeed = 0;     // 0 = DBT speedtest
            window.speedName = 'dbt';

            // Tampilkan show-check jika tersembunyi
            var showCheck = document.getElementById('show-check');
            if (showCheck) showCheck.classList.remove('hide');

            // Mulai speedtest setelah 500ms
            setTimeout(function() {
              var ooklaIframe = document.getElementById('ookla');
              if (ooklaIframe && !ooklaIframe.src) {
                ooklaIframe.src = 'http://test-inf-1.speedtestcustom.com';
              }
              try { $('#ookla-test').modal('show'); } catch(e) {}
              console.log('[SCC Tools] Speedtest dimulai via bypass!');
            }, 500);

            obs.disconnect();
          }
        });

        obs.observe(radiusErrPanel, { attributes: true, attributeFilter: ['class'] });
        console.log('[SCC Tools] Monitoring Radius error panel...');
      });
    })();
  `;

  // Inject semua ke page context via <script> tag
  const script = document.createElement('script');
  script.textContent = `(function() { ${gpsCode} ${bypassCode} })();`;
  (document.head || document.documentElement).prepend(script);
  script.remove();
});

