// Content script di scc.telkom.co.id (all frames, document_start)
// Inject inject.js secara synchronous pada awal loading DOM

(function() {
  // 1. Inject inject.js SEGERA tanpa menunggu async storage
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  (document.head || document.documentElement).appendChild(script);

  // 2. Simpan koordinat dari storage ke DOM dataset sebagai cadangan
  chrome.storage.local.get(['scc_lat', 'scc_lng'], function(result) {
    if (result && result.scc_lat && result.scc_lng) {
      document.documentElement.dataset.sccLat = result.scc_lat;
      document.documentElement.dataset.sccLng = result.scc_lng;
    }
  });
})();

