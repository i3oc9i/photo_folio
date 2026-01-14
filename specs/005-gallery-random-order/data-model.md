# Data Model: Gallery Random Order Option

**Date**: 2026-01-12 | **Feature**: 005-gallery-random-order

## Overview

This feature adds a configuration option, not a new data entity. The data model changes are limited to the `site.json` configuration schema.

---

## Configuration Schema Changes

### galleries object (extended)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `randomOrder` | boolean | No | `true` | Global default for image ordering |

### galleries.items[id] object (extended)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `randomOrder` | boolean | No | (inherit) | Per-gallery override for image ordering |

---

## Schema Example

```json
{
  "galleries": {
    "default": "color",
    "randomOrder": true,
    "defaultLayout": "organic",
    "items": {
      "color": {
        "displayName": "Color",
        "order": 1,
        "randomOrder": false
      },
      "bw": {
        "displayName": "Black & White",
        "order": 2
      }
    }
  }
}
```

**Resolution Logic**:
- `color` gallery: `randomOrder = false` (explicit override)
- `bw` gallery: `randomOrder = true` (inherits from global)

---

## Validation Rules

| Rule | Description |
|------|-------------|
| Type | Must be boolean if present |
| Omission | Omitted values inherit from global, then default to `true` |

---

## Behavior Matrix

| `randomOrder` Value | Gallery Display | Lightbox Navigation | Header Click |
|---------------------|-----------------|---------------------|--------------|
| `true` | Shuffled randomly | Shuffled (clicked image first) | Triggers reshuffle |
| `false` | Sorted alphabetically by `image.id` | Sequential (sorted) | Disabled (no-op) |

---

## No New Entities

This feature does not introduce:
- New data entities
- Database changes
- API endpoints
- State transitions
