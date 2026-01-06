# Feature: gallery.js - Convert to Module-Level Runes

## Priority: Low
## Effort: ~2-3 hours
## File: `web/src/lib/stores/gallery.js`

## Current Implementation

Uses `writable` + `derived` with manual `get()` calls:

```javascript
import { writable, derived, get } from 'svelte/store';
import { config } from './config.js';

export const currentGalleryId = writable(null);
export const manifestCache = writable({});

export const currentManifest = derived(
  [currentGalleryId, manifestCache],
  ([$id, $cache]) => $cache[$id] || null
);

export async function loadManifest(galleryId) {
  const $config = get(config);
  const $cache = get(manifestCache);

  if ($cache[galleryId]) return $cache[galleryId];

  const path = $config.assets.path;
  const manifest = await fetch(`${path}${galleryId}/images.json`).then(r => r.json());

  manifestCache.update(cache => ({ ...cache, [galleryId]: manifest }));
  return manifest;
}

export async function switchGallery(galleryId) {
  await loadManifest(galleryId);
  currentGalleryId.set(galleryId);
  history.replaceState(null, '', `#gallery=${galleryId}`);
}
```

## Proposed Change

Convert to module-level runes with accessor functions:

```javascript
import { get } from 'svelte/store';
import { config } from './config.js';

// Module-level state
let galleryId = $state(null);
let cache = $state({});

// Derived value
let manifest = $derived(cache[galleryId] || null);

// Accessors for external use
export function getCurrentGalleryId() {
  return galleryId;
}

export function getCurrentManifest() {
  return manifest;
}

export function getManifestCache() {
  return cache;
}

// Actions
export async function loadManifest(id) {
  if (cache[id]) return cache[id];

  const $config = get(config);
  const path = $config.assets.path;
  const data = await fetch(`${path}${id}/images.json`).then(r => r.json());

  cache = { ...cache, [id]: data };
  return data;
}

export async function switchGallery(id) {
  await loadManifest(id);
  galleryId = id;
  history.replaceState(null, '', `#gallery=${id}`);
}

// For components that need reactive subscription
export function subscribeToGalleryId(callback) {
  $effect(() => {
    callback(galleryId);
  });
}
```

## Why This is Better

1. **Encapsulation**: State is private, accessed via functions
2. **No `get()` for internal reads**: Direct access to module state
3. **Cleaner derived**: `$derived` is simpler than `derived([...], ...)`
4. **Explicit API**: Clear what operations are available

## Caveats

- **Breaking change**: Components using `.subscribe()` need updates
- **Config store**: Still uses traditional store (may need to keep `get()`)
- Consider if the refactor is worth the effort

## Steps

1. [x] Map all usages of `currentGalleryId`, `currentManifest`, `manifestCache`
2. [x] Refactor store to use `$state` and `$derived`
3. [x] Create accessor functions
4. [x] Update all consumers
5. [x] Test thoroughly (build passes)

## Files Updated

- [x] `web/src/lib/stores/gallery.svelte.js` - Converted to $state/$derived (renamed from .js)
- [x] `web/src/App.svelte` - Updated to use getter functions with $derived
- `web/src/lib/components/Gallery.svelte` - No changes needed (uses manifest prop)
- `web/src/lib/components/GallerySelector.svelte` - No changes needed (uses galleryId prop)

## Testing

- [x] Gallery loads on page load
- [x] Gallery switching works
- [x] Hash navigation works
- [x] Manifest caching works (no re-fetch)
- [x] URL updates on gallery switch

## Dependencies

Consider doing after `002-app-effect-subscriptions.md` to minimize churn.
