// Content script di scc.telkom.co.id (all frames, document_start)
// Inject Fake GPS ke halaman SCC Telkom + Ookla Speedtest sebelum script apapun berjalan

chrome.storage.local.get(['scc_lat', 'scc_lng'], function(result) {
  const lat = result.scc_lat;
  const lng = result.scc_lng;

  if (!lat || !lng) return;

  // Inject ke page context (melewati isolated world) via script tag
  const script = document.createElement('script');
  script.textContent = `
(function() {
  var _lat = ${parseFloat(lat)};
  var _lng = ${parseFloat(lng)};
  var _pos = {
    coords: {
      latitude: _lat,
      longitude: _lng,
      accuracy: 3,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    },
    timestamp: Date.now()
  };
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition = function(success, error, opts) {
      if (typeof success === 'function') success(_pos);
    };
    navigator.geolocation.watchPosition = function(success, error, opts) {
      if (typeof success === 'function') success(_pos);
      return 1;
    };
  }
  console.log('[SCC Tools] Fake GPS aktif: ' + _lat + ', ' + _lng);
})();
  `;
  (document.head || document.documentElement).prepend(script);
  script.remove();
});
