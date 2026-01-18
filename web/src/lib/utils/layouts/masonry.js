/**
 * Deterministic scale factor based on photo index
 * Uses sine-based hash for well-distributed values across consecutive indices
 */
function getPhotoScale(index, min, max) {
  if (min === max) return min;
  // Sine-based hash produces well-distributed values for any index
  const seed = Math.abs(Math.sin(index * 12.9898 + 78.233) * 43758.5453) % 1;
  return min + seed * (max - min);
}

/**
 * Compute positions for masonry (Pinterest-style) layout
 * Clean, aligned grid with preserved aspect ratios and optional random scaling
 */
export function computeMasonryPositions(
  images,
  breakpointLayout,
  galleryConfig,
  layoutConfig,
) {
  const positions = [];
  const { columns } = breakpointLayout;
  const { topMargin, leftMargin = 1, rightMargin = 1 } = galleryConfig;
  const {
    gutter = 1.5,
    dealingDelay = 0.02,
    scaleRandom = { min: 1, max: 1 },
  } = layoutConfig;

  // Normalize scale values (swap if min > max)
  const scaleMin = Math.min(scaleRandom.min, scaleRandom.max);
  const scaleMax = Math.max(scaleRandom.min, scaleRandom.max);

  const availableWidth = 100 - leftMargin - rightMargin;
  const columnWidth = availableWidth / columns;
  const columnHeights = new Array(columns).fill(0);

  // Max photo width (column minus gutter) - this is what scale=max produces
  const maxPhotoWidth = columnWidth - gutter;
  // Base width: at max scale, photo fills maxPhotoWidth; at min scale, it's smaller
  const basePhotoWidth = maxPhotoWidth / scaleMax;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    // Find the shortest column
    let shortestColumn = 0;
    let minHeight = columnHeights[0];
    for (let col = 1; col < columns; col++) {
      if (columnHeights[col] < minHeight) {
        minHeight = columnHeights[col];
        shortestColumn = col;
      }
    }

    // Apply deterministic scale factor
    const scale = getPhotoScale(i, scaleMin, scaleMax);
    const scaledWidth = basePhotoWidth * scale;

    // Calculate height based on aspect ratio
    let scaledHeight;
    if (image.orientation === "landscape") {
      scaledHeight = scaledWidth * 0.67;
    } else if (image.orientation === "portrait") {
      scaledHeight = scaledWidth * 1.5;
    } else {
      scaledHeight = scaledWidth;
    }

    // Center scaled photo within column slot
    const centerOffset = (maxPhotoWidth - scaledWidth) / 2;
    const left =
      leftMargin + shortestColumn * columnWidth + gutter / 2 + centerOffset;
    const top = topMargin + columnHeights[shortestColumn];

    columnHeights[shortestColumn] += scaledHeight + gutter;

    positions.push({
      id: image.id,
      left,
      top,
      offsetX: 0,
      offsetY: 0,
      size: scaledWidth,
      width: scaledWidth,
      height: scaledHeight,
      rotation: 0,
      startRotation: 0,
      delay: i * dealingDelay,
      layoutType: "masonry",
    });
  }

  return positions;
}

/**
 * Calculate total gallery height for masonry layout
 */
export function calculateMasonryHeight(
  positions,
  _breakpointLayout,
  galleryConfig,
  _layoutConfig,
) {
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
