import { computeMasonryPositions, calculateMasonryHeight } from "./masonry.js";
import { computeOrganicPositions, calculateOrganicHeight } from "./organic.js";

/**
 * Layout registry - maps layout type to algorithm functions
 */
const layouts = {
  organic: {
    computePositions: computeOrganicPositions,
    calculateHeight: calculateOrganicHeight,
  },
  masonry: {
    computePositions: computeMasonryPositions,
    calculateHeight: calculateMasonryHeight,
  },
};

/**
 * Get layout algorithm by type
 * @param {string} layoutType - 'organic' | 'masonry' | future types
 * @returns {object} Layout algorithm with computePositions and calculateHeight functions
 */
export function getLayout(layoutType) {
  const layout = layouts[layoutType];
  if (!layout) {
    console.warn(`Unknown layout type: ${layoutType}, falling back to organic`);
    return layouts.organic;
  }
  return layout;
}

/**
 * Get list of available layout types
 * @returns {string[]} Array of layout type names
 */
export function getLayoutTypes() {
  return Object.keys(layouts);
}

/**
 * Register a new layout type (for extensibility)
 * @param {string} name - Layout type name
 * @param {object} implementation - Object with computePositions and calculateHeight functions
 */
export function registerLayout(name, implementation) {
  layouts[name] = implementation;
}
