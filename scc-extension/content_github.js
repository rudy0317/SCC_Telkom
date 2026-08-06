// Content script di rudy0317.github.io
// Tangkap koordinat ODP & URL target dari form webapp, kirim ke background script

window.addEventListener('message', function(event) {
  if (event.source !== window) return;
  if (!event.data || event.data.type !== 'SCC_COORDS') return;

  const { lat, lng, targetUrl } = event.data;
  if (!lat || !lng) return;

  // Cek keabsahan konteks chrome.runtime (mencegah error jika ekstensi baru saja di-reload)
  if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
    try {
      chrome.runtime.sendMessage({
        type: 'SET_COORDS_AND_OPEN',
        lat: lat,
        lng: lng,
        targetUrl: targetUrl
      });
    } catch (e) {
      console.warn('[SCC Tools] Extension context reloaded. Silahkan refresh halaman webapp.');
    }
  } else {
    console.warn('[SCC Tools] chrome.runtime belum siap. Silahkan refresh halaman webapp.');
  }
});
