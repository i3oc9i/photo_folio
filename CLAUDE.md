# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**photo_folio** is a photography portfolio website built with **Svelte 5** and **Vite**, with Python-based image preprocessing. The site displays photos using configurable **layout styles** (organic grid or masonry) with a dark theme. Supports **multiple galleries** based on input subdirectories, each with its own layout style.

## Commands

```bash
# Setup
uv venv             # Create virtual environment (first time only)
uv sync --extra dev # Install Python dependencies (enables poe commands)
uv run poe init     # Install Node.js dependencies

# Development
uv run poe dev              # Process images + start dev server
uv run poe dev:assets       # Process images from gallery/ → web/public/assets/gallery/
uv run poe dev:assets:force # Reprocess all images (ignore cache)
uv run poe dev:serve        # Start Vite dev server at http://localhost:8080
uv run poe dev:build        # Production build → web/dist/
uv run poe dev:preview      # Preview production build

# Cleanup
uv run poe clean            # Remove generated gallery assets
uv run poe clean:dist       # Remove production build output
uv run poe clean:all        # Remove assets, dist, node_modules, __pycache__
uv run poe clean:reset      # Full reset including .venv
```

## Architecture

**Python (`src/gallery_builder/`)**: Image processing pipeline that converts photos to WebP format. Discovers galleries from `gallery/` subdirectories, generates per-gallery manifests, and auto-updates `site.json + theme.json` with gallery metadata.

**Frontend (`web/`)**: Svelte 5 application bundled with Vite.

```
web/
├── src/
│   ├── lib/
│   │   ├── components/      # Svelte components
│   │   │   ├── Splash.svelte
│   │   │   ├── Header.svelte
│   │   │   ├── GallerySelector.svelte
│   │   │   ├── Gallery.svelte
│   │   │   ├── Photo.svelte
│   │   │   ├── Panel.svelte
│   │   │   ├── Overlay.svelte
│   │   │   ├── Lightbox.svelte
│   │   │   └── ScrollTopButton.svelte
│   │   ├── stores/          # Svelte stores
│   │   │   ├── config.js    # Site configuration
│   │   │   ├── gallery.js   # Current gallery + manifest cache
│   │   │   ├── breakpoint.js # Responsive layout detection
│   │   │   └── loadedImages.js # Loaded image tracking for lightbox
│   │   ├── actions/
│   │   │   └── lazyload.js  # IntersectionObserver action
│   │   ├── utils/
│   │   │   ├── shuffle.js   # Fisher-Yates shuffle
│   │   │   ├── positions.js # Legacy wrapper for layouts
│   │   │   └── layouts/     # Layout algorithms
│   │   │       ├── index.js   # Layout registry
│   │   │       ├── organic.js # Scattered photos layout
│   │   │       └── masonry.js # Pinterest-style layout
│   │   └── styles/
│   │       └── global.css   # Global styles + CSS custom properties
│   ├── App.svelte           # Root component
│   └── main.js              # Entry point + service worker registration
├── public/
│   ├── assets/              # generated galleries
│   ├── site.json + theme.json          # Site configuration
│   └── sw.js                # Service Worker for caching
├── index.html               # Vite entry point
├── vite.config.js
├── svelte.config.js
└── package.json
```

## Component Hierarchy

```
App.svelte
├── Splash.svelte           # Entry overlay (fade transition)
├── Header.svelte           # Navigation with logo
├── GallerySelector.svelte  # Gallery dropdown
├── Gallery.svelte          # Photo grid container
│   └── Photo.svelte        # Individual photo (lazy loading)
├── Panel.svelte            # Slide-in panels (About/Credits)
├── Overlay.svelte          # Dark backdrop for panels
├── Lightbox.svelte         # Fullscreen photo viewer
└── ScrollTopButton.svelte  # Scroll-to-top button
```

## State Management

