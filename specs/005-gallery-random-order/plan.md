# Implementation Plan: Gallery Random Order Option

**Branch**: `005-gallery-random-order` | **Date**: 2026-01-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-gallery-random-order/spec.md`

## Summary

Add a `randomOrder` configuration option to control whether gallery images are shuffled randomly or displayed in alphabetical order. The option supports both a global default (`galleries.randomOrder`) and per-gallery overrides (`galleries.items.<id>.randomOrder`). When `randomOrder: false`, images display alphabetically, lightbox navigation is sequential, and header click reshuffle is disabled.

## Technical Context

**Language/Version**: JavaScript ES2020+, Svelte 5.16.0
**Primary Dependencies**: Svelte 5.16.0, Vite 7.3.0
**Storage**: Static JSON configuration files (`site.json`)
**Testing**: Manual browser testing (no test framework in project)
**Target Platform**: Web browsers (modern, ES2020+ support)
**Project Type**: Web frontend (single-page application)
**Performance Goals**: N/A (configuration feature, no performance impact)
**Constraints**: Must follow Svelte 5 runes pattern ($state, $derived, $props, $effect)
**Scale/Scope**: Small photography portfolio application

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: Project constitution (`/.specify/memory/constitution.md`) is currently a template without project-specific principles defined. No gates to evaluate.

**Implicit Standards** (from codebase analysis):
- [x] Follows existing component prop patterns
- [x] Uses Svelte 5 runes consistently
- [x] Maintains separation between config (JSON) and behavior (components)
- [x] Changes are minimal and focused (no over-engineering)

## Project Structure

### Documentation (this feature)

```text
specs/005-gallery-random-order/
├── plan.md              # This file
├── spec.md              # Feature specification (copied from backlog)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output (N/A for this feature)
```

### Source Code (repository root)

```text
web/
├── public/
│   └── site.json                    # Configuration (add randomOrder option)
└── src/
    ├── App.svelte                   # Root component (compute randomOrder, pass props)
    └── lib/
        ├── components/
        │   ├── Gallery.svelte       # Accept randomOrder prop, sort vs shuffle
        │   ├── Lightbox.svelte      # Accept randomOrder prop, sort sequence
        │   └── Header.svelte        # Accept onReshuffle prop (nullable)
        └── utils/
            └── shuffle.js           # Existing utility (add sortById helper)
```

**Structure Decision**: Existing web frontend structure. Changes limited to 5 files listed above.

## Complexity Tracking

> No violations. Feature is a straightforward configuration option with minimal complexity.

| Aspect | Assessment |
|--------|------------|
| Files Changed | 5 (site.json + 4 Svelte components + 1 utility) |
| New Dependencies | None |
| Pattern Changes | None (follows existing prop drilling pattern) |
| Breaking Changes | None (new optional config, defaults to current behavior) |
