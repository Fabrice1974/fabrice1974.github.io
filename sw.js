/* ============================================================
   sw.js — RED Monitor v2.5
   Service Worker dédié — Stratégie Network First
   Séparé de OneSignal qui gère uniquement les push notifs
   ============================================================ */

const CACHE_VERSION = 'red-monitor-v2.5';
const CACHE_NAME    = CACHE_VERSION;

// Fichiers mis en cache au premier chargement
const STATIC_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './data.json'
];

// ─── INSTALLATION ────────────────────────────────────────────
self.addEventListener('install', function(event) {
  console.log('[SW] Install — version :', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Mise en cache initiale des assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(function() {
        console.log('[SW] skipWaiting — activation immédiate');
        return self.skipWaiting();
      })
      .catch(function(err) {
        console.error('[SW] Erreur installation :', err);
      })
  );
});

// ─── ACTIVATION ──────────────────────────────────────────────
self.addEventListener('activate', function(event) {
  console.log('[SW] Activate — nettoyage anciens caches');
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(name) {
              // Supprime tous les caches obsolètes sauf le courant
              return name !== CACHE_NAME;
            })
            .map(function(name) {
              console.log('[SW] Suppression cache obsolète :', name);
              return caches.delete(name);
            })
        );
      })
      .then(function() {
        console.log('[SW] clients.claim — contrôle immédiat');
        return self.clients.claim();
      })
  );
});

// ─── FETCH : Network First ────────────────────────────────────
// Tente toujours le réseau → si offline, fallback cache
self.addEventListener('fetch', function(event) {

  // Ignore les requêtes non-GET
  if (event.request.method !== 'GET') return;

  // Ignore les extensions Chrome
  if (event.request.url.startsWith('chrome-extension://')) return;

  // ⚠️ Laisse OneSignal gérer ses propres requêtes
  if (event.request.url.includes('onesignal')) return;

  event.respondWith(
    fetch(event.request)
      .then(function(networkResponse) {
        // Réseau OK → met à jour le cache avec la version fraîche
        if (networkResponse && networkResponse.status === 200) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
            console.log('[SW] Cache mis à jour :', event.request.url);
          });
        }
        return networkResponse;
      })
      .catch(function() {
        // Réseau KO → fallback sur le cache local
        console.log('[SW] Offline — fallback cache :', event.request.url);
        return caches.match(event.request)
          .then(function(cached) {
            if (cached) return cached;
            // Aucun cache disponible → page d'erreur minimale
            return new Response(
              '<h2 style="font-family:sans-serif;color:#e04f5f;padding:20px">'
              + '⚠️ RED Monitor hors ligne — reconnecte-toi pour accéder aux données.</h2>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
      })
  );
});

// ─── MESSAGE : force refresh depuis app.js ───────────────────
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING reçu — activation forcée');
    self.skipWaiting();
  }
});
