/* RED Monitor — Service Worker principal
   Ce fichier est requis par OneSignal à la racine du site.
   Il importe le SW OneSignal ET gère le cache hors-ligne. */

importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

var CACHE = 'red-monitor-v2';
var FILES = [
  '/red-monitor/',
  '/red-monitor/index.html',
  '/red-monitor/app.js',
  '/red-monitor/manifest.json',
  '/red-monitor/icons/icon-192.png',
  '/red-monitor/icons/icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(r) { return r || fetch(e.request); })
  );
});
