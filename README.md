# photo_folio

A minimal photography portfolio built with **Svelte 5** and **Vite**. Features multiple layout styles (organic grid, masonry), optimized image loading, and dark theme.

## Setup

Requires:

- [uv](https://docs.astral.sh/uv/) for Python package management
- [Node.js](https://nodejs.org/) (v18+) for the Svelte frontend

```bash
uv venv             # Create virtual environment (first time only)
uv sync --extra dev # Install Python dependencies (enables poe commands)
uv run poe init     # Install Node.js dependencies
```

## Usage

```bash
uv run poe dev              # Process images + start dev server
uv run poe dev:assets       # Process images from gallery/ to web/public/assets/
uv run poe dev:assets:force # Reprocess all images (ignore cache)
uv run poe dev:serve        # Start Vite dev server
uv run poe dev:build        # Production build → web/dist/
```

### Workflow

1. Create gallery folders in `gallery/` (e.g., `gallery/bw/`, `gallery/colors/`)
2. Drop photos into the folders
3. Run `uv run poe dev`
4. Open http://localhost:8080

## Project Structure

```
photo_folio/
├── src/gallery_builder/       # Python image processing
├── gallery/                 # Source photos (not in git)
│   ├── bw/
│   └── colors/
└── web/                   # Svelte frontend
    ├── src/
    │   ├── lib/
    │   │   ├── components/   # Svelte components
    │   │   ├── stores/       # Svelte stores
    │   │   ├── actions/      # Svelte actions
    │   │   └── utils/        # Utility functions
    │   ├── App.svelte
    │   └── main.js
    ├── public/
    │   ├── assets/        # Generated images (symlink)
    │   ├── site.json + theme.json    # Site configuration
    │   └── sw.js          # Service worker
    └── dist/              # Production build output
```

## Configuration

Edit `web/public/site.json + theme.json` to customize the site:

```json
{
  "site": {
    "title": "Your Name Photography",
    "name": "Your Name",
    "subtitle": "fine art photography"
  },
  "galleries": {
    "default": "bw",
    "defaultLayout": "organic",
    "items": {
      "bw": { "displayName": "Black & White", "order": 1, "layout": "organic" },
      "colors": { "displayName": "Colors", "order": 2, "layout": "masonry" }
    }
  },
  "panels": {
    "about": {
      "paragraphs": ["Your bio..."],
      "contact": { "email": "you@example.com" }
    },
    "credits": {
      "copyright": { "year": 2024, "name": "Your Name" }
    }
  },
  "theme": {
    "colors": {
      "background": "#0a0a0a",
      "text": "#e8e8e8"
    }
  }
}
```

**Layout types:**
- `organic` - Scattered photos with random offsets and rotation (default)
- `masonry` - Pinterest-style clean grid layout

See `web/public/site.json + theme.json` for all available options.

## Deploy

Build for production:

```bash
uv run poe build
```

The `web/dist/` directory can be deployed to any static host (GitHub Pages, Netlify, Vercel, etc.).

Note: Copy `web/assets/` to your deployment alongside `dist/`, or configure your host to serve both.

## Tech Stack

- **Frontend**: Svelte 5, Vite
- **Styling**: Vanilla CSS with custom properties
- **Image Processing**: Python, Pillow
- **Caching**: Service Worker

## License

MIT
