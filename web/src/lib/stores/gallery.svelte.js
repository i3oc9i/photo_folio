import { get } from "svelte/store";
import { config } from "./config.js";

// Module-level state
let galleryId = $state(null);
let cache = $state({});

// Derived value
const manifest = $derived(cache[galleryId] || null);

// Accessors for external use
export function getCurrentGalleryId() {
	return galleryId;
}

export function getCurrentManifest() {
	return manifest;
}

export function getManifestCache() {
	return cache;
}

// Load manifest for a gallery (with caching)
export async function loadManifest(id) {
	if (cache[id]) return cache[id];

	const configValue = get(config);
	const manifestUrl = `${configValue.assets.path}${id}/${configValue.assets.manifestFile}`;

	try {
		const response = await fetch(manifestUrl);
		if (!response.ok) {
			throw new Error(`Failed to load manifest: ${response.status}`);
		}
		const data = await response.json();

		cache = { ...cache, [id]: data };
		return data;
	} catch (error) {
		console.error(`Failed to load manifest for gallery "${id}":`, error);
		throw error;
	}
}

// Switch to a gallery
export async function switchGallery(id) {
	await loadManifest(id);
	galleryId = id;

	// Update URL hash
	history.replaceState(null, "", `#gallery=${id}`);
}

// Get gallery ID from URL hash
export function getGalleryFromHash() {
	const hash = window.location.hash;
	const match = hash.match(/gallery=([^&]+)/);
	return match ? match[1] : null;
}

// Initialize gallery with default (always starts fresh on page load)
export async function initGallery() {
	const configValue = get(config);
	await switchGallery(configValue.galleries.default);
}
