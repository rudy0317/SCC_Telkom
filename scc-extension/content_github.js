// Content script di rudy0317.github.io
// Tangkap koordinat ODP & URL target dari form webapp, kirim ke background script

window.addEventListener('message', function(event) {
  if (event.source !== window) return;
  if (!event.data || event.data.type !== 'SCC_COORDS') return;

  const { lat, lng, targetUrl } = event.data;
  if (!lat || !lng) return;

  chrome.runtime.sendMessage({
    type: 'SET_COORDS_AND_OPEN',
    lat: lat,
    lng: lng,
    targetUrl: targetUrl
  });
});
