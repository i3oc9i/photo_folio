# photo_folio

A minimal photography portfolio with organic grid layout, optimized image loading, and dark theme.

## Setup

Requires [uv](https://docs.astral.sh/uv/) for Python package management.

## Usage

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

## Configuration

Edit `web/config.json` to customize the site:

```json
{
  "site": {
    "title": "Your Name Photography",
    "name": "Your Name",
    "subtitle": "fine art photography"
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

See `web/config.json` for all available options.

## Deploy

The `web/` directory is self-contained and can be deployed to any static host (GitHub Pages, Netlify, Vercel, etc.).

## License

MIT
