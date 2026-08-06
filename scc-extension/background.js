// Background service worker
// 1. Menerima koordinat dari form GitHub Pages -> simpan ke chrome.storage
// 2. Fix cookie SameSite=None agar session SCC Telkom berjalan di dalam iframe

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_COORDS') {
    chrome.storage.local.set({
      scc_lat: message.lat,
      scc_lng: message.lng
    }, () => {
      sendResponse({ status: 'ok' });
    });
    return true;
  }
});

// Remove SameSite restrictions on cookies for scc.telkom.co.id
chrome.declarativeNetRequest.updateHeadersInSession && chrome.declarativeNetRequest.updateHeadersInSession({});
