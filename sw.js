/**
 * Service worker: makes RBM installable as an app and lets it open without
 * internet. Budget data is never cached here - on GitHub Pages it lives in the
 * browser's own database, and /api requests (server version) always go to the network.
 *
 *   Pages (HTML)        network first, saved copy when offline
 *   assets / icons      saved copy first (file names change on every build)
 */
const CACHE_NAME = 'rbm-app-v1';
const SCOPE_URL = new URL(self.registration.scope);
const APP_SHELL = ['./', 'manifest.webmanifest', 'favicon.svg', 'icons/icon-192.png'].map(
  (path) => new URL(path, SCOPE_URL).href
);

/** The cache, or null if the browser cannot provide one (the app then simply works online). */
async function openCache() {
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

self.addEventListener('install', (event) => {
  // Offline copies are a bonus: a caching problem must never stop the app installing.
  event.waitUntil(
    openCache()
      .then((cache) => cache?.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
      )
      .catch(() => {})
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await openCache();
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache?.put(SCOPE_URL.href, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    return (await cache?.match(SCOPE_URL.href)) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await openCache();
  const cached = await cache?.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    cache?.put(request, response.clone()).catch(() => {});
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const isOwnFile = url.origin === SCOPE_URL.origin && url.pathname.startsWith(SCOPE_URL.pathname);
  if (request.method !== 'GET' || !isOwnFile || url.pathname.includes('/api/')) {
    return; // let the browser handle it normally
  }
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.includes('/assets/') || url.pathname.includes('/icons/')) {
    event.respondWith(cacheFirst(request));
  }
});
