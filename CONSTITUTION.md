# CONSTITUTION.md

## Photography Portfolio - Technical Principles & Standards

This document establishes the governing principles, quality standards, and technical constraints for the Photography Portfolio project.

---

## 1. Core Principles

### 1.1 Simplicity First

- Prefer simple solutions over clever ones
- Minimize dependencies
- Avoid premature optimization
- Static site over dynamic when possible

### 1.2 Performance by Default

- Images are the product; they must load fast
- Progressive enhancement over blocking loads
- Offline capability is not optional
- Every kilobyte matters

### 1.3 Configuration over Code

- Non-technical users must be able to customize
- Split content from presentation
- JSON configuration, not code changes
- Sensible defaults for everything

### 1.4 Zero Runtime Dependencies

- No backend servers required
- No databases
- No API calls to external services
- Deployable to any static host

---

## 2. Technology Stack

### 2.1 Frontend

| Layer      | Technology     | Rationale                                  |
| ---------- | -------------- | ------------------------------------------ |
| Framework  | Svelte 5       | Compile-time reactivity, minimal runtime   |
| Build Tool | Vite           | Fast HMR, optimized production builds      |
| Styling    | Vanilla CSS    | No runtime overhead, CSS custom properties |
| Caching    | Service Worker | Native browser API, no library needed      |

**Constraints:**

- No CSS-in-JS libraries
- No state management libraries (use Svelte stores)
- No UI component libraries
- No runtime CSS frameworks

### 2.2 Image Processing

| Layer         | Technology         | Rationale                                 |
| ------------- | ------------------ | ----------------------------------------- |
| Language      | Python 3.10+       | Cross-platform, excellent image libraries |
| Image Library | Pillow             | Industry standard, well-maintained        |
| Parallelism   | ThreadPoolExecutor | Built-in, I/O-bound workload              |

**Constraints:**

- Single script, no complex pipeline
- No external services (all local processing)
- WebP output only (universal browser support)

### 2.3 Package Management

| Context     | Tool             |
| ----------- | ---------------- |
| Python      | uv               |
| Node.js     | npm              |
| Task Runner | Poethepoet (poe) |

---

## 3. Architecture Standards

### 3.1 Component Structure

```text
App.svelte (Root orchestrator)
├── Splash.svelte
├── Header.svelte
├── GallerySelector.svelte
├── Gallery.svelte
│   └── Photo.svelte
├── Panel.svelte
├── Overlay.svelte
├── Lightbox.svelte
└── ScrollTopButton.svelte
```

**Rules:**

- One component per file
- Components in `src/lib/components/`
- Max component size: ~200 lines
- Extract logic to utils when exceeding

### 3.2 State Management

| Store        | Scope  | Type                |
| ------------ | ------ | ------------------- |
| config       | Global | Writable            |
| gallery      | Global | Writable + derived  |
| breakpoint   | Global | Derived from window |
| loadedImages | Global | Writable Set        |

**Rules:**

- Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Stores in `src/lib/stores/`
- Prefer derived state over computed in components
- Clear store state on context change (e.g., gallery switch)

### 3.3 CSS Architecture

```text
styles/
├── global.css          # Imports all
├── variables.css       # CSS custom properties
├── base.css           # Reset, html/body
├── components/        # Per-component styles
└── layouts/           # Layout-specific styles
```

**Rules:**

- CSS custom properties for all theme values
- No inline styles except dynamic positioning
- Mobile-first media queries
- BEM-ish naming (component-element-modifier)

### 3.4 Layout Algorithm Interface

```javascript
// Every layout must export:
export function computePositions(images, breakpoint, galleryConfig, layoutConfig) {
  // Returns: Array<{ id, x, y, width, height, rotation?, zIndex? }>
}

export function calculateHeight(positions, breakpoint, galleryConfig, layoutConfig) {
  // Returns: number (container height in vw)
}
```

**Rules:**

- Layouts in `src/lib/utils/layouts/`
- Pure functions, no side effects
- Register in `layouts/index.js`
- Shortest-column-first as base algorithm

---

## 4. Directory Structure

```text
project/
├── gallery/                    # Source photos (gitignored)
│   └── <gallery-name>/
├── src/
│   └── gallery_builder/        # Python processing
│       ├── __init__.py
│       ├── cli.py
│       └── processor.py
├── web/
│   ├── public/
│   │   ├── assets/gallery/     # Generated images
│   │   │   └── <gallery>/
│   │   │       ├── thumb/
│   │   │       ├── medium/
│   │   │       ├── full/
│   │   │       └── images.json
│   │   ├── site.json
│   │   ├── theme.json
│   │   └── sw.js
│   └── src/
│       ├── App.svelte
│       └── lib/
│           ├── components/
│           ├── stores/
│           ├── utils/
│           └── styles/
├── docs/                       # Technical documentation
├── features/                   # Feature planning (backlog/in-progress/done)
├── PRD.md
├── CONSTITUTION.md
└── CLAUDE.md
```

---

## 5. Performance Requirements

### 5.1 Core Web Vitals Targets

