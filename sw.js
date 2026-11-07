/*
  Service worker: guarda la app en el celular para que funcione sin internet.
  Cada vez que cambies algo (un juego nuevo, un arreglo), subí VERSION en 1.
*/
const VERSION = 14;
const CACHE = 'anotador-v' + VERSION;

importScripts('games.js');

const FILES = [
  './',
  'index.html',
  'games.js',
  'common.js',
  'common.css',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  ...self.GAMES.map(g => g.file),
  ...self.GAMES.filter(g => g.art).map(g => g.art)
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Responde desde el celular al instante y, si hay internet, se actualiza por detrás. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request, { ignoreSearch: true }).then(hit => {
        const net = fetch(e.request).then(res => {
          if (res && res.ok && new URL(e.request.url).origin === location.origin) cache.put(e.request, res.clone());
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    )
  );
});
