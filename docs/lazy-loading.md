# Lazy Loading System

Technical documentation for the image lazy loading implementation.

## Overview

The lazy loading system defers image loading until images approach the viewport, improving initial page load performance. It uses the browser's native IntersectionObserver API wrapped in a Svelte action.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      LAZY LOADING FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Gallery.svelte                                                   │
│       │                                                           │
│       │ renders Photo components with eagerLoad prop              │
│       │ (first 12 = true, rest = false)                          │
│       ▼                                                           │
│  Photo.svelte                                                     │
│       │                                                           │
│       │ use:lazyload action attached to container div            │
│       ▼                                                           │
│  lazyload.js                                                      │
│       │                                                           │
│       ├─► eager=true: immediately call onLoad()                  │
│       │                                                           │
│       └─► eager=false: create IntersectionObserver               │
│                │                                                  │
│                │ observes photo container                        │
│                │                                                  │
│                ▼                                                  │
│           isIntersecting? ──yes──► onLoad() ──► triggerLoad()    │
│                                         │                         │
│                                         ▼                         │
│                                    loaded = true                  │
│                                         │                         │
│                                         ▼                         │
│                                   {#if loaded}                    │
│                                    <picture>                      │
│                                         │                         │
│                                         ▼                         │
│                                    <img onload>                   │
│                                         │                         │
│                                         ▼                         │
│                                   handleLoad()                    │
│                                         │                         │
│                                         ▼                         │
│                               markImageLoaded(id)                 │
│                                         │                         │
│                                         ▼                         │
│                               loadedImageIds store                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## The lazyload Action

**File:** `web/src/lib/actions/lazyload.js`

```javascript
export function lazyload(node, options = {}) {
  const { rootMargin = '800px 0px', onLoad, eager = false } = options;

  // Eager load: trigger immediately without observer
  if (eager) {
    if (onLoad) onLoad();
    return { destroy() {} };
  }

  // Lazy load: use IntersectionObserver
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (onLoad) onLoad();
          observer.unobserve(node);  // Stop observing after trigger
        }
      });
    },
    { rootMargin, threshold: 0 }
  );

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();  // Cleanup on component destroy
    },
    update(newOptions) {
      // Handle dynamic eager change
      if (newOptions.eager && !options.eager) {
        if (newOptions.onLoad) newOptions.onLoad();
        observer.disconnect();
      }
    }
  };
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rootMargin` | string | `'800px 0px'` | IntersectionObserver margin. Images load 800px before entering viewport |
| `onLoad` | function | - | Callback when intersection triggers |
| `eager` | boolean | `false` | If true, triggers immediately without observer |

### Return Object

- **`destroy()`**: Called when the component unmounts. Disconnects the observer to prevent memory leaks.
- **`update(newOptions)`**: Called when action options change. Handles switching from lazy to eager mode.

## Photo Component Integration

**File:** `web/src/lib/components/Photo.svelte`

```svelte
<script>
  import { lazyload } from '$lib/actions/lazyload.js';
  import { markImageLoaded } from '$lib/stores/loadedImages.js';

  let {
    image,
    position,
    galleryPath,
    layoutType = 'organic',
    mobileBreakpoint,
    eagerLoad = false,
    onClick
  } = $props();

  let loaded = $state(false);

  // Called when <img> finishes loading
  function handleLoad() {
    loaded = true;
    markImageLoaded(image.id);  // Register in store for lightbox
  }

  // Called by IntersectionObserver (or immediately if eager)
  function triggerLoad() {
    loaded = true;  // Adds <picture> to DOM, starts fetch
  }

  // Responsive image paths
  let encodedId = $derived(encodeURIComponent(image.id));
  let thumbSrc = $derived(`${galleryPath}thumb/${encodedId}.webp`);
  let mediumSrc = $derived(`${galleryPath}medium/${encodedId}.webp`);
</script>

<div
  class="photo {image.orientation} layout-{layoutType}"
  class:loaded
  use:lazyload={{ rootMargin: '800px 0px', onLoad: triggerLoad, eager: eagerLoad }}
  ...
>
  {#if loaded}
    <picture>
      <source media="(max-width: {mobileBreakpoint}px)" srcset={thumbSrc} />
      <source srcset={mediumSrc} />
      <img src={mediumSrc} alt="Fine art photograph" onload={handleLoad} />
    </picture>
  {/if}
</div>
```

### Two-Stage Loading

1. **Stage 1: Intersection Detection**
   - `triggerLoad()` is called when the photo enters the viewport margin
   - Sets `loaded = true`
   - The `{#if loaded}` block renders the `<picture>` element
   - Browser begins fetching the image

2. **Stage 2: Image Load Complete**
   - `handleLoad()` is called when the `<img>` finishes loading
   - Calls `markImageLoaded(image.id)` to register in the store
   - The `loaded` class enables CSS transitions for reveal animation

### Responsive Image Selection

The `<picture>` element provides responsive image selection:

```html
<picture>
  <source media="(max-width: 768px)" srcset="thumb/image.webp" />
  <source srcset="medium/image.webp" />
  <img src="medium/image.webp" />
</picture>
```

- **Mobile** (< 768px): Loads `thumb` (400px) version
- **Desktop**: Loads `medium` (800px) version

## Loaded Images Store

**File:** `web/src/lib/stores/loadedImages.js`

Tracks which images have fully loaded. Used by the Lightbox for navigation sequence.

```javascript
import { writable, derived } from 'svelte/store';

// Set of loaded image IDs
export const loadedImageIds = writable(new Set());

// Add image to loaded set
export function markImageLoaded(imageId) {
  loadedImageIds.update(set => {
    const newSet = new Set(set);
    newSet.add(imageId);
    return newSet;
  });
}

// Clear on gallery switch
export function clearLoadedImages() {
  loadedImageIds.set(new Set());
}

// Array version for iteration
export const loadedImageArray = derived(
  loadedImageIds,
  $set => Array.from($set)
);
```

### Why Track Loaded Images?

The Lightbox only navigates through images that have been loaded. This ensures:
- Users don't wait for images to load while navigating
- The navigation sequence reflects what they've seen
- Memory usage is bounded to visible content

## Eager Loading

The first N images load immediately without waiting for scroll.

### Configuration

**File:** `web/public/theme.json`

```json
{
  "gallery": {
    "eagerLoadCount": 12,
    "lazyLoadMargin": 800
  }
}
```

### Gallery.svelte Integration

```svelte
{#each shuffledImages as image, index (image.id)}
  <Photo
    {image}
    eagerLoad={index < config.gallery.eagerLoadCount}
    ...
  />
{/each}
```

Images with index < 12 receive `eagerLoad={true}`, causing the lazyload action to trigger immediately.

## IntersectionObserver Settings

### rootMargin: '800px 0px'

The `800px` vertical margin means images start loading 800 pixels before they enter the viewport. This provides:
- Smooth scrolling without visible loading delays
- Buffer for fast scrolling
- Balanced between preloading and memory usage

### threshold: 0

A threshold of 0 means the callback fires as soon as any part of the element enters the observation area. This is optimal for loading triggers where partial visibility is sufficient.

## Performance Characteristics

| Aspect | Value | Effect |
|--------|-------|--------|
| Eager Load Count | 12 images | Initial above-fold content loads immediately |
| Lazy Load Margin | 800px | Images prefetch before visible |
| Intersection Threshold | 0 | Triggers on first pixel entering margin |
| Image Format | WebP | 60% smaller than JPEG |
| Responsive Sizes | thumb (400px) / medium (800px) | Mobile: ~30KB, Desktop: ~150KB |
| Store Data Structure | Set | O(1) duplicate detection |

## Data Flow Diagram

```
INITIAL LOAD (index < eagerLoadCount)
────────────────────────────────────
Gallery renders Photo with eagerLoad=true
         │
         ▼
lazyload action sees eager=true
         │
         ▼
Immediately calls onLoad() → triggerLoad()
         │
         ▼
loaded = true → <picture> renders → fetch starts
         │
         ▼
<img onload> → handleLoad() → markImageLoaded()
         │
         ▼
loadedImageIds Set updated


SCROLL LOAD (index >= eagerLoadCount)
────────────────────────────────────
Gallery renders Photo with eagerLoad=false
         │
         ▼
lazyload action creates IntersectionObserver
         │
         ▼
User scrolls, photo enters 800px margin
         │
         ▼
isIntersecting=true → observer.unobserve() → onLoad()
         │
         ▼
triggerLoad() → loaded = true → <picture> renders
         │
         ▼
<img onload> → handleLoad() → markImageLoaded()


LIGHTBOX NAVIGATION
───────────────────
User clicks photo → Lightbox opens
         │
         ▼
get(loadedImageArray) → Array of loaded IDs
         │
         ▼
shuffle() → random order
         │
         ▼
Navigate only through loaded images
```

## Memory Management

### Observer Cleanup

The action returns a `destroy()` function that disconnects the observer:

```javascript
return {
  destroy() {
    observer.disconnect();
  }
};
```

This is automatically called by Svelte when the component unmounts, preventing memory leaks.

### Single Observation

After triggering, the observer stops watching the element:

```javascript
if (entry.isIntersecting) {
  if (onLoad) onLoad();
  observer.unobserve(node);  // Stop observing
}
```

This reduces observer overhead as images load.

### Gallery Switch

When switching galleries, loaded images are cleared:

```javascript
export function clearLoadedImages() {
  loadedImageIds.set(new Set());
}
```

This resets memory usage for the new gallery.

## Configuration Reference

| Config Path | Default | Description |
|-------------|---------|-------------|
| `gallery.eagerLoadCount` | 12 | Number of images to load immediately |
| `gallery.lazyLoadMargin` | 800 | Pixels before viewport to start loading |
| `mobileBreakpoint` | 768 | Width threshold for thumb vs medium images |
