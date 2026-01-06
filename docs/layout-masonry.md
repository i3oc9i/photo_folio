# Masonry Layout Algorithm

Technical documentation for the masonry (Pinterest-style) layout algorithm.

## Overview

The masonry layout creates a clean, Pinterest-style grid where photos are aligned to columns with preserved aspect ratios. Unlike the organic layout, there are no random offsets or rotations - photos are precisely positioned with consistent gutters.

**File:** `web/src/lib/utils/layouts/masonry.js`

## Visual Effect

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │          │  │          │  │          │  │          │         │
│  │    1     │  │          │  │    3     │  │          │         │
│  │          │  │    2     │  │          │  │    4     │         │
│  └──────────┘  │          │  └──────────┘  │          │         │
│  ┌──────────┐  │          │  ┌──────────┐  │          │         │
│  │          │  └──────────┘  │          │  └──────────┘         │
│  │    5     │  ┌──────────┐  │          │  ┌──────────┐         │
│  │          │  │    6     │  │    7     │  │    8     │         │
│  │          │  │          │  │          │  └──────────┘         │
│  └──────────┘  └──────────┘  └──────────┘                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

Key characteristics:
- Uniform column alignment
- Consistent gutter spacing
- No rotation
- Preserved aspect ratios
- Minimal animation
```

## Algorithm

### Core Strategy: Shortest-Column-First

Like the organic layout, masonry uses a greedy shortest-column-first approach, but without randomization:

1. Maintain an array of column heights
2. For each image, find the shortest column
3. Place the image centered within that column
4. Update the column height with image height plus gutter

### Implementation

```javascript
export function computeMasonryPositions(images, breakpointLayout, galleryConfig, layoutConfig) {
  const positions = [];
  const { columns, photoSize, squareSize } = breakpointLayout;
  const { topMargin, leftMargin = 1, rightMargin = 1 } = galleryConfig;
  const { gutter = 1.5, dealingDelay = 0.02 } = layoutConfig;

  // Calculate available width and column dimensions
  const availableWidth = 100 - leftMargin - rightMargin;
  const columnWidth = availableWidth / columns;
  const columnHeights = new Array(columns).fill(0);

  // Photo width is column width minus gutter
  const photoWidth = columnWidth - gutter;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    // Find shortest column
    let shortestColumn = 0;
    let minHeight = columnHeights[0];
    for (let col = 1; col < columns; col++) {
      if (columnHeights[col] < minHeight) {
        minHeight = columnHeights[col];
        shortestColumn = col;
      }
    }

    // Position centered within column (no random offset)
    const left = leftMargin + shortestColumn * columnWidth + (gutter / 2);
    const top = topMargin + columnHeights[shortestColumn];

    // Calculate height based on aspect ratio
    let photoHeight;
    if (image.orientation === 'landscape') {
      photoHeight = photoWidth * 0.67;
    } else if (image.orientation === 'portrait') {
      photoHeight = photoWidth * 1.5;
    } else {
      photoHeight = photoWidth;  // square
    }

    // Update column height
    columnHeights[shortestColumn] += photoHeight + gutter;

    positions.push({
      id: image.id,
      left,
      top,
      offsetX: 0,           // No random offset
      offsetY: 0,           // No random offset
      size: photoWidth,
      width: photoWidth,
      height: photoHeight,
      rotation: 0,          // No rotation
      startRotation: 0,     // No dealing rotation
      delay: i * dealingDelay,
      layoutType: 'masonry'
    });
  }

  return positions;
}
```

## Configuration

**File:** `web/public/theme.json`

```json
{
  "gallery": {
    "layouts": {
      "masonry": {
        "gutter": 1.5,
        "dealingDelay": 0.03
      }
    }
  }
}
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `gutter` | number | 1.5 | Space between photos in vw units |
| `dealingDelay` | number | 0.03 | Delay between each photo's fade-in (seconds) |
| `scaleRandom` | object | `{ min: 1, max: 1 }` | Random scale range for photo sizing |

### Random Scale

The `scaleRandom` option adds subtle size variation to photos for a more organic look:

```json
"masonry": {
  "gutter": 1.5,
  "dealingDelay": 0.03,
  "scaleRandom": { "min": 0.8, "max": 1 }
}
```

| Value | Effect |
|-------|--------|
| `min: 1, max: 1` | No scaling (default, uniform grid) |
| `min: 0.9, max: 1` | Subtle variation (90% to 100%) |
| `min: 0.8, max: 1` | Noticeable variation (80% to 100%) |
| `min: 0.7, max: 1` | Strong variation (70% to 100%) |

**Behavior:**
- Scale values must be **≤ 1** (photos scale down from normal size)
- `1.0` = full column width, smaller values = proportionally smaller
- Scale is **deterministic** - same photo always gets same scale (based on index)
- Applies to both width and height **proportionally** (aspect ratio preserved)
- Scaled photos are **centered** within their column slot
- Values > 1 are clamped to 1 to prevent overlap

## Comparison with Organic Layout

| Feature | Organic | Masonry |
|---------|---------|---------|
| Random offsets | Yes (-3 to +3 vw) | No |
| Rotation | Yes (-5° to +5°) | No |
| Z-index variation | Yes (1-10) | No |
| Dealing animation | Full rotation | Fade only |
| Grid alignment | Approximate | Precise |
| Visual style | Casual, scattered | Clean, organized |

## Position Object

Each image receives a position object:

```javascript
{
  id: "photo-name",        // Image identifier
  left: 16.25,             // Left position in vw (precise)
  top: 5.0,                // Top position in vw (precise)
  offsetX: 0,              // Always 0 for masonry
  offsetY: 0,              // Always 0 for masonry
  size: 14,                // Photo width in vw
  width: 14,               // Same as size
  height: 9.38,            // Calculated height in vw
  rotation: 0,             // Always 0 for masonry
  startRotation: 0,        // Always 0 for masonry
  delay: 0.06,             // Animation delay in seconds
  layoutType: 'masonry'    // Layout identifier
}
```

