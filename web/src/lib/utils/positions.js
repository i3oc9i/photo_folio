import { randomInRange } from './shuffle.js';

// Compute positions for all photos in the organic grid
export function computePositions(images, layout, galleryConfig) {
  const positions = [];
  const { columns, photoSize, squareSize } = layout;
  const { topMargin, randomOffset, rotation, dealingRotation, dealingDelay } = galleryConfig;

  // Column width as percentage
  const columnWidth = 100 / columns;

  // Track column heights for masonry-like placement
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

    // Calculate base position
    const baseLeft = shortestColumn * columnWidth;
    const baseTop = topMargin + columnHeights[shortestColumn];

    // Add random offsets
    const offsetX = randomInRange(randomOffset.min, randomOffset.max);
    const offsetY = randomInRange(randomOffset.min, randomOffset.max);

    // Calculate rotations
    const endRotation = randomInRange(rotation.min, rotation.max);
    const startRotation = randomInRange(dealingRotation.min, dealingRotation.max);

    // Determine size based on orientation
    const size = image.orientation === 'square' ? squareSize : photoSize;

    // Estimate height for column tracking (rough approximation)
    let estimatedHeight;
    if (image.orientation === 'landscape') {
      estimatedHeight = size * 0.67; // Approximate aspect ratio
    } else if (image.orientation === 'portrait') {
      estimatedHeight = size * 1.5;
    } else {
      estimatedHeight = size;
    }

    // Update column height
    columnHeights[shortestColumn] += estimatedHeight + 2; // Add some spacing

    positions.push({
      id: image.id,
      left: baseLeft + offsetX,
      top: baseTop + offsetY,
      offsetX,
      offsetY,
      size,
      rotation: endRotation,
      startRotation,
      delay: i * dealingDelay
    });
  }

  return positions;
}

// Calculate total gallery height based on positions
export function calculateGalleryHeight(positions, layout) {
  if (positions.length === 0) return 100;

  let maxBottom = 0;
  for (const pos of positions) {
    // Rough estimate of photo bottom edge
    const estimatedBottom = pos.top + layout.photoSize * 1.5;
    if (estimatedBottom > maxBottom) {
      maxBottom = estimatedBottom;
    }
  }

  return maxBottom + 5; // Add footer space
}
