# CLAUDE.md

Instructions for Claude Code when working with this repository.

## Rules

1. **Never commit automatically** - Only commit when explicitly requested.
2. **Update technical documentation** - After significant technical changes, update relevant documentation in `docs/`.
3. **Update README.md** - After changes affecting configuration or usage.
4. **Feature workflow** - For non-trivial changes, create a feature file in `features/backlog/` before implementing. See `features/README.md` for workflow.

## Project Summary

Photography portfolio: **Svelte 5 + Vite** (frontend) + **Python** (image processing).

## Key Paths

| Path | Purpose |
|------|---------|
| `gallery/<name>/` | Source photos (not in git) |
| `web/public/assets/gallery/` | Generated WebP images |
| `web/public/site.json` | Site content config |
| `web/public/theme.json` | Theme/styling config |
| `web/src/lib/` | Svelte components, stores, utils |
| `src/gallery_builder/` | Python image processing |
| `features/` | Feature planning files (backlog → in-progress → done) |

## Commands

```bash
poe dev              # Build assets + start dev server
poe dev:assets       # Process images only (8 workers)
npm run build        # Production build (in web/)
```

## Technical Documentation

Detailed implementation docs are in `docs/`. **Consult these before modifying related code:**

| Document | Topics |
|----------|--------|
| `docs/web-architecture.md` | Svelte 5 runes, stores, components, theme system |
| `docs/lazy-loading.md` | IntersectionObserver, eager loading, loadedImages store |
| `docs/service-worker.md` | Caching strategies, offline support |
| `docs/layout-organic.md` | Scattered photos algorithm |
| `docs/layout-masonry.md` | Pinterest-style grid algorithm |
| `docs/gallery-builder.md` | Python image processing, ThreadPoolExecutor |

## Quick Reference

**Svelte 5 runes**: `$state()`, `$derived()`, `$effect()`, `$props()`

**Adding a layout**: See `docs/layout-organic.md` for pattern, register in `layouts/index.js`

**Config files**: `site.json` (content) + `theme.json` (styling) → merged into `config` store
