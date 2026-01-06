# Web Architecture

Technical documentation for the Svelte 5 frontend architecture.

## Overview

The web frontend is a Svelte 5 Single Page Application (SPA) bundled with Vite. It implements a photography portfolio with multiple galleries, lazy-loaded images, and responsive layouts.

## Svelte 5 Runes

The application uses Svelte 5's runes API for reactivity:

### `$state()`
Creates reactive local state within components.

```javascript
// App.svelte
let config = $state(null);
let loading = $state(true);
let splashVisible = $state(true);
let aboutPanelOpen = $state(false);
```

### `$derived()`
Creates computed values that update automatically when dependencies change.

```javascript
// App.svelte
let galleryPath = $derived(
  config && galleryId ? `${config.assets.path}${galleryId}/` : ''
);

// Photo.svelte
let encodedId = $derived(encodeURIComponent(image.id));
let thumbSrc = $derived(`${galleryPath}thumb/${encodedId}.webp`);
let mediumSrc = $derived(`${galleryPath}medium/${encodedId}.webp`);
```

### `$effect()`
Runs side effects when reactive dependencies change. Used for subscriptions and cleanup.

### `$props()`
Declares component props with destructuring.

```javascript
// Photo.svelte
let {
  image,
  position,
  galleryPath,
  layoutType = 'organic',
  mobileBreakpoint,
  eagerLoad = false,
  onClick
} = $props();
```

## Component Hierarchy

```
App.svelte                    # Root orchestrator
├── Splash.svelte             # Entry overlay with fade transition
├── Header.svelte             # Navigation + logo (click triggers reshuffle)
├── GallerySelector.svelte    # Gallery dropdown menu
├── Gallery.svelte            # Photo grid container + layout engine
│   └── Photo.svelte          # Individual photo with lazy loading
├── Panel.svelte              # Slide-in panels (About/Credits)
├── Overlay.svelte            # Dark backdrop for panels
├── Lightbox.svelte           # Fullscreen photo viewer
└── ScrollTopButton.svelte    # Scroll-to-top floating button
```

## State Management

The application uses Svelte stores for global state management.

### Store Files

| Store | File | Purpose |
|-------|------|---------|
| `config` | `stores/config.js` | Site + theme configuration |
| `currentGalleryId` | `stores/gallery.js` | Active gallery ID |
| `manifestCache` | `stores/gallery.js` | Cached gallery manifests |
| `currentManifest` | `stores/gallery.js` | Derived: current gallery's manifest |
| `windowWidth` | `stores/breakpoint.js` | Reactive window width |
| `currentLayout` | `stores/breakpoint.js` | Derived: responsive layout config |
| `isMobile` | `stores/breakpoint.js` | Derived: mobile detection |
| `loadedImageIds` | `stores/loadedImages.js` | Set of loaded image IDs |

### config.js

Handles configuration loading and theme application.

```javascript
// Load and merge site.json + theme.json
export async function loadConfig() {
  const [siteRes, themeRes] = await Promise.all([
    fetch('/site.json'),
    fetch('/theme.json')
  ]);
  const site = await siteRes.json();
  const theme = await themeRes.json();
  const merged = { ...site, ...theme };
  config.set(merged);
  return merged;
}

// Apply theme as CSS custom properties
export function applyTheme(theme) {
  const root = document.documentElement;

  // Colors: --color-background, --color-text, etc.
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${camelToKebab(key)}`, value);
  });

  // Fonts: --font-heading, --font-body
  root.style.setProperty('--font-heading', theme.fonts.heading);
  root.style.setProperty('--font-body', theme.fonts.body);

  // Transitions: --transition-splash, --transition-gallery, etc.
  Object.entries(theme.transitions).forEach(([key, value]) => {
    root.style.setProperty(`--transition-${key}`, `${value}s`);
  });
}
```

### gallery.js

Manages gallery state with manifest caching.

```javascript
// Core stores
export const currentGalleryId = writable(null);
export const manifestCache = writable({});

// Derived store: combines ID and cache
export const currentManifest = derived(
  [currentGalleryId, manifestCache],
  ([$id, $cache]) => $cache[$id] || null
);

// Load manifest with caching
export async function loadManifest(galleryId) {
  const $cache = get(manifestCache);
  if ($cache[galleryId]) return $cache[galleryId];

  const manifest = await fetch(`${path}${galleryId}/images.json`).then(r => r.json());
  manifestCache.update(cache => ({ ...cache, [galleryId]: manifest }));
  return manifest;
}

