// Content script di scc.telkom.co.id (all frames, document_start)
// Membaca koordinat ODP dari storage yang baru saja disimpan saat submit form, lalu inject inject.js secara presisi

(function() {
  chrome.storage.local.get(['scc_lat', 'scc_lng'], function(result) {
    if (result.scc_lat && result.scc_lng) {
      document.documentElement.dataset.sccLat = result.scc_lat;
      document.documentElement.dataset.sccLng = result.scc_lng;
    }

    // Inject inject.js ke DOM setelah dataset terpasang
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.onload = function() {
      this.remove();
    };

    (document.head || document.documentElement).prepend(script);
  });
})();
