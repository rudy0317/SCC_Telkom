// Content script di rudy0317.github.io
// Mendengarkan koordinat ODP dari form, kirim ke background script

window.addEventListener('message', function(event) {
  if (event.source !== window) return;
  if (!event.data || event.data.type !== 'SCC_COORDS') return;

  const { lat, lng } = event.data;
  if (!lat || !lng) return;

  chrome.runtime.sendMessage({ type: 'SET_COORDS', lat, lng });
});
