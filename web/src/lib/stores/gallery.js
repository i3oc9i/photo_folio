import { writable, derived, get } from 'svelte/store';
import { config } from './config.js';

// Current gallery ID
export const currentGalleryId = writable(null);

// Manifest cache (persists across gallery switches)
export const manifestCache = writable({});

// Current gallery's image manifest
export const currentManifest = derived(
  [currentGalleryId, manifestCache],
  ([$id, $cache]) => $cache[$id] || null
);

// Load manifest for a gallery (with caching)
export async function loadManifest(galleryId) {
  const $config = get(config);
  const $cache = get(manifestCache);

  // Return cached if available
  if ($cache[galleryId]) {
    return $cache[galleryId];
  }

  // Fetch manifest
  const manifestUrl = `${$config.assets.path}${galleryId}/${$config.assets.manifestFile}`;

  try {
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      throw new Error(`Failed to load manifest: ${response.status}`);
    }
    const manifest = await response.json();

    // Cache it
    manifestCache.update(cache => ({
      ...cache,
      [galleryId]: manifest
    }));

    return manifest;
  } catch (error) {
    console.error(`Failed to load manifest for gallery "${galleryId}":`, error);
    throw error;
  }
}

// Switch to a gallery
export async function switchGallery(galleryId) {
  await loadManifest(galleryId);
  currentGalleryId.set(galleryId);

  // Update URL hash
  history.replaceState(null, '', `#gallery=${galleryId}`);
}

// Get gallery ID from URL hash
export function getGalleryFromHash() {
  const hash = window.location.hash;
  const match = hash.match(/gallery=([^&]+)/);
  return match ? match[1] : null;
}

// Initialize gallery from URL hash or default
export async function initGallery() {
  const $config = get(config);
  const hashGallery = getGalleryFromHash();
  const galleryId = hashGallery && $config.galleries.items[hashGallery]
    ? hashGallery
    : $config.galleries.default;

  await switchGallery(galleryId);
}
