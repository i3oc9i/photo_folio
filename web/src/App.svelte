<script>
  import { onMount } from 'svelte';

  // Components
  import Splash from '$lib/components/Splash.svelte';
  import Header from '$lib/components/Header.svelte';
  import GallerySelector from '$lib/components/GallerySelector.svelte';
  import Gallery from '$lib/components/Gallery.svelte';
  import Panel from '$lib/components/Panel.svelte';
  import Overlay from '$lib/components/Overlay.svelte';
  import Lightbox from '$lib/components/Lightbox.svelte';
  import ScrollTopButton from '$lib/components/ScrollTopButton.svelte';

  // Stores
  import { config as configStore, loadConfig, applyTheme } from '$lib/stores/config.js';
  import {
    currentGalleryId,
    currentManifest,
    switchGallery,
    initGallery,
    getGalleryFromHash
  } from '$lib/stores/gallery.js';

  // State
  let config = $state(null);
  let loading = $state(true);
  let error = $state(null);
  let splashVisible = $state(true);

  // Panel states
  let aboutPanelOpen = $state(false);
  let creditsPanelOpen = $state(false);

  // Lightbox state
  let lightboxOpen = $state(false);
  let lightboxStartImageId = $state(null);

  // Gallery component reference (using $state to silence warning, though not strictly reactive)
  let galleryComponent = $state(null);

  // Store subscriptions (runes mode doesn't auto-subscribe with $)
  let galleryId = $state(null);
  let manifest = $state(null);

  // Gallery path for lightbox
  let galleryPath = $derived(
    config && galleryId ? `${config.assets.path}${galleryId}/` : ''
  );

  // Store subscriptions via $effect
  $effect(() => {
    const unsubGalleryId = currentGalleryId.subscribe(v => galleryId = v);
    const unsubManifest = currentManifest.subscribe(v => manifest = v);
    return () => {
      unsubGalleryId();
      unsubManifest();
    };
  });

  // Event listeners via $effect
  $effect(() => {
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  });

  // Load configuration on mount (one-time initialization)
  onMount(async () => {
    try {
      config = await loadConfig();
      applyTheme(config.theme);
      document.title = config.site.title;

      // Initialize gallery from URL hash or default
      await initGallery();
      loading = false;
    } catch (err) {
      console.error('Failed to load:', err);
      error = err.message || 'Failed to load application';
      loading = false;
    }
  });

  // Handle URL hash change
  function handleHashChange() {
    const hashGallery = getGalleryFromHash();
    if (hashGallery && config.galleries.items[hashGallery]) {
      switchGallery(hashGallery);
    }
  }

  // Handlers
  function handleSplashEnter() {
    splashVisible = false;
  }

  function handleLogoClick() {
    const delay = (config.theme.transitions.reshuffleDelay || 0) * 1000;

    if (window.scrollY > 0) {
      // Scroll to top first, then reshuffle after scroll completes + delay
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Wait for scroll to complete before reshuffling
      const checkScrollComplete = () => {
        if (window.scrollY === 0) {
          setTimeout(() => galleryComponent?.triggerReshuffle(), delay);
        } else {
          requestAnimationFrame(checkScrollComplete);
        }
      };
      requestAnimationFrame(checkScrollComplete);
    } else {
      galleryComponent?.triggerReshuffle();
    }
  }

  function handleGallerySelect(galleryId) {
    switchGallery(galleryId);
  }

  function handlePhotoClick(imageId) {
    lightboxStartImageId = imageId;
    lightboxOpen = true;
  }

  function closeLightbox() {
    lightboxOpen = false;
    lightboxStartImageId = null;
  }

  function closeAllPanels() {
    aboutPanelOpen = false;
    creditsPanelOpen = false;
  }
</script>

{#if loading}
  <div class="loading-screen">Loading...</div>
{:else if error}
  <div class="error-screen">
    <p>Error: {error}</p>
    <p>Check browser console for details.</p>
  </div>
{:else if config}
  <!-- Splash Screen -->
  {#if splashVisible}
    <Splash {config} onEnter={handleSplashEnter} />
  {/if}

  <!-- Header -->
  <Header
    {config}
    onLogoClick={handleLogoClick}
    onAboutClick={() => aboutPanelOpen = true}
    onCreditsClick={() => creditsPanelOpen = true}
  />

  <!-- Gallery Selector -->
  <GallerySelector
    galleries={config.galleries}
    currentGalleryId={galleryId}
    onSelect={handleGallerySelect}
  />

  <!-- Gallery -->
  {#if manifest}
    <Gallery
      bind:this={galleryComponent}
      {config}
      {manifest}
      {galleryId}
      onPhotoClick={handlePhotoClick}
    />
  {:else}
    <main class="gallery">
      <div class="loading">Loading gallery...</div>
    </main>
  {/if}

  <!-- Panels -->
  <Panel
    side="left"
    open={aboutPanelOpen}
    content={config.panels.about}
    onClose={() => aboutPanelOpen = false}
  />

  <Panel
    side="right"
    open={creditsPanelOpen}
    content={config.panels.credits}
    onClose={() => creditsPanelOpen = false}
  />

  <!-- Overlay for panels -->
  <Overlay
    visible={aboutPanelOpen || creditsPanelOpen}
    onClick={closeAllPanels}
  />

  <!-- Lightbox -->
  <Lightbox
    open={lightboxOpen}
    {galleryPath}
    startImageId={lightboxStartImageId}
    onClose={closeLightbox}
  />

  <!-- Scroll to top button -->
  <ScrollTopButton />
{/if}

<style>
  .loading-screen {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--color-text-muted);
    font-size: 0.875rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .loading {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--color-text-muted);
    font-size: 0.875rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .error-screen {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #ff6b6b;
    text-align: center;
    font-size: 0.875rem;
  }

  .error-screen p {
    margin: 0.5rem 0;
  }
</style>
