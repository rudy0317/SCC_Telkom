(function() {
  var lat = parseFloat(document.documentElement.dataset.sccLat);
  var lng = parseFloat(document.documentElement.dataset.sccLng);

  if (isNaN(lat) || isNaN(lng)) {
    lat = -3.3194;
    lng = 114.5908;
  }

  function getFakePos() {
    return {
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
  }

  // 1. Override Permissions API query agar selalu mengembalikan status 'granted'
  if (navigator.permissions && navigator.permissions.query) {
    var origQuery = navigator.permissions.query;
    navigator.permissions.query = function(param) {
      if (param && (param.name === 'geolocation' || param === 'geolocation')) {
        return Promise.resolve({
          state: 'granted',
          onchange: null,
          addEventListener: function() {},
          removeEventListener: function() {},
          dispatchEvent: function() { return true; }
        });
      }
      return origQuery.apply(this, arguments);
    };
  }

  // 2. Override Geolocation API secara presisi dengan koordinat ODP yang disubmit
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition = function(success, error, opts) {
      console.log('[SCC Tools] getCurrentPosition dipanggil -> Lokasi ODP ter-inject:', lat, lng);
      if (typeof success === 'function') {
        setTimeout(function() { success(getFakePos()); }, 10);
      }
    };
    navigator.geolocation.watchPosition = function(success, error, opts) {
      console.log('[SCC Tools] watchPosition dipanggil -> Lokasi ODP ter-inject:', lat, lng);
      if (typeof success === 'function') {
        setTimeout(function() { success(getFakePos()); }, 10);
      }
      return 1;
    };
  }

  console.log('[SCC Tools] Geolocation API injected secara presisi untuk ODP:', lat, lng);
})();
