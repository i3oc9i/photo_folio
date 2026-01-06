# Feature: loadedImages.js - Convert to $state Exports

## Priority: Low
## Effort: ~1-2 hours
## File: `web/src/lib/stores/loadedImages.js`

## Current Implementation

Uses `writable` + `derived` + helper functions:

```javascript
import { writable, derived } from 'svelte/store';

export const loadedImageIds = writable(new Set());

export function markImageLoaded(imageId) {
  loadedImageIds.update(set => {
    const newSet = new Set(set);
    newSet.add(imageId);
    return newSet;
  });
}

export function clearLoadedImages() {
  loadedImageIds.set(new Set());
}

export const loadedImageArray = derived(
  loadedImageIds,
  $set => Array.from($set)
);
```

## Proposed Change

Convert to module-level `$state` with simpler API:

```javascript
// Module-level runes (Svelte 5)
let imageIds = $state(new Set());

// Derived as simple getter
export function getLoadedImageIds() {
  return imageIds;
}

export function getLoadedImageArray() {
  return Array.from(imageIds);
}

export function markImageLoaded(imageId) {
  imageIds = new Set([...imageIds, imageId]);
}

export function clearLoadedImages() {
  imageIds = new Set();
}

export function isImageLoaded(imageId) {
  return imageIds.has(imageId);
}
```

## Why This is Better

1. **Simpler mental model**: No store subscription needed
2. **Less boilerplate**: No `writable`/`derived` ceremony
3. **Direct access**: Functions read/write state directly
4. **Type-friendly**: Easier to type with TypeScript

## Caveats

- Components using `loadedImageIds.subscribe()` will need updates
- Check all usages before refactoring

## Steps

1. Find all imports of `loadedImageIds` and `loadedImageArray`
2. Update store to use `$state`
3. Update all consumers to use new API
4. Test image loading behavior

## Files to Update

- `web/src/lib/stores/loadedImages.js` - Main refactor
- `web/src/lib/components/Photo.svelte` - Consumer
- `web/src/lib/components/Lightbox.svelte` - Uses `get(loadedImageArray)`
- Any other consumers

## Testing

- [ ] Images lazy-load correctly
- [ ] Loaded state persists across gallery switches
- [ ] Clear works when switching galleries
- [ ] Lightbox sequence uses loaded images