| Store              | Purpose                                               |
| ------------------ | ----------------------------------------------------- |
| `config`           | Site configuration loaded from site.json + theme.json |
| `currentGalleryId` | Active gallery ID, syncs with URL hash                |
| `manifestCache`    | Cached gallery manifests (persists across switches)   |
| `currentManifest`  | Derived: current gallery's image manifest             |
| `currentLayout`    | Derived: responsive layout config from window width   |
| `loadedImageIds`   | Set of loaded image IDs for lightbox sequence         |

## Multi-Gallery System

Each subdirectory in `gallery/` becomes a separate gallery:

```
gallery/
  bw/           → web/public/assets/gallery/bw/{thumb,medium,full}/*.webp + images.json
  colors/       → web/public/assets/gallery/colors/{thumb,medium,full}/*.webp + images.json
  portraits/    → web/public/assets/gallery/portraits/{thumb,medium,full}/*.webp + images.json
```

**Auto-sync**: Running `poe dev:assets` automatically updates `site.json` galleries section:

- New directories are added with auto-generated display names (title case)
- Existing custom display names are preserved
- Removed directories are cleaned from config
- Default gallery is preserved if it still exists

**Gallery selector**: Dropdown in secondary header bar allows switching galleries. URL hash (`#gallery=bw`) enables bookmarking specific galleries.

## Layout System

Each gallery can use a different layout style. Configured via `site.json`:

```json
{
  "galleries": {
    "defaultLayout": "organic",
    "items": {
      "portraits": { "displayName": "Portraits", "order": 1, "layout": "organic" },
      "street": { "displayName": "Street", "order": 2, "layout": "masonry" }
    }
  }
}
```

### Available Layouts

| Layout    | Description                                                    | Config (`theme.json`)                     |
| --------- | -------------------------------------------------------------- | ----------------------------------------- |
| `organic` | Scattered photos with random offsets/rotation ("table" feel)   | `randomOffset`, `rotation`, `dealingRotation`, `dealingDelay` |
| `masonry` | Pinterest-style clean grid, no rotation                        | `gutter`, `dealingDelay`                  |

Layout-specific parameters are in `theme.json` under `gallery.layouts`:

```json
{
  "gallery": {
    "layouts": {
      "organic": {
        "randomOffset": { "min": -3, "max": 3 },
        "rotation": { "min": -1, "max": 1 },
        "dealingRotation": { "min": -30, "max": 30 },
        "dealingDelay": 0.03
      },
      "masonry": {
        "gutter": 1.5,
        "dealingDelay": 0.02
      }
    }
  }
}
```

### Adding New Layouts

1. Create `web/src/lib/utils/layouts/<name>.js` with `compute<Name>Positions()` and `calculate<Name>Height()`
2. Register in `layouts/index.js`
3. Add config in `theme.json` under `gallery.layouts.<name>`
4. Add CSS styles in `global.css` (`.photo.layout-<name>`, `.gallery.layout-<name>`)

## Configuration System

All configurable items are in `web/public/site.json + theme.json`. Loaded at startup via the `config` store:

1. Sets CSS custom properties for theming (`--color-*`, `--font-*`, `--transition-*`)
2. Populates page content (title, splash, logo, panel text)
3. Populates gallery selector dropdown
4. Uses gallery/breakpoint settings for layout calculations

### Config Structure

| Section             | Purpose                                                                              |
| ------------------- | ------------------------------------------------------------------------------------ |
| `site`              | Name, title, subtitle, button text, alt text template                                |
| `galleries`         | Default gallery, defaultLayout, items with displayName, order, layout (per-gallery)  |
| `assets`            | Path to assets folder, manifest filename                                             |
| `gallery`           | Eager load count, margins, and nested `layouts` config for each layout type          |
| `gallery.layouts`   | Per-layout settings: `organic` (offsets, rotation), `masonry` (gutter)               |
| `breakpoints`       | Array of responsive layouts (minWidth, columns, photoSize)                           |
| `mobileBreakpoint`  | Width threshold for mobile image sources                                             |
| `panels`            | About/Credits content, contact info, copyright                                       |
| `theme.colors`      | All color values (background, text variants, borders)                                |
| `theme.fonts`       | Heading and body font families                                                       |
| `theme.transitions` | Duration values for animations                                                       |

