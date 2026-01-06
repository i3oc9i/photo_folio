# Features

Feature-driven development workflow for this project.

## Structure

```
features/
├── README.md          # This file
├── _template.md       # Template for new features
├── backlog/           # Planned features (not started)
├── in-progress/       # Currently being implemented
└── done/              # Completed features
```

## Workflow

### 1. Plan a Feature

```bash
# Copy template to backlog with numbered name
cp features/_template.md features/backlog/NNN-feature-name.md
```

Fill in all sections. Think through the implementation before coding.

### 2. Start Implementation

```bash
# Move to in-progress when starting work
mv features/backlog/NNN-feature.md features/in-progress/
```

Only have **one feature in-progress at a time** when possible.

### 3. Complete Feature

```bash
# Move to done when complete
mv features/in-progress/NNN-feature.md features/done/
```

Update checkboxes in the file to show what was completed.

## Naming Convention

```
NNN-short-descriptive-name.md

Examples:
001-scrolltopbutton-effect.md
005-add-image-zoom.md
012-refactor-gallery-state.md
```

- **NNN**: Sequential number (keeps order, prevents conflicts)
- **name**: Lowercase, hyphen-separated, descriptive

## Current Status

### Backlog

| # | Feature | Priority | Effort |
|---|---------|----------|--------|
| 001 | [ScrollTopButton - $effect](./backlog/001-scrolltopbutton-effect.md) | High | 15 min |
| 002 | [App.svelte - $effect subscriptions](./backlog/002-app-effect-subscriptions.md) | Medium | 1-2h |
| 003 | [loadedImages - $state exports](./backlog/003-loadedimages-state.md) | Low | 1-2h |
| 004 | [gallery.js - module runes](./backlog/004-gallery-store-runes.md) | Low | 2-3h |

### In Progress

_None_

### Recently Completed

_None yet_

## Tips

- **Think before coding**: The feature file should be complete before moving to in-progress
- **One at a time**: Avoid multiple in-progress features
- **Update as you go**: Check off implementation steps as you complete them
- **Keep history**: The done/ folder shows what was accomplished and how
