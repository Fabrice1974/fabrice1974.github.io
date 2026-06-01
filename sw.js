/* ============================================================
   sw.js — RED Monitor v4.0.1
   Service Worker dédié — Network First
   Compatible data.json + scan-meta.json + OneSignal
   ============================================================ */

const CACHE_VERSION = 'red-monitor-v4.0.1';
const CACHE_NAME    = CACHE_VERSION;

// Assets statiques
const STATIC_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './data.json',
  './scan-meta.json'
];

// Helpers
function isOneSignalRequest(url) {
  return /onesignal/i.test(url);
}
function isChromeExt(url) {
  return url.startsWith('chrome-extension://');
}
function isHttpGet(req) {
  return req && req.method === 'GET';
}
function stripSearch(urlString) {
  const u = new URL(urlString);
  u.search = '';
  return u.toString();
}
function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');
}

// ─── INSTALL ─────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Install ->', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Install error:', err))
  );
});

// ─── ACTIVATE ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate -> cleanup old caches');
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── FETCH (Network First) ───────────────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = req.url;

  if (!isHttpGet(req)) return;
  if (isChromeExt(url)) return;
  if (isOneSignalRequest(url)) return;

  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        // Réseau OK -> update cache (si 200)
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();

          // clé cache normalisée sans query-string (évite multi-entrées ?v=timestamp)
          const normalizedKey = stripSearch(url);

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(normalizedKey, responseClone);
          }).catch((e) => {
            console.warn('[SW] cache.put failed:', e.message);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Offline fallback cache
        const normalizedKey = stripSearch(url);

        // 1) tentative clé normalisée
        const cachedNormalized = await caches.match(normalizedKey);
        if (cachedNormalized) return cachedNormalized;

        // 2) tentative requête brute
        const cachedRaw = await caches.match(req);
        if (cachedRaw) return cachedRaw;

        // 3) navigation -> fallback index
        if (isNavigationRequest(req)) {
          const cachedIndex = await caches.match('./index.html') || await caches.match('index.html');
          if (cachedIndex) return cachedIndex;
        }

        // 4) fallback ultime
        return new Response(
          '<!doctype html><html lang="fr"><meta charset="utf-8"><title>Offline</title>' +
          '<body style="font-family:Arial,sans-serif;padding:20px">' +
          '<h2 style="color:#c62828">⚠️ RED Monitor hors ligne</h2>' +
          '<p>Reconnecte-toi pour accéder aux dernières données.</p>' +
          '</body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })
  );
});

// ─── MESSAGE ─────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received');
    self.skipWaiting();
  }
});
