// Service Worker for Photo Portfolio (Svelte/Vite version)
const CACHE_VERSION = "v6";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Install - just activate immediately (no pre-caching with Vite's hashed filenames)
self.addEventListener("install", () => {
	self.skipWaiting();
});

// Activate - clean up old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => {
				return Promise.all(
					keys
						.filter((key) => key !== STATIC_CACHE && key !== IMAGE_CACHE)
						.map((key) => caches.delete(key)),
				);
			})
			.then(() => self.clients.claim()),
	);
});

// Fetch - different strategies for different resources
self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);

	// Images: cache-first (fast repeat loads)
	if (
		url.pathname.includes("/assets/") &&
		url.pathname.match(/\.(webp|jpg|jpeg|png|gif)$/i)
	) {
		event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
		return;
	}

	// Gallery manifests: network-first (pick up new photos)
	if (url.pathname.includes("images.json")) {
		event.respondWith(networkFirst(event.request, STATIC_CACHE));
		return;
	}

	// Config: network-first (pick up config changes)
	if (
		url.pathname.includes("site.json") ||
		url.pathname.includes("theme.json")
	) {
		event.respondWith(networkFirst(event.request, STATIC_CACHE));
		return;
	}

	// JS/CSS assets (Vite hashed files): cache-first (immutable)
	if (url.pathname.match(/\/assets\/.*\.(js|css)$/)) {
		event.respondWith(cacheFirst(event.request, STATIC_CACHE));
		return;
	}

	// HTML: network-first (get latest version)
	if (url.pathname === "/" || url.pathname.endsWith(".html")) {
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
	} catch (_) {
		return new Response("Offline", { status: 503 });
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
	} catch (_) {
		const cached = await caches.match(request);
		if (cached) {
			return cached;
		}
		return new Response("Offline", { status: 503 });
	}
}
