<script>
  import { onMount, untrack } from 'svelte';
  import Photo from './Photo.svelte';
  import { shuffle } from '$lib/utils/shuffle.js';
  import { getLayout } from '$lib/utils/layouts/index.js';
  import { currentLayout } from '$lib/stores/breakpoint.js';
  import { clearLoadedImages } from '$lib/stores/loadedImages.svelte.js';

  let { config, manifest, galleryId, onPhotoClick } = $props();

  // Shuffled images
  let shuffledImages = $state([]);

  // Computed positions
  let positions = $state([]);

  // Gallery revealed state (for dealing animation)
  let revealed = $state(false);

  // Gallery height
  let galleryHeight = $state(100);

  // Track layout for reactivity
  let layout = $state(null);

  // Gallery path for this gallery
  let galleryPath = $derived(`${config.assets.path}${galleryId}/`);

  // Derived: get layout type for current gallery
  let layoutType = $derived(
    config.galleries.items[galleryId]?.layout || config.galleries.defaultLayout || 'organic'
  );

  // Derived: get layout-specific config
  let layoutConfig = $derived(
    config.gallery.layouts?.[layoutType] || config.gallery.layouts?.organic || {}
  );

  // Track previous values to detect actual changes (use primitive identifiers to avoid proxy comparison issues)
  let prevManifestId = null;
  let prevLayoutMinWidth = null;

  // Subscribe to layout store
  onMount(() => {
    const unsubscribe = currentLayout.subscribe(value => {
      layout = value;
    });
    return unsubscribe;
  });

  // Reshuffle function
  function reshuffle() {
    if (!manifest || !layout) return;

    revealed = false;
    const newShuffled = shuffle(manifest.images);

    // Get the appropriate layout algorithm
    const layoutAlgo = getLayout(layoutType);
    const newPositions = layoutAlgo.computePositions(newShuffled, layout, config.gallery, layoutConfig);
    const newHeight = layoutAlgo.calculateHeight(newPositions, layout, config.gallery, layoutConfig);

    // Assign all at once to minimize reactivity triggers
    shuffledImages = newShuffled;
    positions = newPositions;
    galleryHeight = newHeight;

    // Trigger reveal animation after a short delay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          revealed = true;
        }, 100);
      });
    });
  }

  // Reposition on layout change (without reshuffling)
  function reposition() {
    if (!shuffledImages.length || !layout) return;

    // Use untrack to read shuffledImages without creating dependency
    const currentImages = untrack(() => shuffledImages);

    // Get the appropriate layout algorithm
    const layoutAlgo = getLayout(layoutType);
    const newPositions = layoutAlgo.computePositions(currentImages, layout, config.gallery, layoutConfig);
    const newHeight = layoutAlgo.calculateHeight(newPositions, layout, config.gallery, layoutConfig);

    positions = newPositions;
    galleryHeight = newHeight;
  }

  // React to manifest or layout changes
  $effect(() => {
    // Read the reactive values
    const currentManifest = manifest;
    const currentLayout = layout;

    // Only proceed if both are available
    if (!currentManifest || !currentLayout) return;

    // Use primitive identifiers for comparison to avoid proxy issues
    const manifestId = currentManifest.gallery || JSON.stringify(currentManifest.images?.length);
    const layoutMinWidth = currentLayout.minWidth;

    // Check what changed using primitives
    const manifestChanged = manifestId !== prevManifestId;
    const layoutChanged = layoutMinWidth !== prevLayoutMinWidth;

    // Update previous values
    prevManifestId = manifestId;
    prevLayoutMinWidth = layoutMinWidth;

    if (manifestChanged) {
      // New manifest - do full reshuffle
      clearLoadedImages();
      reshuffle();
    } else if (layoutChanged) {
      // Only layout changed - just reposition
      reposition();
    }
  });

  // Expose reshuffle for parent to call
  export function triggerReshuffle() {
    reshuffle();
  }
</script>

<main class="gallery layout-{layoutType}" class:revealed style="height: {galleryHeight}vw;">
  {#each shuffledImages as image, index (image.id)}
    {@const pos = positions[index] || { left: 0, top: 0, rotation: 0, startRotation: 0, delay: 0 }}
    <Photo
      {image}
      position={pos}
      {galleryPath}
      {layoutType}
      mobileBreakpoint={config.mobileBreakpoint}
      eagerLoad={index < config.gallery.eagerLoadCount}
      onClick={onPhotoClick}
    />
  {/each}
</main>

<footer class="gallery-footer">
  <span class="footer-text">{shuffledImages.length} images</span>
</footer>
