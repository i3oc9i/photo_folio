# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**photo_folio** is a photography portfolio website with Python-based image preprocessing. The site displays photos using an **organic grid** layout (grid-based positioning with random offsets for a natural "scattered on table" feel) with a dark theme.

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
- `config.json` - Centralized configuration (site content, theme, gallery settings)
- `index.html` - Page structure with placeholder elements (populated from config)
- `styles.css` - Styling using CSS custom properties (set from config)
- `script.js` - Loads config, applies theme, gallery logic, lightbox
- `sw.js` - Service Worker for caching

## Configuration System

All configurable items are in `web/config.json`. JavaScript loads this at startup and:
1. Sets CSS custom properties for theming (`--color-*`, `--font-*`, `--transition-*`)
2. Populates page content (title, splash, logo, panel text)
3. Uses gallery/breakpoint settings for layout calculations

### Config Structure

| Section | Purpose |
|---------|---------|
| `site` | Name, title, subtitle, button text, alt text template |
| `assets` | Path to assets folder, manifest filename |
| `gallery` | Eager load count, margins, random offsets, rotation ranges |
| `breakpoints` | Array of responsive layouts (minWidth, columns, photoSize) |
| `mobileBreakpoint` | Width threshold for mobile image sources |
| `panels` | About/Credits content, contact info, copyright |
| `theme.colors` | All color values (background, text variants, borders) |
| `theme.fonts` | Heading and body font families |
| `theme.transitions` | Duration values for animations |

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
- **Eager loading**: First N images load immediately (configurable)
- **Lazy loading**: Rest load on scroll (configurable preload margin)

## Data Flow

```
config.json ──────────────────→ script.js ──→ CSS variables + DOM content
                                    ↓
input/photos/*.jpg → process.py → web/assets/{thumb,medium,full}/*.webp
                                → web/assets/images.json ──→ script.js
```

## Key Paths

- `input/photos/` - Drop original photos here (not in git)
- `web/assets/` - Generated images (not in git, rebuild with `poe assets`)
- `web/config.json` - Site configuration (edit to customize)
- `web/` - Deployable directory for static hosting
