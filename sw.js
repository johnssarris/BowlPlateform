const CACHE = 'bowlviewer-v2';

const SHELL = [
  './index.html',
  './manifest.json',
  './js/app.js',
  './js/viewer.js',
  './js/scad-worker.js',
  './icons/icon.svg',
  './openscad/dog_bowl_platform.scad',
  './openscad/lib/frame.scad',
  './openscad/lib/joints.scad',
  './openscad/parts/corner_post.scad',
  './openscad/parts/horizontal_rail.scad',
  './openscad/parts/bowl_cradle.scad',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL))
  );
  // Do NOT call skipWaiting() here — let the page show the "update available"
  // banner and let the user decide when to reload.
});

self.addEventListener('message', (e) => {
  if (e.data?.action === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Navigation: serve index.html from cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then((r) => r || fetch(e.request))
    );
    return;
  }

  // version.json: always network-first so the current version is always fresh
  if (url.pathname.endsWith('/version.json')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // CDN resources (Three.js, openscad-wasm): network-first, cache on success
  if (url.hostname !== self.location.hostname) {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          if (r.ok) {
            const clone = r.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Everything else: cache-first
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request))
  );
});
