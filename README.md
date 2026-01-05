# Ivano Coltellacci Photography Portfolio

A minimal, modern photography portfolio website with optimized image loading and an organic grid layout.

## Project Structure

```
my_web_photo/
├── pyproject.toml          # Python project config
├── src/photo_tools/        # Image processing tools
├── input/                  # Source images
│   └── photos/             # Drop photos here
├── web/                    # Website (deployable)
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── sw.js               # Service Worker for caching
│   └── assets/             # Generated optimized images
└── README.md
```

## Setup

Requires [uv](https://docs.astral.sh/uv/) for Python package management.

## Usage

### Available Commands

```bash
uv run poe assets        # Process images
uv run poe assets:force  # Reprocess all images
uv run poe serve         # Start web server
uv run poe dev           # Process images + start server
```

### Workflow

1. Drop photos into `input/photos/`
2. Run `uv run poe dev`
3. Open http://localhost:8080

### Image Processing

The `assets` command generates optimized WebP images in three sizes:
- `thumb` (400px) - Mobile gallery
- `medium` (800px) - Desktop gallery
- `full` (1600px) - Lightbox view

### Deploy

The `web/` directory is self-contained and can be deployed to any static host:
- GitHub Pages
- Netlify
- Vercel
- Any web server

## Features

### Gallery
- **Organic grid layout** - Photos arranged in a grid with random offsets for a natural "scattered on table" feel
- **6 responsive breakpoints** - Adapts from 7 columns (large screens) to 2 columns (mobile)
- **Smooth transitions** - CSS animations when resizing across breakpoints
- **Click logo to reshuffle** - Get a new random arrangement without page reload

### Performance
- **Service Worker caching** - Instant loading on repeat visits, offline support
- **Eager loading** - First 12 images load immediately
- **Lazy loading** - Remaining images load as you scroll (800px preload margin)
- **Responsive images** - Serves appropriate size based on device

### User Experience
- **Splash screen** - Entry page with photographer name
- **Lightbox** - Click any photo for fullscreen view with random navigation
- **Slide-in panels** - About and Credits panels
- **Dark theme** - Optimized for photography viewing

## Responsive Breakpoints

| Screen Width | Columns | Photo Size |
|--------------|---------|------------|
| ≥1600px | 7 | 13vw |
| 1440-1599px | 6 | 15vw |
| 1280-1439px | 5 | 18vw |
| 1024-1279px | 4 | 22vw |
| 768-1023px | 3 | 30vw |
| <768px | 2 | 42vw |
