// Background service worker
// 1. Simpan koordinat ODP dari form webapp secara terjamin ke storage
// 2. SETELAH koordinat terkonfirmasi tersimpan, buka jendela SCC Telkom di paruh layar kanan

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_COORDS_AND_OPEN') {
    const { lat, lng, targetUrl } = message;

    // 1. Simpan koordinat ODP ke storage lokal extension
    chrome.storage.local.set({
      scc_lat: lat,
      scc_lng: lng
    }, () => {
      console.log('[SCC Tools] Koordinat ODP berhasil disimpan:', lat, lng);

      // 2. Setelah terkonfirmasi tersimpan, buka jendela SCC Telkom di paruh layar kanan
      chrome.windows.getCurrent((currentWindow) => {
        const screenWidth = currentWindow.width || 1920;
        const windowWidth = Math.floor(screenWidth / 2);
        const windowLeft = screenWidth - windowWidth;

        chrome.windows.create({
          url: targetUrl,
          type: 'popup',
          left: windowLeft,
          top: 0,
          width: windowWidth,
          height: currentWindow.height || 1080
        }, (win) => {
          sendResponse({ status: 'ok', windowId: win.id });
        });
      });
    });

    return true; // Keep channel open for async callback
  }
});
