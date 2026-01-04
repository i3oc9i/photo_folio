# Ivano Coltellacci Photography Portfolio

A minimal, modern photography portfolio website with optimized image loading.

## Project Structure

```
my_web_photo/
├── pyproject.toml          # Python project config
├── src/photo_tools/        # Image processing tools
├── input/                  # Source images
│   └── photos/             # Drop photos here (future: more categories)
├── web/                    # Website (deployable)
│   ├── index.html
│   ├── styles.css
│   ├── script.js
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

- Responsive image loading (88% bandwidth reduction)
- Random photo layout with subtle overlaps
- Click-to-view lightbox with random navigation
- Slide-in About/Credits panels
- Dark theme optimized for photography
