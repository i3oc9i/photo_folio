/**
 * Backward-compatible wrapper for the layout system
 * New code should use getLayout() from './layouts/index.js' directly
 */

import { getLayout } from './layouts/index.js';

/**
 * Compute positions for all photos (legacy API)
 * @deprecated Use getLayout(type).computePositions() instead
 */
export function computePositions(images, layout, galleryConfig) {
  const layoutAlgo = getLayout('organic');
  // Legacy API passes galleryConfig with layout params at top level
  const layoutConfig = {
    randomOffset: galleryConfig.randomOffset,
    rotation: galleryConfig.rotation,
    dealingRotation: galleryConfig.dealingRotation,
    dealingDelay: galleryConfig.dealingDelay,
    spacing: 2
  };
  return layoutAlgo.computePositions(images, layout, galleryConfig, layoutConfig);
}

/**
 * Calculate total gallery height (legacy API)
 * @deprecated Use getLayout(type).calculateHeight() instead
 */
export function calculateGalleryHeight(positions, layout) {
  const layoutAlgo = getLayout('organic');
  return layoutAlgo.calculateHeight(positions, layout);
}

// Re-export new API for gradual migration
export { getLayout, getLayoutTypes } from './layouts/index.js';