## Asset Sizes

| Size     | Max Edge | Purpose                     |
| -------- | -------- | --------------------------- |
| `thumb`  | 400px    | Mobile gallery view         |
| `medium` | 800px    | Desktop gallery view        |
| `full`   | 1600px   | Lightbox (full-screen view) |

Images are resized so the longest edge matches the max size, preserving aspect ratio.

## Responsive Breakpoints

Gallery adapts from 7 columns (large screens) to 2 columns (mobile):

| Screen Width | Columns | Photo Size |
| ------------ | ------- | ---------- |
| ≥1600px      | 7       | 13vw       |
| 1440-1599px  | 6       | 15vw       |
| 1280-1439px  | 5       | 18vw       |
| 1024-1279px  | 4       | 22vw       |
| 768-1023px   | 3       | 30vw       |
| <768px       | 2       | 42vw       |

Breakpoints defined in `site.json + theme.json` and used by the `breakpoint` store. CSS media queries in `global.css` handle photo sizing.

## Key Behaviors

### Splash Screen

- Shows on every page load/refresh
- Click "Enter" to reveal gallery with dealing animation
- Uses Svelte `fade` transition

### Gallery

- **Gallery selector**: Dropdown to switch between galleries
- **Click logo**: Reshuffles current gallery with new random arrangement
- **Resize window**: Reactive repositioning via `currentLayout` store
- **Hover photo**: Slight scale + shadow effect (CSS)
- **URL hash**: `#gallery=<id>` for bookmarking (e.g., `#gallery=bw`)

### Lightbox Navigation

- **Click photo**: Opens lightbox with random sequence
- **Arrow Right / Click image**: Next photo
- **Arrow Left**: Previous photo
- **Escape**: Close (discards sequence)

### Performance

- **Service Worker**: Caches images for offline/fast repeat visits
- **Eager loading**: First N images load immediately (configurable)
- **Lazy loading**: `lazyload` action with IntersectionObserver
- **Manifest caching**: Gallery manifests cached in `manifestCache` store
- **Svelte reactivity**: Efficient DOM updates via keyed `{#each}` blocks
- **Lightbox caching**: Loaded image IDs tracked in `loadedImageIds` store

## Data Flow

```
gallery/<name>/*.jpg → process.py → web/public/assets/gallery/<name>/{thumb,medium,full}/*.webp
                                  → web/public/assets/gallery/<name>/images.json
                                  → web/public/site.json (galleries section updated)
                                         ↓
site.json + theme.json ──→ config store ──→ applyTheme() ──→ CSS variables
                    ↓
              gallery store ──→ manifest fetch ──→ Gallery.svelte
                    ↓
              breakpoint store ──→ currentLayout ──→ position calculations
```

## Key Paths

- `gallery/<name>/` - Drop original photos in subdirectories (not in git)
- `web/public/assets/gallery/<name>/` - Generated images per gallery (not in git, rebuild with `poe dev:assets`)
- `web/public/site.json + theme.json` - Site configuration (galleries section auto-updated)
- `web/src/` - Svelte source code
- `web/dist/` - Production build output (deploy this + assets)

## Svelte 5 Patterns Used

- **Runes**: `$state()`, `$derived()`, `$effect()`, `$props()`
- **Stores**: Writable and derived stores in `src/lib/stores/`
- **Actions**: `use:lazyload` for IntersectionObserver
- **Transitions**: `fade`, `fly` from `svelte/transition`
- **Component binding**: `bind:this` for Gallery reshuffle
