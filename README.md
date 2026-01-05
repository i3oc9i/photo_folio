# photo_folio

A minimal photography portfolio built with **Svelte 5** and **Vite**. Features an organic grid layout, optimized image loading, and dark theme.

## Setup

Requires:
- [uv](https://docs.astral.sh/uv/) for Python package management
- [Node.js](https://nodejs.org/) (v18+) for the Svelte frontend

```bash
uv sync --extra dev      # Install Python dependencies
cd web && npm install    # Install Node.js dependencies
```

## Usage

```bash
uv run poe assets        # Process images from gallery/ to web/assets/
uv run poe assets:force  # Reprocess all images (ignore cache)
uv run poe serve         # Start Vite dev server
uv run poe build         # Production build → web/dist/
uv run poe dev           # Process images + start dev server
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
    │   ├── config.json    # Site configuration
    │   └── sw.js          # Service worker
    └── dist/              # Production build output
```

## Configuration

Edit `web/public/config.json` to customize the site:

```json
{
  "site": {
    "title": "Your Name Photography",
    "name": "Your Name",
    "subtitle": "fine art photography"
  },
  "galleries": {
    "default": "bw",
    "items": {
      "bw": { "displayName": "Black & White", "order": 1 },
      "colors": { "displayName": "Colors", "order": 2 }
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

See `web/public/config.json` for all available options.

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
