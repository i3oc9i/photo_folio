# Organic Layout Algorithm

Technical documentation for the organic (scattered photos) layout algorithm.

## Overview

The organic layout creates a "photos scattered on a table" effect with random offsets, rotations, and z-index stacking. Photos are distributed across columns with slight randomization to create a natural, non-grid appearance.

**File:** `web/src/lib/utils/layouts/organic.js`

## Visual Effect

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│     ┌──────┐                                                     │
│     │      │  ╱╲           ┌────────────┐                        │
│     │  1   │ ╱  ╲          │            │                        │
│     │      │╱ 2  ╲         │     3      │                        │
│     └──────┘╲    ╱         │            │                        │
│              ╲  ╱          └────────────┘                        │
│               ╲╱                                                  │
│                        ┌──────┐                                   │
│  ┌────────────┐       │      │    ┌──────────┐                   │
│  │            │       │  5   │    │          │                   │
│  │     4      │       │      │    │    6     │                   │
│  │            │       └──────┘    │          │                   │
│  └────────────┘                   └──────────┘                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

Key characteristics:
- Random offsets from grid positions
- Random rotations (-5° to +5°)
- Overlapping via z-index variation
- Dealing animation from rotated position
```

## Algorithm

### Core Strategy: Shortest-Column-First

The algorithm uses a greedy shortest-column-first approach:

1. Maintain an array of column heights
2. For each image, find the shortest column
3. Place the image at the top of that column
4. Add random offsets and rotation
5. Update the column height

This creates a balanced distribution while allowing organic variation.

### Implementation

```javascript
export function computeOrganicPositions(images, breakpointLayout, galleryConfig, layoutConfig) {
  const positions = [];
  const { columns, photoSize, squareSize } = breakpointLayout;
  const { topMargin, leftMargin = 1, rightMargin = 1 } = galleryConfig;
  const {
    randomOffset,
    rotation,
    dealingRotation,
    dealingDelay,
    spacing = 2,
    zIndex = { min: 1, max: 10 }
  } = layoutConfig;

  // Calculate available width and column dimensions
  const availableWidth = 100 - leftMargin - rightMargin;
  const columnWidth = availableWidth / columns;
  const columnHeights = new Array(columns).fill(0);

  // Photo width based on column minus spacing
  const photoWidth = columnWidth - spacing;

  // Buffer for negative offsets to ensure topMargin is respected
  const offsetBuffer = Math.abs(randomOffset.min);

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

    // Calculate base position
    const baseLeft = leftMargin + shortestColumn * columnWidth;
    const baseTop = topMargin + offsetBuffer + columnHeights[shortestColumn];

    // Add random offsets
    const offsetX = randomInRange(randomOffset.min, randomOffset.max);
    const offsetY = randomInRange(randomOffset.min, randomOffset.max);

    // Calculate rotations for animation
    const endRotation = randomInRange(rotation.min, rotation.max);
    const startRotation = randomInRange(dealingRotation.min, dealingRotation.max);

    // Random z-index for stacking effect
    const photoZIndex = Math.floor(randomInRange(zIndex.min, zIndex.max + 1));

    // Estimate height based on orientation
    let estimatedHeight;
    if (image.orientation === 'landscape') {
      estimatedHeight = photoWidth * 0.67;
    } else if (image.orientation === 'portrait') {
      estimatedHeight = photoWidth * 1.5;
    } else {
      estimatedHeight = photoWidth;  // square
    }

    // Update column height
    columnHeights[shortestColumn] += estimatedHeight + spacing;

    positions.push({
      id: image.id,
      left: baseLeft + offsetX,
      top: baseTop + offsetY,
      offsetX,
      offsetY,
      size: photoWidth,
      width: photoWidth,
      height: estimatedHeight,
      rotation: endRotation,
      startRotation,
      delay: i * dealingDelay,
      zIndex: photoZIndex,
      layoutType: 'organic'
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
      "organic": {
        "randomOffset": { "min": -3, "max": 3 },
        "rotation": { "min": -5, "max": 5 },
        "zIndex": { "min": 1, "max": 10 },
        "dealingRotation": { "min": -30, "max": 30 },
        "dealingDelay": 0.03,
        "spacing": 2
      }
    }
  }
}
```

### Configuration Parameters

| Parameter             | Type   | Default | Description                                    |
| --------------------- | ------ | ------- | ---------------------------------------------- |
| `randomOffset.min`    | number | -3      | Minimum offset in vw units                     |
| `randomOffset.max`    | number | 3       | Maximum offset in vw units                     |
| `rotation.min`        | number | -5      | Minimum final rotation in degrees              |
| `rotation.max`        | number | 5       | Maximum final rotation in degrees              |
| `zIndex.min`          | number | 1       | Minimum z-index for stacking                   |
| `zIndex.max`          | number | 10      | Maximum z-index for stacking                   |
| `dealingRotation.min` | number | -30     | Minimum initial rotation (animation start)     |
| `dealingRotation.max` | number | 30      | Maximum initial rotation (animation start)     |
| `dealingDelay`        | number | 0.03    | Delay between each photo's animation (seconds) |
| `spacing`             | number | 2       | Space between photos in vw units               |

## Position Object

Each image receives a position object:

```javascript
{
  id: "photo-name",        // Image identifier
  left: 15.5,              // Left position in vw
  top: 22.3,               // Top position in vw
  offsetX: -1.2,           // Random X offset applied
  offsetY: 2.1,            // Random Y offset applied
  size: 12,                // Photo width in vw
  width: 12,               // Same as size
  height: 8,               // Estimated height in vw
  rotation: -3.5,          // Final rotation in degrees
  startRotation: 25,       // Initial rotation for animation
  delay: 0.15,             // Animation delay in seconds
  zIndex: 7,               // Stack order
  layoutType: 'organic'    // Layout identifier
}
```

## Dealing Animation

Photos animate from an initial "dealing" state to their final position:

### CSS Implementation

**File:** `web/src/lib/styles/layouts/organic.css`

```css
.photo.layout-organic:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 50px rgba(0, 0, 0, 0.7);
    z-index: 50 !important;
}

