# CLAUDE.md

Technical reference for Claude Code when working with this repository.

## Important Rules

1. **Never commit automatically** - The user decides when to commit. Do not run `git commit` unless explicitly requested.
2. **Record technical decisions** - After making technical changes, evaluate if the decision should be documented in this file (CLAUDE.md).
3. **Update user documentation** - After changes that impact configuration or usage, update README.md to keep user instructions current.

## Project Overview

Photography portfolio built with **Svelte 5 + Vite** (frontend) and **Python** (image processing). Supports multiple galleries with configurable layout styles.

## Architecture

**Python (`src/gallery_builder/`)**: Image processing pipeline - converts photos to WebP, generates per-gallery manifests, auto-updates `site.json` with gallery metadata.

**Frontend (`web/`)**: Svelte 5 SPA bundled with Vite. Configuration split into:
- `site.json`: Content (site info, galleries, panels)
- `theme.json`: Styling (colors, fonts, gallery parameters, breakpoints)

## Directory Structure

```
web/src/lib/
├── components/     # Svelte components
├── stores/         # State management
├── actions/        # Svelte actions (lazyload)
├── utils/
│   ├── layouts/    # Layout algorithms (organic, masonry)
│   └── shuffle.js  # Fisher-Yates shuffle
└── styles/         # CSS with custom properties
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

## Data Flow

```
gallery/<name>/*.jpg → Python → web/public/assets/gallery/<name>/{thumb,medium,full}/*.webp
                              → web/public/assets/gallery/<name>/images.json
                              → web/public/site.json (galleries section updated)

site.json + theme.json → config store → applyTheme() → CSS variables
                       → gallery store → manifest fetch → Gallery.svelte
                       → breakpoint store → currentLayout → position calculations
```

## Adding New Layouts

1. Create `web/src/lib/utils/layouts/<name>.js`:
   - Export `compute<Name>Positions(images, columns, photoSize, galleryConfig, layoutConfig)`
   - Export `calculate<Name>Height(images, columns, photoSize, galleryConfig, layoutConfig)`
2. Register in `layouts/index.js`
3. Add config in `theme.json` under `gallery.layouts.<name>`
4. Add CSS in `global.css`: `.photo.layout-<name>`, `.gallery.layout-<name>`

## Svelte 5 Patterns

- **Runes**: `$state()`, `$derived()`, `$effect()`, `$props()`
- **Stores**: Writable and derived stores in `src/lib/stores/`
- **Actions**: `use:lazyload` for IntersectionObserver
- **Transitions**: `fade`, `fly` from `svelte/transition`
- **Component binding**: `bind:this` for Gallery reshuffle

## Key Paths

| Path | Purpose |
| ---- | ------- |
| `gallery/<name>/` | Source photos (not in git) |
| `web/public/assets/gallery/<name>/` | Generated WebP images |
| `web/public/site.json` | Site content config |
| `web/public/theme.json` | Theme/styling config |
| `web/src/lib/utils/layouts/` | Layout algorithms |
| `web/dist/` | Production build output |
