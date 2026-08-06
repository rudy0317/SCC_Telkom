// Content script di scc.telkom.co.id (all frames, document_start)
// Inject Fake GPS dengan memuat inject.js (web_accessible_resources) untuk menghindari blokir Content Security Policy (CSP)

chrome.storage.local.get(['scc_lat', 'scc_lng'], function(result) {
  const lat = result.scc_lat;
  const lng = result.scc_lng;

  if (!lat || !lng) return;

  // Simpan koordinat di dataset HTML element agar bisa dibaca oleh inject.js
  document.documentElement.dataset.sccLat = lat;
  document.documentElement.dataset.sccLng = lng;

  // Buat script element yang menunjuk ke inject.js (bukan inline text)
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  script.onload = function() {
    this.remove();
  };

  (document.head || document.documentElement).prepend(script);
});
