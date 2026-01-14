# Research: Gallery Random Order Option

**Date**: 2026-01-12 | **Feature**: 005-gallery-random-order

## Research Summary

All technical context items were resolved through codebase analysis. No external research required.

---

## 1. Current Shuffle Implementation

**Location**: `web/src/lib/utils/shuffle.js:1-9`

**Decision**: Use existing `shuffle()` function as-is, add a new `sortById()` helper alongside it.

**Rationale**:
- Fisher-Yates shuffle is already implemented and working
- Adding a sorting function to the same utility file maintains cohesion
- Both shuffle and sort serve the same purpose: ordering image arrays

**Alternatives Considered**:
- Inline sorting in components → rejected (code duplication, harder to test)
- New utility file → rejected (unnecessary complexity for one function)

---

## 2. Svelte 5 Prop Drilling Pattern

**Location**: `web/src/App.svelte` (existing pattern observed)

**Decision**: Pass `randomOrder` boolean prop from App.svelte to Gallery.svelte and Lightbox.svelte. Pass nullable `onReshuffle` callback to Header.svelte.

**Rationale**:
- Project already uses prop drilling (see `config`, `manifest`, `galleryId` props)
- Svelte 5 runes support this pattern well with `$props()`
- Keeps state management simple without stores

**Alternatives Considered**:
- Svelte store for randomOrder → rejected (overkill for single boolean derived from config)
- Context API → rejected (would require provider/consumer setup for minimal benefit)

---

## 3. Configuration Resolution Logic

**Location**: App.svelte (new `$derived` expression)

**Decision**: Create a helper function to resolve effective `randomOrder` value using per-gallery override with global fallback.

**Rationale**:
- Follows existing pattern for `layout` resolution (per-gallery → defaultLayout)
- Default value `true` maintains backward compatibility (current behavior is shuffle)
- Simple null-coalescing chain: `perGallery?.randomOrder ?? global.randomOrder ?? true`

**Pattern Reference**:
```javascript
// Existing layout pattern (Gallery.svelte:30-32)
let layoutType = $derived(
  config.galleries.items[galleryId]?.layout || config.galleries.defaultLayout || 'organic'
);

// Proposed randomOrder pattern (App.svelte)
let randomOrder = $derived(
  config.galleries.items[galleryId]?.randomOrder ?? config.galleries.randomOrder ?? true
);
```

---

## 4. Header Reshuffle Behavior

**Location**: `web/src/lib/components/Header.svelte`

**Decision**: Accept optional `onReshuffle` prop. When null/undefined, disable click handler on logo.

**Rationale**:
- Current implementation: `onLogoClick` always triggers reshuffle
- New implementation: `onLogoClick` is null when `randomOrder: false`
- Header component doesn't need to know about randomOrder, just whether reshuffle is enabled

**Alternatives Considered**:
- Pass `randomOrder` prop to Header → rejected (leaks implementation detail)
- Pass `reshuffleEnabled` boolean + callback → rejected (redundant, null callback is sufficient)

---

## 5. Sorting Implementation

**Decision**: Sort by `image.id` (string) using `localeCompare()` for proper alphabetical ordering.

**Rationale**:
- `image.id` is the filename without extension (already used as unique key)
- `localeCompare()` handles unicode and case-insensitive sorting properly
- Consistent with filesystem sorting expectations

**Implementation**:
```javascript
export function sortById(array) {
  return [...array].sort((a, b) => a.id.localeCompare(b.id));
}
```

---

## 6. Lightbox Sequence Generation

**Location**: `web/src/lib/components/Lightbox.svelte:23-37`

**Decision**: Modify `generateSequence()` to sort instead of shuffle when `randomOrder: false`.

**Rationale**:
- Current behavior: shuffles all loaded images, puts clicked image first
- New behavior (sorted): sort all images, start at clicked image's position
- User expectation: arrow keys navigate sequentially through alphabetically sorted images

**Implementation Change**:
```javascript
function generateSequence(startId) {
  const allImages = [...getLoadedImageArray()];
  const ordered = randomOrder ? shuffle(allImages) : allImages.sort((a, b) => a.localeCompare(b));

  if (randomOrder) {
    // Current behavior: move start to front
    const startIndex = ordered.indexOf(startId);
    if (startIndex > 0) {
      ordered.splice(startIndex, 1);
      ordered.unshift(startId);
    }
    currentIndex = 0;
  } else {
    // New behavior: start at clicked image's position
    currentIndex = ordered.indexOf(startId);
    if (currentIndex === -1) currentIndex = 0;
  }

  sequence = ordered;
}
```

---

## Open Questions

None. All technical decisions resolved.
