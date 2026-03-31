# Feature: Masonry Random Scale Factor

> Add configurable random scaling to masonry layout photos for visual variety.

## Context

The masonry layout currently produces a uniform grid where all photos in a column have the same width. Adding slight random scaling (e.g., ±5-10%) would create a more organic, less mechanical appearance while maintaining the overall structure.

## Current Behavior

All photos in a column have identical width calculated from column width minus gutter:

```javascript
// masonry.js
const columnWidth = availableWidth / columns;
const photoWidth = columnWidth - gutter;
// photoWidth is the same for every photo
```

## Proposed Solution

Add a `scaleRandom` config with `min` and `max` values. Each photo gets a deterministic scale factor (based on index) within this range.

```javascript
// Config in theme.json
"masonry": {
  "gutter": 1.5,
  "dealingDelay": 0.03,
  "scaleRandom": {
    "min": 0.95,
    "max": 1.05
  }
}

// masonry.js - deterministic scale function
function getPhotoScale(index, min, max) {
  // Seeded pseudo-random based on index
  const seed = ((index * 9301 + 49297) % 233280) / 233280;
  return min + seed * (max - min);
}

// Apply to both width and height (proportional)
const scale = getPhotoScale(index, scaleMin, scaleMax);
const scaledWidth = photoWidth * scale;
const scaledHeight = photoHeight * scale;
```

**Key decisions:**

- **Proportional scaling**: Both width and height scale together (preserves aspect ratio)
- **Deterministic**: Same photo always gets same scale (stable layout between page loads)
- **Centered positioning**: Scaled photos center within their column slot
- **Disabled by default**: `min: 1, max: 1` means no scaling (backwards compatible)

## Files to Modify

| File                                   | Changes                                                   |
| -------------------------------------- | --------------------------------------------------------- |
| `web/public/theme.json`                | Add `scaleRandom: { min, max }` to masonry config         |
| `web/src/lib/utils/layouts/masonry.js` | Add scale function, apply to dimensions, center in column |
| `docs/layout-masonry.md`               | Document the new configuration option                     |

## Implementation Steps

1. [x] Add `scaleRandom` config to `theme.json` with default `{ min: 1, max: 1 }`
2. [x] In `masonry.js`, extract `scaleRandom` from `layoutConfig` with fallback defaults
3. [x] Add deterministic `getPhotoScale(index, min, max)` function
4. [x] Apply scale factor to `photoWidth` and `photoHeight` calculations
5. [x] Adjust `left` position to center scaled photos within column
6. [x] Update `docs/layout-masonry.md` with new config option and examples

## Testing

- [x] Verify default config (min: 1, max: 1) produces identical layout to current
- [x] Test with various ranges (0.9-1.1, 0.95-1.05) - visual check for variety
- [x] Confirm layout is stable across page reloads (deterministic)
- [x] Check responsive behavior across breakpoints
- [x] Verify scaled photos don't overlap or create gaps

## Dependencies

- None

## Notes

- The seeded random approach uses a linear congruential generator which is simple and fast
- Future enhancement: could allow per-gallery scale config if desired
- Invalid config handling: if min > max, swap them or use defaults
