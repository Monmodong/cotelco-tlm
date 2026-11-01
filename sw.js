/* COTELCO TLM service worker: cache the app shell so it opens offline.
   Bump CACHE when changing icons/manifest or other cached assets. */
var CACHE = 'cotelco-tlm-v1';
var SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(function (res) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) {
            c.put(new URL('./index.html', self.location).href, copy);
          });
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (r) {
            return r || caches.match('./index.html');
          });
        })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (r) {
      return r || fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
