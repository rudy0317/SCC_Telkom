// Background service worker
// Menerima koordinat dari form GitHub Pages -> simpan ke chrome.storage

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_COORDS') {
    chrome.storage.local.set({
      scc_lat: message.lat,
      scc_lng: message.lng
    }, () => {
      sendResponse({ status: 'ok' });
    });
    return true; // async response
  }
});
