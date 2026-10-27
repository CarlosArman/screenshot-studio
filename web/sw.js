// sw.js — Service Worker de Screenshot Studio
// Estrategia: cache-first para recursos de la app; network-first para navegación.

const CACHE = 'screenshot-studio-v0.4.1';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './styles/main.css',
  './styles/light-theme.css',
  './js/app.js',
  './js/store.js',
  './js/history.js',
  './js/canvas-editor.js',
  './js/annotations.js',
  './js/browser-frames.js',
  './js/image-import.js',
  './js/screen-capture.js',
  './js/crop.js',
  './js/export.js',
  './js/share.js',
  './js/projects.js',
  './js/status.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo cachear peticiones GET del mismo origen
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    const response = await fetch(event.request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(event.request, response.clone());
    }
    return response;
  })());
});