## Animation

Masonry uses a simpler animation than organic - a fade-up effect with stagger:

### CSS Implementation

**File:** `web/src/lib/styles/layouts/masonry.css`

```css
.photo.layout-masonry {
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
}

/* Masonry entry animation: fade up instead of rotation */
.photo.layout-masonry.loaded {
    opacity: 0;
    transform: translateY(20px);
}

.gallery.revealed .photo.layout-masonry.loaded {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.3s ease, transform 0.4s ease;
}

.photo.layout-masonry:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    z-index: 50 !important;
}

/* Photo sizing via CSS variable from layout algorithm */
.photo.layout-masonry img {
    width: var(--photo-width);
    height: auto;
}
```

Unlike organic, masonry photos animate with a vertical translate (fade-up) rather than rotation, creating a cleaner, more professional appearance.

## Height Calculation

```javascript
export function calculateMasonryHeight(positions, breakpointLayout, galleryConfig, layoutConfig) {
  if (positions.length === 0) return 100;

  const { bottomMargin = 1 } = galleryConfig || {};

  let maxBottom = 0;
  for (const pos of positions) {
    const bottom = pos.top + pos.height;
    if (bottom > maxBottom) {
      maxBottom = bottom;
    }
  }

  return maxBottom + bottomMargin;
}
```

Same approach as organic - find the maximum bottom edge and add margin.

## Gutter Centering

Photos are centered within their columns using half the gutter:

```javascript
const left = leftMargin + shortestColumn * columnWidth + (gutter / 2);
```

This creates equal spacing on both sides of each photo:

```
┌─────────────────────────────────────┐
│                                     │
│ gutter/2  ┌────────┐  gutter/2     │
│    ◄──►   │ Photo  │   ◄──►        │
│           └────────┘               │
│           columnWidth              │
└─────────────────────────────────────┘
```

## Aspect Ratio Estimation

Same as organic layout:

| Orientation | Aspect Ratio | Height Formula |
|-------------|--------------|----------------|
| Landscape | 3:2 (0.67) | `width * 0.67` |
| Portrait | 2:3 (1.5) | `width * 1.5` |
| Square | 1:1 (1.0) | `width` |

## Algorithm Visualization

```
Initial: columns = 3, columnHeights = [0, 0, 0], gutter = 1.5vw

Available width: 100 - 3 - 3 = 94vw
Column width: 94 / 3 = 31.33vw
Photo width: 31.33 - 1.5 = 29.83vw

Step 1: Place image 1 (portrait)
  - Shortest column: 0
  - left = 3 + 0*31.33 + 0.75 = 3.75vw
  - top = 1vw
  - height = 29.83 * 1.5 = 44.75vw
  - columnHeights = [46.25, 0, 0]

Step 2: Place image 2 (landscape)
  - Shortest column: 1 or 2 (both 0)
  - left = 3 + 1*31.33 + 0.75 = 35.08vw
  - height = 29.83 * 0.67 = 19.99vw
  - columnHeights = [46.25, 21.49, 0]

Step 3: Place image 3 (square)
  - Shortest column: 2
  - left = 3 + 2*31.33 + 0.75 = 66.41vw
  - columnHeights = [46.25, 21.49, 31.33]

Step 4: Place image 4 (landscape)
  - Shortest column: 1
  - top = 1 + 21.49 = 22.49vw
  - columnHeights = [46.25, 42.98, 31.33]
```

## When to Use Masonry

| Use Case | Recommendation |
|----------|----------------|
| Portfolio showcase | Masonry (clean, professional) |
| Artistic gallery | Organic (creative, dynamic) |
| Product grid | Masonry (organized) |
| Mixed media | Organic (casual feel) |
| Mobile-first | Masonry (better with 2 columns) |

## Integration with Gallery

```svelte
<!-- Gallery.svelte -->
<script>
  import { getLayout } from '$lib/utils/layouts/index.js';

  const layout = getLayout(layoutType);  // 'masonry'
  const positions = layout.computePositions(
    shuffledImages,
    currentLayout,      // { columns, photoSize, ... }
    config.gallery,     // { topMargin, leftMargin, ... }
    config.gallery.layouts.masonry  // { gutter, dealingDelay }
  );
</script>

<main class="gallery layout-masonry">
  {#each shuffledImages as image, index}
    <Photo position={positions[index]} layoutType="masonry" ... />
  {/each}
</main>
```

## Setting Per-Gallery Layout

Galleries can specify their layout in `site.json`:

```json
{
  "galleries": {
    "items": {
      "portraits": {
        "displayName": "Portraits",
        "layout": "masonry"
      },
      "abstract": {
        "displayName": "Abstract",
        "layout": "organic"
      }
    },
    "defaultLayout": "organic"
  }
}
```

If a gallery doesn't specify a layout, `defaultLayout` is used.

## Responsive Behavior

Masonry adapts to different column counts:

| Window Width | Columns | Photo Width (approx) |
|--------------|---------|---------------------|
| >= 1600px | 7 | 12vw |
| >= 1440px | 6 | 14vw |
| >= 1280px | 5 | 17vw |
| >= 1024px | 4 | 22vw |
| >= 768px | 3 | 29vw |
| < 768px | 2 | 44vw |

The grid maintains consistent spacing regardless of column count.

## Performance Notes

- **O(n)** complexity for position calculation
- **No randomization**: Faster than organic (no random number generation)
- **Deterministic**: Same input produces same layout
- **Memory efficient**: No extra state for offsets/rotations
