// Service Worker for Ivano Coltellacci Photography
const CACHE_VERSION = 'v4';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== STATIC_CACHE && key !== IMAGE_CACHE)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - different strategies for different resources
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Images: cache-first (fast repeat loads)
    if (url.pathname.includes('/assets/')) {
        event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
        return;
    }

    // Manifest: network-first (pick up new photos)
    if (url.pathname.includes('images.json')) {
        event.respondWith(networkFirst(event.request, STATIC_CACHE));
        return;
    }

    // Static assets: network-first (ensures updates apply immediately)
    if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset) || url.pathname === '/')) {
        event.respondWith(networkFirst(event.request, STATIC_CACHE));
        return;
    }

    // Everything else: network only
    event.respondWith(fetch(event.request));
});

// Cache-first strategy
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return offline fallback if available
        return new Response('Offline', { status: 503 });
    }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        return new Response('Offline', { status: 503 });
    }
}