/* Photo sizing via CSS variable from layout algorithm */
.photo.layout-organic img {
    width: var(--photo-width);
    height: auto;
}

.photo.layout-organic.portrait img {
    width: auto;
    height: var(--photo-width);
}

.photo.layout-organic.square img {
    width: var(--photo-width);
    height: var(--photo-width);
}
```

The base animation is defined in `components/gallery.css`:

```css
/* Before gallery is revealed */
.photo.loaded {
    opacity: 0;
    transform: scale(0.3) rotate(var(--start-rotation, 15deg));
}

/* After gallery reveal - photos deal onto table */
.gallery.revealed .photo.loaded {
    opacity: 1;
    transform: rotate(var(--end-rotation, 0deg));
    transition: opacity 0.1s ease, transform var(--transition-gallery) cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Animation Flow

1. **Initial state**: Photo has `--start-rotation` (e.g., -25°), opacity 0
2. **Load trigger**: Photo enters viewport, `loaded` class added
3. **Transition**: Rotates to `--end-rotation` (e.g., 3°), fades in
4. **Stagger**: Each photo's transition is delayed by `i * dealingDelay`

This creates a "dealing cards" effect where photos appear to be tossed onto the surface.

## Height Calculation

```javascript
export function calculateOrganicHeight(positions, breakpointLayout, galleryConfig) {
  if (positions.length === 0) return 100;

  const { bottomMargin = 1 } = galleryConfig;

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

The gallery height is calculated as the maximum bottom edge of all photos plus a margin. This ensures the gallery container fits all content.

## Aspect Ratio Estimation

Since actual image dimensions may not be available during layout calculation, the algorithm estimates height based on orientation:

| Orientation | Aspect Ratio | Height Formula |
| ----------- | ------------ | -------------- |
| Landscape   | 3:2 (0.67)   | `width * 0.67` |
| Portrait    | 2:3 (1.5)    | `width * 1.5`  |
| Square      | 1:1 (1.0)    | `width`        |

These are approximations. The CSS ensures actual images maintain their aspect ratio regardless of estimates.

## Offset Buffer

To ensure the `topMargin` is always respected even with negative random offsets:

```javascript
const offsetBuffer = Math.abs(randomOffset.min);
const baseTop = topMargin + offsetBuffer + columnHeights[shortestColumn];
```

If `randomOffset.min = -3`, the buffer is 3vw. This guarantees photos with the maximum negative offset still respect the top margin.

## Z-Index Stacking

Random z-index values create depth:

```javascript
const photoZIndex = Math.floor(randomInRange(zIndex.min, zIndex.max + 1));
```

With `min=1` and `max=10`, photos receive z-index values 1-10, creating overlapping effects where some photos appear to be on top of others.

## Algorithm Visualization

```text
Initial: columns = 4, columnHeights = [0, 0, 0, 0]

Step 1: Place image 1 (landscape)
  - Shortest column: 0 (all equal)
  - Position: (leftMargin + 0, topMargin + offsetBuffer)
  - columnHeights = [10.5, 0, 0, 0]

Step 2: Place image 2 (portrait)
  - Shortest column: 1, 2, or 3 (all 0)
  - Position: (leftMargin + columnWidth, topMargin + offsetBuffer)
  - columnHeights = [10.5, 20.0, 0, 0]

Step 3: Place image 3 (square)
  - Shortest column: 2 or 3
  - Position: (leftMargin + 2*columnWidth, topMargin + offsetBuffer)
  - columnHeights = [10.5, 20.0, 14.0, 0]

Step 4: Place image 4 (landscape)
  - Shortest column: 3
  - columnHeights = [10.5, 20.0, 14.0, 10.5]

Step 5: Place image 5 (portrait)
  - Shortest column: 0 or 3 (both 10.5)
  - Fills shortest, creating balance
```

## Integration with Gallery

```svelte
<!-- Gallery.svelte -->
<script>
  import { getLayout } from '$lib/utils/layouts/index.js';

  const layout = getLayout(layoutType);  // 'organic'
  const positions = layout.computePositions(
    shuffledImages,
    currentLayout,      // { columns, photoSize, ... }
    config.gallery,     // { topMargin, leftMargin, ... }
    config.gallery.layouts.organic  // { randomOffset, rotation, ... }
  );
  const galleryHeight = layout.calculateHeight(positions, currentLayout, config.gallery);
</script>

<main class="gallery layout-organic" style="height: {galleryHeight}vw">
  {#each shuffledImages as image, index}
    <Photo position={positions[index]} ... />
  {/each}
</main>
```

## Responsive Behavior

Different breakpoints provide different column counts:

| Window Width | Columns | Effect                   |
| ------------ | ------- | ------------------------ |
| >= 1600px    | 7       | Dense, many small photos |
| >= 1440px    | 6       |                          |
| >= 1280px    | 5       |                          |
| >= 1024px    | 4       | Balanced                 |
| >= 768px     | 3       |                          |
| < 768px      | 2       | Spacious, large photos   |

When the window resizes, positions are recalculated with the new column count, creating a fluid responsive experience.

## Performance Notes

- **O(n)** complexity for position calculation
- **Greedy algorithm**: Not globally optimal but fast and good enough
- **Pre-shuffled input**: Images are shuffled before layout, not during
- **Single pass**: Each image positioned exactly once
