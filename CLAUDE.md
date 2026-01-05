# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Photography portfolio website with Python-based image preprocessing. The site displays photos using an **organic grid** layout (grid-based positioning with random offsets for a natural "scattered on table" feel) with a dark theme.

## Commands

```bash
uv sync --extra dev      # Install dependencies including dev tools
uv run poe assets        # Process images from input/photos/ → web/assets/
uv run poe assets:force  # Reprocess all images (ignore cache)
uv run poe serve         # Start dev server at http://localhost:8080
uv run poe dev           # Process images + start server
```

## Architecture

**Python (`src/photo_tools/`)**: Image processing pipeline that converts photos to WebP format. Generates `web/assets/images.json` manifest.

**Website (`web/`)**: Static site with vanilla HTML/CSS/JS.
- `index.html` - Page structure, splash screen, panels
- `styles.css` - Styling with 6 responsive breakpoints
- `script.js` - Gallery logic, lightbox, Service Worker registration
- `sw.js` - Service Worker for caching

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

Breakpoints defined in `script.js` (BREAKPOINTS array) with matching CSS media queries.

## Key Behaviors

### Splash Screen
- Shows on every page load/refresh
- Click "Enter" to reveal gallery with dealing animation

### Gallery
- **Click logo**: Reshuffles gallery with new random arrangement
- **Resize window**: Smooth transitions between breakpoints
- **Hover photo**: Slight scale + shadow effect

### Lightbox Navigation
- **Click photo**: Opens lightbox with random sequence
- **Arrow Right / Click image**: Next photo
- **Arrow Left**: Previous photo
- **Escape**: Close (discards sequence)

### Performance
- **Service Worker**: Caches images for offline/fast repeat visits
- **Eager loading**: First 12 images load immediately
- **Lazy loading**: Rest load on scroll (800px preload margin)

## Data Flow

```
input/photos/*.jpg → process.py → web/assets/{thumb,medium,full}/*.webp
                                → web/assets/images.json
```

## Key Paths

- `input/photos/` - Drop original photos here (not in git)
- `web/assets/` - Generated images (not in git, rebuild with `poe assets`)
- `web/` - Deployable directory for static hosting
