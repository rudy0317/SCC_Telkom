// Content script di scc.telkom.co.id (all frames, document_start)
// Inject inject.js secara SINKRON di awal document_start sebelum script apapun di halaman berjalan

(function() {
  // Inject script inject.js secepat mungkin secara sinkron
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  (document.head || document.documentElement).prepend(script);
  script.onload = function() {
    this.remove();
  };

  // Ambil koordinat dari chrome.storage lalu kirim via postMessage ke inject.js
  chrome.storage.local.get(['scc_lat', 'scc_lng'], function(result) {
    if (result.scc_lat && result.scc_lng) {
      window.postMessage({
        type: 'UPDATE_SCC_COORDS',
        lat: result.scc_lat,
        lng: result.scc_lng
      }, '*');
    }
  });
})();