| Metric                   | Target  | Max   |
| ------------------------ | ------- | ----- |
| First Contentful Paint   | < 1.5s  | 2.0s  |
| Largest Contentful Paint | < 2.5s  | 3.0s  |
| Cumulative Layout Shift  | < 0.1   | 0.15  |
| First Input Delay        | < 100ms | 200ms |

### 5.2 Image Optimization

| Metric                  | Target          |
| ----------------------- | --------------- |
| File size reduction     | > 70% vs source |
| WebP quality            | 85%             |
| Max full-size dimension | 1600px          |
| Max thumb dimension     | 400px           |

### 5.3 Runtime Performance

| Metric                       | Target    |
| ---------------------------- | --------- |
| Gallery switch time (cached) | < 100ms   |
| Lazy load trigger margin     | 800px     |
| Eager load count             | 12 images |
| Animation frame rate         | 60fps     |

---

## 6. Caching Strategy

### 6.1 Service Worker Rules

| Resource                       | Strategy      | Cache Name  |
| ------------------------------ | ------------- | ----------- |
| Images (webp, jpg, png, gif)   | Cache-first   | images-v{N} |
| Manifests (images.json)        | Network-first | static-v{N} |
| Config (site.json, theme.json) | Network-first | static-v{N} |
| Hashed assets (JS, CSS)        | Cache-first   | static-v{N} |
| HTML                           | Network-first | static-v{N} |
| Other                          | Network-only  | -           |

### 6.2 Cache Versioning

- Increment `CACHE_VERSION` on deployments
- Old caches cleaned on service worker activation
- Hashed filenames enable aggressive caching

---

## 7. Browser Support

### 7.1 Minimum Versions

| Browser | Version |
| ------- | ------- |
| Chrome  | 88+     |
| Firefox | 85+     |
| Safari  | 14+     |
| Edge    | 88+     |

### 7.2 Required APIs

- WebP image support
- CSS custom properties
- CSS Grid
- IntersectionObserver
- Service Worker
- ES2020+ (optional chaining, nullish coalescing)

---

## 8. Security Standards

### 8.1 Constraints

- No user authentication
- No server-side code
- No database connections
- No external API calls
- No cookies or tracking
- No user-generated content

### 8.2 Deployment

- HTTPS required for service worker
- Service worker scoped to origin
- No CORS requirements (all local assets)

---

## 9. Code Quality Standards

### 9.1 JavaScript/Svelte

- Use Svelte 5 runes exclusively
- Prefer `const` over `let`
- Destructure props: `let { prop } = $props()`
- Async/await over raw promises
- No `any` types if using TypeScript

### 9.2 CSS

- Use CSS custom properties for theme values
- Logical properties when appropriate (margin-inline, etc.)
- No `!important` except for utility overrides
- Prefer `rem` for typography, `vw` for layout

### 9.3 Python

- Type hints on function signatures
- Docstrings on public functions
- f-strings for formatting
- Context managers for file operations
- Logging over print statements

---

## 10. Testing Expectations

### 10.1 Manual Testing Checklist

- [ ] Splash screen displays and dismisses
- [ ] All galleries load correctly
- [ ] Gallery switching works
- [ ] URL hash navigation works
- [ ] Lightbox opens and navigates
- [ ] Keyboard navigation works
- [ ] Panels open and close
- [ ] Responsive breakpoints work
- [ ] Offline mode works (after caching)
- [ ] Image processing completes without errors

### 10.2 Visual Regression

- Test at all 6 breakpoints
- Test both layout types
- Test lightbox on mobile and desktop
- Test panel overlays

---

## 11. Build & Deployment

### 11.1 Commands

```bash
# Development
poe dev              # Process images + start dev server
poe dev:assets       # Process images only
poe dev:assets:force # Force reprocess all images

# Production
npm run build        # Build frontend (in web/)

# Maintenance
poe clean           # Remove generated assets
poe clean:all       # Remove assets + dist + node_modules
```

### 11.2 Production Build Output

```text
web/dist/
├── index.html
├── _app/
│   └── chunks/     # Code-split bundles
├── assets/         # Hashed CSS/JS
└── sw.js
```

### 11.3 Deployment Targets

Compatible with any static host:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- S3 + CloudFront
- Any web server serving static files

---

## 12. Documentation Requirements

### 12.1 Required Documentation

| Document        | Purpose                    |
| --------------- | -------------------------- |
| README.md       | Quick start, configuration |
| CLAUDE.md       | AI assistant instructions  |
| PRD.md          | Functional requirements    |
| CONSTITUTION.md | Technical standards        |
| docs/*.md       | Implementation details     |

### 12.2 Code Documentation

- Document non-obvious algorithms
- Document configuration options
- Document store interfaces
- Avoid documenting self-evident code

---

## 13. Decision Log

Document significant technical decisions here:

| Date | Decision                       | Rationale                               |
| ---- | ------------------------------ | --------------------------------------- |
| -    | Svelte 5 over other frameworks | Compile-time reactivity, minimal bundle |
| -    | WebP only output               | Universal support, best compression     |
| -    | Split site.json/theme.json     | Separate content from presentation      |
| -    | Service worker caching         | Offline support, performance            |
| -    | CSS custom properties          | Runtime theme switching                 |
| -    | Shortest-column-first layout   | O(n) performance, good visual balance   |

---

End of Constitution
