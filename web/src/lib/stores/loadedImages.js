import { writable, derived, get } from 'svelte/store';

// Set of loaded image IDs (used for lightbox sequence)
export const loadedImageIds = writable(new Set());

// Add an image ID to the loaded set
export function markImageLoaded(imageId) {
  loadedImageIds.update(set => {
    const newSet = new Set(set);
    newSet.add(imageId);
    return newSet;
  });
}

// Clear all loaded images (on gallery switch)
export function clearLoadedImages() {
  loadedImageIds.set(new Set());
}

// Get array of loaded image IDs
export const loadedImageArray = derived(
  loadedImageIds,
  $set => Array.from($set)
);
