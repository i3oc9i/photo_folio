/**
 * Compute positions for masonry (Pinterest-style) layout
 * Clean, aligned grid with preserved aspect ratios and no random offsets
 */
export function computeMasonryPositions(images, breakpointLayout, galleryConfig, layoutConfig) {
  const positions = [];
  const { columns, photoSize, squareSize } = breakpointLayout;
  const { topMargin, leftMargin = 1, rightMargin = 1 } = galleryConfig;
  const { gutter = 1.5, dealingDelay = 0.02 } = layoutConfig;

  const availableWidth = 100 - leftMargin - rightMargin;
  const columnWidth = availableWidth / columns;
  const columnHeights = new Array(columns).fill(0);

  // Calculate actual photo width based on column width minus gutter
  const photoWidth = columnWidth - gutter;

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
    const left = leftMargin + shortestColumn * columnWidth + (gutter / 2);
    const top = topMargin + columnHeights[shortestColumn];

    // Use calculated photo width for masonry (ignores breakpoint photoSize)
    const size = photoWidth;

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
      width: photoWidth,
      height: photoHeight,
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
