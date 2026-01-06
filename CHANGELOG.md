# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-06

### Added

- Multi-gallery system with URL hash navigation (`#gallery=<id>`)
- Configurable layout styles per gallery (organic, masonry)
- Organic layout with random offsets, rotation, z-index layering, and dealing animation
- Masonry layout with Pinterest-style clean grid
- Responsive breakpoints with customizable columns and photo sizes
- Lazy loading with configurable eager load count
- Lightbox viewer for fullscreen photo viewing
- About and Credits slide-in panels
- Social network icons in About panel (Instagram, Twitter, Facebook, LinkedIn, YouTube, Pinterest, Behance)
- Splash screen with configurable enter button text
- Scroll-to-top before gallery reshuffle on title click
- Configurable reshuffle delay transition
- Python image processing pipeline generating WebP images (thumb/medium/full)
- Parallel image processing with configurable worker count
- Service worker for asset caching
- Dark theme with configurable colors and fonts
- Split configuration: `site.json` (content) + `theme.json` (styling)
- Configurable gallery margins (top, bottom, left, right)

[1.0.0]: https://github.com/i3oc9i/photo_folio/releases/tag/v1.0.0
