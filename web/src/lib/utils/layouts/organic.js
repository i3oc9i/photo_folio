import { randomInRange } from '../shuffle.js';

/**
 * Compute positions for organic (scattered) layout
 * Creates a "photos scattered on a table" effect with random offsets and rotation
 */
export function computeOrganicPositions(images, breakpointLayout, galleryConfig, layoutConfig) {
  const positions = [];
  const { columns, photoSize, squareSize } = breakpointLayout;
  const { topMargin, leftMargin = 1, rightMargin = 1 } = galleryConfig;
  const { randomOffset, rotation, dealingRotation, dealingDelay, spacing = 2 } = layoutConfig;

  const availableWidth = 100 - leftMargin - rightMargin;
  const columnWidth = availableWidth / columns;
  const columnHeights = new Array(columns).fill(0);

  // Account for negative random offset so topMargin is always respected as minimum clear space
  const offsetBuffer = Math.abs(randomOffset.min);

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

    // Calculate base position
    // Add offsetBuffer to ensure topMargin is respected even with maximum negative offsetY
    const baseLeft = leftMargin + shortestColumn * columnWidth;
    const baseTop = topMargin + offsetBuffer + columnHeights[shortestColumn];

    // Add random offsets for organic feel
    const offsetX = randomInRange(randomOffset.min, randomOffset.max);
    const offsetY = randomInRange(randomOffset.min, randomOffset.max);

    // Calculate rotations for animation
    const endRotation = randomInRange(rotation.min, rotation.max);
    const startRotation = randomInRange(dealingRotation.min, dealingRotation.max);

    // Determine size based on orientation
    const size = image.orientation === 'square' ? squareSize : photoSize;

    // Estimate height for column tracking
    let estimatedHeight;
    if (image.orientation === 'landscape') {
      estimatedHeight = size * 0.67;
    } else if (image.orientation === 'portrait') {
      estimatedHeight = size * 1.5;
    } else {
      estimatedHeight = size;
    }

    columnHeights[shortestColumn] += estimatedHeight + spacing;

    positions.push({
      id: image.id,
      left: baseLeft + offsetX,
      top: baseTop + offsetY,
      offsetX,
      offsetY,
      size,
      height: estimatedHeight,
      rotation: endRotation,
      startRotation,
      delay: i * dealingDelay,
      layoutType: 'organic'
    });
  }

  return positions;
}

/**
 * Calculate total gallery height for organic layout
 */
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
