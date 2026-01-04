# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Photography portfolio website with Python-based image preprocessing. The site displays photos in a random overlapping layout with a dark theme.

## Commands

```bash
uv sync --extra dev      # Install dependencies including dev tools
uv run poe assets        # Process images from input/photos/ → web/assets/
uv run poe assets:force  # Reprocess all images (ignore cache)
uv run poe serve         # Start dev server at http://localhost:8080
uv run poe dev           # Process images + start server
```

## Architecture

**Python (`src/photo_tools/`)**: Image processing pipeline that converts photos to WebP format in three sizes (thumb 400px, medium 800px, full 1600px). Generates `web/assets/images.json` manifest.

**Website (`web/`)**: Static site with vanilla HTML/CSS/JS. Reads manifest to build gallery dynamically. Uses `<picture>` elements for responsive loading. Lightbox loads full-size images on demand.

**Data Flow**:
```
input/photos/*.jpg → process.py → web/assets/{thumb,medium,full}/*.webp
                                → web/assets/images.json
```

## Key Paths

- `input/photos/` - Drop original photos here (not in git)
- `web/assets/` - Generated images (not in git, rebuild with `poe assets`)
- `web/` - Deployable directory for static hosting
