// Background service worker
// 1. Simpan koordinat ODP dari webapp ke storage
// 2. Buka tab baru SCC Telkom otomatis saat tombol Submit diklik

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_COORDS_AND_OPEN') {
    const { lat, lng, targetUrl } = message;

    // Simpan koordinat ke storage lokal extension
    chrome.storage.local.set({
      scc_lat: lat,
      scc_lng: lng
    }, () => {
      // Buka tab baru ke SCC Telkom secara otomatis
      chrome.tabs.create({ url: targetUrl, active: true }, (tab) => {
        sendResponse({ status: 'ok', tabId: tab.id });
      });
    });

    return true; // Keep channel open for async response
  }
});
