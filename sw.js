const CACHE = 'hiragana-v3';

const STATIC_ASSETS = ['./manifest.webmanifest', './icon.svg'];

function isHtmlRequest(request) {
  if (request.mode === 'navigate') return true;
  try {
    var url = new URL(request.url);
    return url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  } catch (e) {
    return false;
  }
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
          return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  /* HTML: 네트워크 우선 → GitHub Pages 업데이트가 바로 반영됨 */
  if (isHtmlRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          if (response && response.ok) {
            var clone = response.clone();
            caches.open(CACHE).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(function () {
          return caches.match(event.request);
        })
    );
    return;
  }

  /* 아이콘·manifest: 캐시 우선 */
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request);
    })
  );
});
