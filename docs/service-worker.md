# Service Worker & Caching

Technical documentation for the service worker implementation and caching strategies.

## Overview

The service worker provides intelligent caching for the photography portfolio, optimizing repeat visits and enabling offline support. Different caching strategies are applied based on resource type.

## Registration

**File:** `web/src/main.js`

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('Service Worker registered'))
    .catch(err => console.log('Service Worker registration failed:', err));
}
```

The service worker is registered after the app mounts. Registration is conditional on browser support.

## Service Worker Implementation

**File:** `web/public/sw.js`

### Cache Configuration

```javascript
const CACHE_VERSION = 'v5';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
```

Two separate caches are maintained:
- **STATIC_CACHE**: JavaScript, CSS, HTML, config files
- **IMAGE_CACHE**: Gallery images (WebP, JPG, PNG, GIF)

Versioning enables cache invalidation on deployment.

## Lifecycle Events

### Install

```javascript
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
```

- **No pre-caching**: With Vite's hashed filenames, pre-caching specific files is impractical
- **`skipWaiting()`**: Activates the new service worker immediately without waiting for all tabs to close

### Activate

```javascript
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
```

- **Cache cleanup**: Removes old versioned caches
- **`clients.claim()`**: Takes control of all open tabs immediately

## Caching Strategies

### Strategy Matrix

| Resource Type | Strategy | Rationale |
|---------------|----------|-----------|
| Images (WebP, JPG, PNG, GIF) | Cache-first | Immutable assets, fast repeat loads |
| Gallery manifests (`images.json`) | Network-first | Pick up newly added photos |
| Config (`config.json`) | Network-first | Reflect configuration changes |
| JS/CSS (Vite hashed) | Cache-first | Immutable filenames, never change |
| HTML | Network-first | Get latest version |
| Other | Network-only | Pass through to network |

### Fetch Handler

```javascript
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Images: cache-first
  if (url.pathname.includes('/assets/') &&
      url.pathname.match(/\.(webp|jpg|jpeg|png|gif)$/i)) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
    return;
  }

  // Gallery manifests: network-first
  if (url.pathname.includes('images.json')) {
    event.respondWith(networkFirst(event.request, STATIC_CACHE));
    return;
  }

  // Config: network-first
  if (url.pathname.includes('config.json')) {
    event.respondWith(networkFirst(event.request, STATIC_CACHE));
    return;
  }

  // JS/CSS assets: cache-first
  if (url.pathname.match(/\/assets\/.*\.(js|css)$/)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // HTML: network-first
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(event.request, STATIC_CACHE));
    return;
  }

  // Everything else: network only
  event.respondWith(fetch(event.request));
});
```

## Strategy Implementations

### Cache-First

Best for immutable resources (images, hashed JS/CSS).

```javascript
async function cacheFirst(request, cacheName) {
  // Try cache first
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  // Fall back to network
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}
```

**Flow:**
1. Check cache for matching request
2. If found, return cached response immediately
3. If not, fetch from network
4. Cache the response for future requests
5. Return the response

### Network-First

Best for dynamic content that changes (manifests, config, HTML).

```javascript
async function networkFirst(request, cacheName) {
  try {
    // Try network first
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Fall back to cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}
```

**Flow:**
1. Try to fetch from network
2. If successful, cache the response
3. Return the fresh response
4. If network fails, fall back to cache
5. If no cache, return offline error

## Resource Classification

### Images (Cache-First)

```javascript
url.pathname.includes('/assets/') &&
url.pathname.match(/\.(webp|jpg|jpeg|png|gif)$/i)
```

Gallery images are immutable after processing. Once an image is generated, it never changes - only new images are added or old ones removed. Cache-first provides instant loading for viewed images.

### Gallery Manifests (Network-First)

```javascript
url.pathname.includes('images.json')
```

Manifests (`images.json`) change when photos are added or removed. Network-first ensures users see newly added photos while still providing offline access to the last known manifest.

### Vite Assets (Cache-First)

```javascript
url.pathname.match(/\/assets\/.*\.(js|css)$/)
```

Vite generates content-hashed filenames (e.g., `index-a1b2c3d4.js`). If the content changes, the filename changes. This makes cache-first safe - the hash ensures cache busting automatically.

### HTML (Network-First)

```javascript
url.pathname === '/' || url.pathname.endsWith('.html')
```

HTML may contain updated references to new Vite assets. Network-first ensures users get the latest app version while enabling offline access.

## Cache Flow Diagrams

### Cache-First (Images)

```
Request for /assets/gallery/color/medium/photo.webp
                    │
                    ▼
            Check IMAGE_CACHE
                    │
        ┌───────────┴───────────┐
        │                       │
     Found                  Not Found
        │                       │
        ▼                       ▼
  Return cached            Fetch from CDN
                                │
                    ┌───────────┴───────────┐
                    │                       │
                 Success                  Failure
                    │                       │
                    ▼                       ▼
              Cache response          Return 503
                    │
                    ▼
              Return response
```

### Network-First (Manifests)

```
Request for /assets/gallery/color/images.json
                    │
                    ▼
            Fetch from server
                    │
        ┌───────────┴───────────┐
        │                       │
     Success                  Failure
        │                       │
        ▼                       ▼
  Cache response          Check STATIC_CACHE
        │                       │
        ▼           ┌───────────┴───────────┐
  Return fresh      │                       │
                 Found                  Not Found
                    │                       │
                    ▼                       ▼
              Return cached           Return 503
```

## Offline Support

When the network is unavailable:

| Resource | Behavior |
|----------|----------|
| Previously viewed images | Served from cache |
| Gallery manifest | Served from cache (may be stale) |
| App JS/CSS | Served from cache |
| HTML | Served from cache |
| New images | Returns 503 error |

The app degrades gracefully - previously visited galleries work offline, but new content requires connectivity.

## Cache Versioning

When deploying updates:

1. Increment `CACHE_VERSION` in `sw.js`:
   ```javascript
   const CACHE_VERSION = 'v6';  // was 'v5'
   ```

2. On next visit, the new service worker installs

3. On activation, old caches (`static-v5`, `images-v5`) are deleted

4. New caches (`static-v6`, `images-v6`) are populated as resources are requested

### When to Update Version

- After changing caching logic
- After major deployments requiring fresh assets
- When cache has grown too large (forces re-fetch)

## Performance Characteristics

| Metric | Cache-First | Network-First |
|--------|-------------|---------------|
| First load | Network fetch | Network fetch |
| Repeat load | Instant (from cache) | Network latency |
| Offline | Cached content | Cached content |
| Freshness | May be stale | Always fresh |
| Bandwidth | Minimal | Full request each time |

## Debug Tips

### View Cached Resources

1. Open DevTools > Application > Cache Storage
2. Inspect `static-v5` and `images-v5` caches

### Force Service Worker Update

1. DevTools > Application > Service Workers
2. Click "Update" or check "Update on reload"

### Bypass Service Worker

Hold Shift while reloading, or use DevTools > Network > "Disable cache"

### Clear All Caches

```javascript
// In console
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE WORKER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐                     ┌─────────────────────┐    │
│  │   Browser   │                     │      Network        │    │
│  │   Request   │                     │      (CDN/Server)   │    │
│  └──────┬──────┘                     └──────────┬──────────┘    │
│         │                                       │                │
│         ▼                                       │                │
│  ┌──────────────┐                              │                │
│  │ fetch event  │                              │                │
│  │   handler    │                              │                │
│  └──────┬───────┘                              │                │
│         │                                       │                │
│         ▼                                       │                │
│  ┌──────────────────────────────────────────┐  │                │
│  │           Route by URL pattern            │  │                │
│  ├──────────────────────────────────────────┤  │                │
│  │                                           │  │                │
│  │  /assets/*.webp  ──► cacheFirst()  ◄─────┼──┤                │
│  │                           │               │  │                │
│  │  images.json     ──► networkFirst() ◄────┼──┤                │
│  │                           │               │  │                │
│  │  *.js, *.css     ──► cacheFirst()  ◄─────┼──┤                │
│  │                           │               │  │                │
│  │  /, *.html       ──► networkFirst() ◄────┼──┤                │
│  │                           │               │  │                │
│  └───────────────────────────┼───────────────┘  │                │
│                              │                   │                │
│                              ▼                   │                │
│  ┌─────────────────────────────────────────────┐│                │
│  │              Cache Storage                   ││                │
│  ├─────────────────────────────────────────────┤│                │
│  │  static-v5:  JS, CSS, HTML, config          ││                │
│  │  images-v5:  WebP, JPG, PNG, GIF            ││                │
│  └─────────────────────────────────────────────┘│                │
│                                                   │                │
└─────────────────────────────────────────────────────────────────┘
```
