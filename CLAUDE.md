# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**photo_folio** is a photography portfolio website with Python-based image preprocessing. The site displays photos using an **organic grid** layout (grid-based positioning with random offsets for a natural "scattered on table" feel) with a dark theme. Supports **multiple galleries** based on input subdirectories.

## Commands

```bash
uv sync --extra dev      # Install dependencies including dev tools
uv run poe assets        # Process images from input/<gallery>/ → web/assets/<gallery>/
uv run poe assets:force  # Reprocess all images (ignore cache)
uv run poe serve         # Start dev server at http://localhost:8080
uv run poe dev           # Process images + start server
```

## Architecture

**Python (`src/photo_tools/`)**: Image processing pipeline that converts photos to WebP format. Discovers galleries from `input/` subdirectories, generates per-gallery manifests, and auto-updates `config.json` with gallery metadata.

**Website (`web/`)**: Static site with vanilla HTML/CSS/JS.
- `config.json` - Centralized configuration (site content, theme, galleries, layout settings)
- `index.html` - Page structure with placeholder elements (populated from config)
- `styles.css` - Styling using CSS custom properties (set from config)
- `script.js` - Loads config, applies theme, gallery switching, lightbox
- `sw.js` - Service Worker for caching

## Multi-Gallery System

Each subdirectory in `input/` becomes a separate gallery:

```
input/
  bw/           → web/assets/bw/{thumb,medium,full}/*.webp + images.json
  colors/       → web/assets/colors/{thumb,medium,full}/*.webp + images.json
  portraits/    → web/assets/portraits/{thumb,medium,full}/*.webp + images.json
```

**Auto-sync**: Running `poe assets` automatically updates `config.json` galleries section:
- New directories are added with auto-generated display names (title case)
- Existing custom display names are preserved
- Removed directories are cleaned from config
- Default gallery is preserved if it still exists

**Gallery selector**: Dropdown in secondary header bar allows switching galleries. URL hash (`#gallery=bw`) enables bookmarking specific galleries.

## Configuration System

All configurable items are in `web/config.json`. JavaScript loads this at startup and:
1. Sets CSS custom properties for theming (`--color-*`, `--font-*`, `--transition-*`)
2. Populates page content (title, splash, logo, panel text)
3. Populates gallery selector dropdown
4. Uses gallery/breakpoint settings for layout calculations

### Config Structure

| Section | Purpose |
|---------|---------|
| `site` | Name, title, subtitle, button text, alt text template |
| `galleries` | Default gallery, items with displayName and order (auto-updated by process.py) |
| `assets` | Path to assets folder, manifest filename |
| `gallery` | Eager load count, margins, random offsets, rotation ranges |
| `breakpoints` | Array of responsive layouts (minWidth, columns, photoSize) |
| `mobileBreakpoint` | Width threshold for mobile image sources |
| `panels` | About/Credits content, contact info, copyright |
| `theme.colors` | All color values (background, text variants, borders) |
| `theme.fonts` | Heading and body font families |
| `theme.transitions` | Duration values for animations |

### Galleries Config (auto-managed)

```json
"galleries": {
  "default": "bw",
  "items": {
    "bw": { "displayName": "Black & White", "order": 1 },
    "colors": { "displayName": "Colors", "order": 2 }
  }
}
```

## Asset Sizes

| Size | Max Edge | Purpose |
|------|----------|---------|
| `thumb` | 400px | Mobile gallery view |
| `medium` | 800px | Desktop gallery view |
| `full` | 1600px | Lightbox (full-screen view) |

Images are resized so the longest edge matches the max size, preserving aspect ratio.

## Responsive Breakpoints

Gallery adapts from 7 columns (large screens) to 2 columns (mobile):

| Screen Width | Columns | Photo Size |
|--------------|---------|------------|
| ≥1600px | 7 | 13vw |
| 1440-1599px | 6 | 15vw |
| 1280-1439px | 5 | 18vw |
| 1024-1279px | 4 | 22vw |
| 768-1023px | 3 | 30vw |
| <768px | 2 | 42vw |

Breakpoints defined in `config.json` (breakpoints array) with matching CSS media queries in `styles.css`.

## Key Behaviors

### Splash Screen
- Shows on every page load/refresh
- Click "Enter" to reveal gallery with dealing animation

### Gallery
- **Gallery selector**: Dropdown to switch between galleries
- **Click logo**: Reshuffles current gallery with new random arrangement
- **Resize window**: Smooth transitions between breakpoints
- **Hover photo**: Slight scale + shadow effect
- **URL hash**: `#gallery=<id>` for bookmarking (e.g., `#gallery=bw`)

### Lightbox Navigation
- **Click photo**: Opens lightbox with random sequence
- **Arrow Right / Click image**: Next photo
- **Arrow Left**: Previous photo
- **Escape**: Close (discards sequence)

### Performance
- **Service Worker**: Caches images for offline/fast repeat visits
- **Eager loading**: First N images load immediately (configurable)
- **Lazy loading**: Rest load on scroll via Intersection Observer (configurable preload margin)
- **Manifest caching**: Gallery manifests cached in memory after first load
- **DOM pooling**: Photo elements reused on reshuffle instead of destroy/recreate
- **Batched operations**: Position calculations computed in memory, applied via `requestAnimationFrame`
- **Lightbox caching**: Loaded image IDs cached in Set, avoids DOM queries on lightbox open

## Data Flow

```
input/<gallery>/*.jpg → process.py → web/assets/<gallery>/{thumb,medium,full}/*.webp
                                   → web/assets/<gallery>/images.json
                                   → web/config.json (galleries section updated)
                                          ↓
config.json ──────────────────────→ script.js ──→ CSS variables + DOM content
                                          ↓
                                   Gallery selector populated
                                   Manifest loaded per gallery
```

## Key Paths

- `input/<gallery>/` - Drop original photos in subdirectories (not in git)
- `web/assets/<gallery>/` - Generated images per gallery (not in git, rebuild with `poe assets`)
- `web/config.json` - Site configuration (galleries section auto-updated)
- `web/` - Deployable directory for static hosting
