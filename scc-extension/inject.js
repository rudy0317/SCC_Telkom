(function() {
  function getCoords() {
    var lat = parseFloat(document.documentElement.dataset.sccLat);
    var lng = parseFloat(document.documentElement.dataset.sccLng);

    // Jika dataset belum siap, coba baca dari cookie HTTP
    if (isNaN(lat) || isNaN(lng)) {
      var matchLat = document.cookie.match(/(?:^|;\s*)scc_lat=([^;]+)/);
      var matchLng = document.cookie.match(/(?:^|;\s*)scc_lng=([^;]+)/);
      if (matchLat && matchLng) {
        lat = parseFloat(matchLat[1]);
        lng = parseFloat(matchLng[1]);
      }
    }

    if (isNaN(lat) || isNaN(lng)) {
      lat = -3.3194;
      lng = 114.5908;
    }
    return { lat: lat, lng: lng };
  }

  function getFakePos() {
    var c = getCoords();
    return {
      coords: {
        latitude: c.lat,
        longitude: c.lng,
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

  // 2. Override Geolocation API
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition = function(success, error, opts) {
      var pos = getFakePos();
      console.log('[SCC Tools] getCurrentPosition dipanggil -> Lokasi ODP:', pos.coords.latitude, pos.coords.longitude);
      if (typeof success === 'function') {
        setTimeout(function() { success(pos); }, 10);
      }
    };
    navigator.geolocation.watchPosition = function(success, error, opts) {
      var pos = getFakePos();
      console.log('[SCC Tools] watchPosition dipanggil -> Lokasi ODP:', pos.coords.latitude, pos.coords.longitude);
      if (typeof success === 'function') {
        setTimeout(function() { success(pos); }, 10);
      }
      return 1;
    };
  }

  console.log('[SCC Tools] Silent Geolocation override active.');
})();

