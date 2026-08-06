(function() {
  var _lat = -3.3194; // fallback default
  var _lng = 114.5908;
  var _hasCoords = false;

  function getFakePos() {
    return {
      coords: {
        latitude: _lat,
        longitude: _lng,
        accuracy: 3,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    };
  }

  // Listen updates dari content_scc.js
  window.addEventListener('message', function(ev) {
    if (ev.data && ev.data.type === 'UPDATE_SCC_COORDS') {
      _lat = parseFloat(ev.data.lat);
      _lng = parseFloat(ev.data.lng);
      _hasCoords = true;
      console.log('[SCC Tools] Koordinat GPS diperbarui di inject.js:', _lat, _lng);
    }
  });

  // 1. Override navigator.permissions.query agar selalu return 'granted' untuk geolocation
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

  // 2. Override navigator.geolocation.getCurrentPosition & watchPosition secara sinkron
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition = function(success, error, opts) {
      console.log('[SCC Tools] getCurrentPosition dipanggil -> returning fake pos:', _lat, _lng);
      if (typeof success === 'function') {
        setTimeout(function() { success(getFakePos()); }, 10);
      }
    };
    navigator.geolocation.watchPosition = function(success, error, opts) {
      console.log('[SCC Tools] watchPosition dipanggil -> returning fake pos:', _lat, _lng);
      if (typeof success === 'function') {
        setTimeout(function() { success(getFakePos()); }, 10);
      }
      return 1;
    };
  }

  console.log('[SCC Tools] Geolocation API & Permissions query berhasil di-override sinkron!');
})();