// Switch gallery + update URL hash
export async function switchGallery(galleryId) {
  await loadManifest(galleryId);
  currentGalleryId.set(galleryId);
  history.replaceState(null, '', `#gallery=${galleryId}`);
}
```

### breakpoint.js

Provides responsive layout configuration.

```javascript
// Reactive window width (with SSR safety)
export const windowWidth = readable(
  typeof window !== 'undefined' ? window.innerWidth : 1920,
  (set) => {
    const handler = () => set(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }
);

// Current layout based on breakpoints (sorted desc by minWidth)
export const currentLayout = derived(
  [windowWidth, config],
  ([$width, $config]) => {
    return $config.breakpoints.find(bp => $width >= bp.minWidth);
  }
);

// Mobile detection
export const isMobile = derived(
  [windowWidth, config],
  ([$width, $config]) => $width < $config.mobileBreakpoint
);
```

## Svelte Actions

Actions are reusable DOM behaviors attached via `use:` directive.

### lazyload Action

Located in `actions/lazyload.js`. Uses IntersectionObserver for deferred image loading.

```javascript
export function lazyload(node, options = {}) {
  const { rootMargin = '800px 0px', onLoad, eager = false } = options;

  if (eager) {
    if (onLoad) onLoad();
    return { destroy() {} };
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (onLoad) onLoad();
          observer.unobserve(node);
        }
      });
    },
    { rootMargin, threshold: 0 }
  );

  observer.observe(node);

  return {
    destroy() { observer.disconnect(); },
    update(newOptions) { /* handle eager change */ }
  };
}
```

Usage in Photo.svelte:
```svelte
<div use:lazyload={{ rootMargin: '800px 0px', onLoad: triggerLoad, eager: eagerLoad }}>
```

## Theme System

Configuration is split into two files:

### site.json (Content)
```json
{
  "site": { "title", "name", "subtitle", "enterButtonText" },
  "galleries": { "default", "items": {}, "defaultLayout" },
  "panels": { "about", "credits" }
}
```

### theme.json (Styling)
```json
{
  "assets": { "path", "manifestFile" },
  "gallery": { "eagerLoadCount", "margins", "layouts" },
  "breakpoints": [{ "minWidth", "columns", "photoSize" }],
  "mobileBreakpoint": 768,
  "theme": { "colors", "fonts", "transitions" }
}
```

### CSS Custom Properties

Theme values are converted to CSS variables at runtime:

| Config Path | CSS Variable |
|-------------|--------------|
| `theme.colors.background` | `--color-background` |
| `theme.colors.textMuted` | `--color-text-muted` |
| `theme.fonts.heading` | `--font-heading` |
| `theme.transitions.splash` | `--transition-splash` |

## Responsive Breakpoints

Breakpoints are defined in `theme.json` as an array sorted by `minWidth` descending:

```json
"breakpoints": [
  { "minWidth": 1600, "columns": 7, "photoSize": 13 },
  { "minWidth": 1440, "columns": 6, "photoSize": 15 },
  { "minWidth": 1280, "columns": 5, "photoSize": 18 },
  { "minWidth": 1024, "columns": 4, "photoSize": 22 },
  { "minWidth": 768,  "columns": 3, "photoSize": 30 },
  { "minWidth": 0,    "columns": 2, "photoSize": 42 }
]
```

The `currentLayout` store finds the first matching breakpoint for the current window width.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         INITIALIZATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  site.json + theme.json                                          │
│         │                                                         │
│         ▼                                                         │
│    loadConfig()                                                   │
│         │                                                         │
│         ├──► config store ──► applyTheme() ──► CSS variables     │
│         │                                                         │
│         └──► initGallery()                                       │
│                   │                                               │
│                   ▼                                               │
│            loadManifest()                                         │
│                   │                                               │
│                   ├──► manifestCache store                       │
│                   │                                               │
│                   └──► currentGalleryId store                    │
│                              │                                    │
│                              ▼                                    │
│                       currentManifest (derived)                   │
│                              │                                    │
│                              ▼                                    │
│                       Gallery.svelte renders                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      RESPONSIVE LAYOUT                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  window resize event                                             │
│         │                                                         │
│         ▼                                                         │
│    windowWidth store                                              │
│         │                                                         │
│         ▼                                                         │
│    currentLayout (derived from breakpoints)                      │
│         │                                                         │
│         ▼                                                         │
│    Gallery.svelte repositions photos                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Store Subscription Pattern

In Svelte 5 runes mode, stores don't auto-subscribe with `$`. Manual subscription is required:

```javascript
// App.svelte
onMount(async () => {
  // Subscribe to stores
  const unsubGalleryId = currentGalleryId.subscribe(v => galleryId = v);
  const unsubManifest = currentManifest.subscribe(v => manifest = v);

  // ... initialization ...

  return () => {
    unsubGalleryId();
    unsubManifest();
  };
});
```

## Layout System

Layouts are implemented as pluggable algorithms in `utils/layouts/`.

### Registry Pattern

```javascript
// layouts/index.js
const layouts = {
  organic: { computePositions, calculateHeight },
  masonry: { computePositions, calculateHeight }
};

export function getLayout(layoutType) {
  return layouts[layoutType] || layouts.organic;
}

export function registerLayout(name, implementation) {
  layouts[name] = implementation;
}
```

### Adding a New Layout

1. Create `layouts/newlayout.js` with:
   - `computeNewlayoutPositions(images, breakpointLayout, galleryConfig, layoutConfig)`
   - `calculateNewlayoutHeight(positions, breakpointLayout, galleryConfig, layoutConfig)`

2. Register in `layouts/index.js`

3. Add config in `theme.json`:
   ```json
   "gallery": {
     "layouts": {
       "newlayout": { /* layout-specific config */ }
     }
   }
   ```

4. Add CSS in `global.css`:
   ```css
   .photo.layout-newlayout { /* styles */ }
   .gallery.layout-newlayout { /* styles */ }
   ```

## Key Technical Decisions

### Manifest Caching
Manifests are cached in-memory to prevent re-fetching when switching galleries. This provides instant gallery switching after first load.

### CSS Custom Properties
Theme values are applied as CSS variables rather than inline styles. This allows CSS transitions and keeps styling in CSS where it belongs.

### Derived Stores
Computed values use derived stores rather than manual updates. This ensures consistency and reduces bugs from stale state.

### Action Pattern
The lazyload behavior is encapsulated in a reusable action rather than being embedded in components. This enables easy testing and reuse.

### URL Hash Sync
Gallery selection syncs with the URL hash (`#gallery=name`), enabling direct linking and browser history navigation.
