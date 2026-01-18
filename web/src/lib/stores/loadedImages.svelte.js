// Module-level state for loaded image IDs (Svelte 5 runes)
let imageIds = $state(new Set());

// Get the Set of loaded image IDs
export function getLoadedImageIds() {
  return imageIds;
}

// Get array of loaded image IDs
export function getLoadedImageArray() {
  return Array.from(imageIds);
}

// Add an image ID to the loaded set
export function markImageLoaded(imageId) {
  imageIds = new Set([...imageIds, imageId]);
}

// Clear all loaded images (on gallery switch)
export function clearLoadedImages() {
  imageIds = new Set();
}

// Check if an image is loaded
export function isImageLoaded(imageId) {
  return imageIds.has(imageId);
}
