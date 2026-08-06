(function() {
  var lat = parseFloat(document.documentElement.dataset.sccLat);
  var lng = parseFloat(document.documentElement.dataset.sccLng);

  if (isNaN(lat) || isNaN(lng)) return;

  var _pos = {
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy: 3,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    },
    timestamp: Date.now()
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition = function(success, error, opts) {
      if (typeof success === 'function') success(_pos);
    };
    navigator.geolocation.watchPosition = function(success, error, opts) {
      if (typeof success === 'function') success(_pos);
      return 1;
    };
  }

  console.log('[SCC Tools] Fake GPS berhasil ter-inject via inject.js:', lat, lng);
})();
