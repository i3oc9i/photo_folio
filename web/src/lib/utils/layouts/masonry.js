/**
 * Compute positions for masonry (Pinterest-style) layout
 * Clean, aligned grid with preserved aspect ratios and no random offsets
 */
export function computeMasonryPositions(images, breakpointLayout, galleryConfig, layoutConfig) {
  const positions = [];
  const { columns, photoSize, squareSize } = breakpointLayout;
  const { topMargin } = galleryConfig;
  const { gutter = 1.5, dealingDelay = 0.02 } = layoutConfig;

  const columnWidth = 100 / columns;
  const columnHeights = new Array(columns).fill(0);

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

    // Position centered within column (no random offset)
    const left = shortestColumn * columnWidth + (gutter / 2);
    const top = topMargin + columnHeights[shortestColumn];

    // Determine size based on orientation
    const size = image.orientation === 'square' ? squareSize : photoSize;

    // Calculate height based on aspect ratio
    let photoHeight;
    if (image.orientation === 'landscape') {
      photoHeight = size * 0.67;
    } else if (image.orientation === 'portrait') {
      photoHeight = size * 1.5;
    } else {
      photoHeight = size;
    }

    columnHeights[shortestColumn] += photoHeight + gutter;

    positions.push({
      id: image.id,
      left,
      top,
      offsetX: 0,
      offsetY: 0,
      size,
      rotation: 0,
      startRotation: 0,
      delay: i * dealingDelay,
      layoutType: 'masonry'
    });
  }

  return positions;
}

/**
 * Calculate total gallery height for masonry layout
 */
export function calculateMasonryHeight(positions, breakpointLayout, galleryConfig, layoutConfig) {
  if (positions.length === 0) return 100;

  const { gutter = 1.5 } = layoutConfig || {};

  let maxBottom = 0;
  for (const pos of positions) {
    // Estimate height based on typical aspect ratios
    const photoHeight = breakpointLayout.photoSize * 1.2;
    const bottom = pos.top + photoHeight;
    if (bottom > maxBottom) {
      maxBottom = bottom;
    }
  }

  return maxBottom + 5;
}
