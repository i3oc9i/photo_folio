// Fisher-Yates shuffle algorithm
export function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Sort array of objects alphabetically by id property
export function sortById(array) {
  return [...array].sort((a, b) => a.id.localeCompare(b.id));
}

// Sort array of strings alphabetically
export function sortStrings(array) {
  return [...array].sort((a, b) => a.localeCompare(b));
}

// Random number in range (inclusive)
export function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Random integer in range (inclusive)
export function randomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Resolve effective randomOrder for a gallery (per-gallery override or global fallback)
export function getEffectiveRandomOrder(galleries, galleryId) {
  const galleryConfig = galleries.items?.[galleryId];
  if (galleryConfig?.randomOrder !== undefined) {
    return galleryConfig.randomOrder;
  }
  return galleries.randomOrder !== false; // Default to true
}
