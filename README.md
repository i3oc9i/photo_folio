# photo_folio

A minimalist photography portfolio built with **Svelte 5** and **Vite**. Features multiple galleries with configurable layout styles (organic grid, masonry), optimized image loading, and dark theme.

## Requirements

- [uv](https://docs.astral.sh/uv/) - Python package manager
- [Node.js](https://nodejs.org/) v18+

## Quick Start

```bash
uv venv                 # Create virtual environment
uv sync --extra dev     # Install Python dependencies
uv run poe init         # Install Node.js dependencies
uv run poe dev          # Process images + start dev server
```

Open <http://localhost:8080>

## Commands

### Setup

```bash
uv venv                 # Create virtual environment (first time only)
uv sync --extra dev     # Install Python dependencies (enables poe commands)
uv run poe init         # Install Node.js dependencies
```

### Development

```bash
uv run poe dev              # Process images + start dev server
uv run poe dev:assets       # Process images only (gallery/ → web/public/assets/)
uv run poe dev:assets:force # Reprocess all images (ignore cache)
uv run poe dev:serve        # Start Vite dev server only
uv run poe dev:build        # Production build → web/dist/
uv run poe dev:preview      # Preview production build
```

Image processing uses 8 parallel workers by default. Override with `build-gallery -j 0` (auto) or `-j N`.

### Cleanup

```bash
uv run poe clean            # Remove generated gallery assets
uv run poe clean:dist       # Remove production build output
uv run poe clean:all        # Remove assets, dist, node_modules, __pycache__
uv run poe clean:reset      # Full reset including .venv
```

## Adding Photos

### Multi-Gallery System

Each subdirectory in `gallery/` becomes a separate gallery:

```text
gallery/
├── bw/           → Black & White gallery
├── colors/       → Colors gallery
└── portraits/    → Portraits gallery
```

### Workflow

1. Create folders in `gallery/` (e.g., `gallery/bw/`, `gallery/colors/`)
2. Drop photos into the folders
3. Run `uv run poe dev:assets`
4. Galleries auto-sync to `site.json`:
   - New directories added with auto-generated display names (title case)
   - Custom display names preserved on re-run
   - Removed directories cleaned from config

### URL Bookmarking

Use `#gallery=<id>` to link to specific galleries (e.g., `http://localhost:8080#gallery=bw`).

## Configuration

Configuration is split into two files in `web/public/`:

- **`site.json`** - Content: site info, galleries, panels
- **`theme.json`** - Styling: colors, fonts, gallery parameters, breakpoints

### site.json

```json
{
  "site": {
    "name": "Your Name",
    "title": "Your Name Photography",
    "subtitle": "fine art photography",
    "splashButton": "Enter",
    "altTextTemplate": "Photo by {name}"
  },
  "galleries": {
    "default": "bw",
    "defaultLayout": "organic",
    "items": {
      "bw": { "displayName": "Black & White", "order": 1, "layout": "organic" },
      "colors": { "displayName": "Colors", "order": 2, "layout": "masonry" }
    }
  },
  "assets": {
    "basePath": "/assets/gallery",
    "manifestFile": "images.json"
  },
  "panels": {
    "about": {
      "title": "About",
      "paragraphs": ["Your bio paragraph 1...", "Paragraph 2..."],
      "contact": {
        "label": "Contact",
        "email": "you@example.com",
        "instagram": "@yourhandle",
        "twitter": "",
        "facebook": ""
      }
    },
    "credits": {
      "title": "Credits",
      "copyright": {
        "year": 2024,
        "name": "Your Name"
      }
    }
  }
}
```

### Contact Links

The About panel displays social icons for any configured contact links. Only links with values are shown.

| Field       | Format                | Example                    |
| ----------- | --------------------- | -------------------------- |
| `email`     | Email address         | `you@example.com`          |
| `instagram` | Handle or URL         | `@yourhandle` or full URL  |
| `twitter`   | Handle or URL         | `@yourhandle` or full URL  |
| `facebook`  | Username or URL       | `yourpage` or full URL     |
| `linkedin`  | Username or URL       | `yourprofile` or full URL  |
| `youtube`   | Channel handle or URL | `@yourchannel` or full URL |
| `pinterest` | Username or URL       | `yourprofile` or full URL  |
| `behance`   | Username or URL       | `yourprofile` or full URL  |

Empty (`""`) fields are hidden. Handles are auto-converted to URLs.

### theme.json

```json
{
  "gallery": {
    "eagerLoadCount": 12,
    "topMargin": 1,
    "bottomMargin": 1,
    "leftMargin": 3,
    "rightMargin": 3,
    "lazyLoadMargin": 800,
    "layouts": { ... }
  },
  "breakpoints": [ ... ],
  "mobileBreakpoint": 768,
  "theme": {
    "colors": { ... },
    "fonts": { ... },
    "transitions": { ... }
  }
}
```

## Gallery Parameters

Global parameters in `theme.json` under `gallery`:

| Parameter        | Unit  | Description                                    |
| ---------------- | ----- | ---------------------------------------------- |
| `eagerLoadCount` | count | Images to load immediately before lazy loading |
| `topMargin`      | vw    | Space between headers and first row            |
| `bottomMargin`   | vw    | Space between last row and footer              |
| `leftMargin`     | vw    | Space from left edge to photos                 |
| `rightMargin`    | vw    | Space from right edge to photos                |
| `lazyLoadMargin` | px    | Distance from viewport to start loading        |

## Layouts

Each gallery can use a different layout style via `site.json`:

```json
"items": {
  "portraits": { "displayName": "Portraits", "layout": "organic" },
  "street": { "displayName": "Street", "layout": "masonry" }
}
```

### Organic Layout

Scattered photos with random offsets and rotation - like photos spread on a table.

Configuration in `theme.json` under `gallery.layouts.organic`:

| Parameter                 | Type    | Description                                     |
| ------------------------- | ------- | ----------------------------------------------- |
| `randomOffset.min/max`    | vw      | Random X/Y offset range (negative = left/up)    |
| `rotation.min/max`        | degrees | Final rotation range (subtle tilt effect)       |
| `zIndex.min/max`          | integer | Stacking order (higher = on top, creates depth) |
| `dealingRotation.min/max` | degrees | Initial rotation for dealing animation          |
| `dealingDelay`            | seconds | Delay between photos appearing                  |
| `spacing`                 | vw      | Vertical spacing between photos                 |

### Masonry Layout

Pinterest-style clean grid layout, no rotation.

Configuration in `theme.json` under `gallery.layouts.masonry`:

| Parameter      | Type    | Description                                    |
| -------------- | ------- | ---------------------------------------------- |
| `gutter`       | vw      | Space between photos (horizontal and vertical) |
| `dealingDelay` | seconds | Delay between photos appearing                 |

## Responsive Breakpoints

Gallery adapts columns based on screen width. Configure in `theme.json` under `breakpoints`:

| Screen Width | Columns | Photo Size |
| ------------ | ------- | ---------- |
| ≥1600px      | 7       | 13vw       |
| 1440-1599px  | 6       | 15vw       |
| 1280-1439px  | 5       | 18vw       |
| 1024-1279px  | 4       | 22vw       |
| 768-1023px   | 3       | 30vw       |
| <768px       | 2       | 42vw       |

## Asset Sizes

Images are processed into three sizes:

| Size     | Max Edge | Purpose               |
| -------- | -------- | --------------------- |
| `thumb`  | 400px    | Mobile gallery view   |
| `medium` | 800px    | Desktop gallery view  |
| `full`   | 1600px   | Lightbox (fullscreen) |

Images are resized so the longest edge matches the max size, preserving aspect ratio.

## Theme Colors

Configure in `theme.json` under `theme.colors`:

```json
{
  "background": "#0a0a0a",
  "text": "#e8e8e8",
  "textMuted": "#a0a0a0",
  "textDim": "#666666",
  "border": "#333333",
  "overlay": "rgba(0, 0, 0, 0.85)"
}
```

## Transitions

Configure animation timings in `theme.json` under `theme.transitions`:

| Parameter        | Unit    | Description                                         |
| ---------------- | ------- | --------------------------------------------------- |
| `splash`         | seconds | Splash screen fade duration                         |
| `gallery`        | seconds | Gallery transition duration                         |
| `panel`          | seconds | Side panel slide duration                           |
| `hover`          | seconds | Hover effect duration                               |
| `lightbox`       | seconds | Lightbox open/close duration                        |
| `reshuffleDelay` | seconds | Delay after scroll-to-top before gallery reshuffles |

**Note:** Clicking the site title reshuffles the gallery. If scrolled down, it first scrolls to top, waits for `reshuffleDelay`, then reshuffles.

## Deployment

Build for production:

```bash
uv run poe dev:build
```

Deploy `web/dist/` to any static host (GitHub Pages, Netlify, Vercel, etc.).

**Note:** Copy `web/public/assets/` to your deployment alongside `dist/`, or configure your host to serve both directories.

## Project Structure

```text
photo_folio/
├── src/gallery_builder/    # Python image processing
├── gallery/                # Source photos (not in git)
│   ├── bw/
│   └── colors/
└── web/                    # Svelte frontend
    ├── src/
    │   ├── lib/
    │   │   ├── components/ # Svelte components
    │   │   ├── stores/     # State management
    │   │   ├── actions/    # Svelte actions
    │   │   └── utils/      # Utilities + layouts
    │   ├── App.svelte
    │   └── main.js
    ├── public/
    │   ├── assets/         # Generated images
    │   ├── site.json       # Site content config
    │   ├── theme.json      # Theme/styling config
    │   └── sw.js           # Service worker
    └── dist/               # Production build output
```

## Tech Stack

- **Frontend**: Svelte 5, Vite
- **Styling**: Vanilla CSS with custom properties
- **Image Processing**: Python, Pillow
- **Caching**: Service Worker

## License

MIT
