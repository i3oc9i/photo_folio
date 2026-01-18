<script>
  let { galleries, currentGalleryId, onSelect } = $props();
  let isOpen = $state(false);

  // Get sorted gallery items
  let sortedGalleries = $derived(
    Object.entries(galleries.items)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([id, data]) => ({ id, ...data })),
  );

  // Current gallery display name
  let currentDisplayName = $derived(
    galleries.items[currentGalleryId]?.displayName || "Gallery",
  );

  function handleSelect(galleryId) {
    isOpen = false;
    if (onSelect) onSelect(galleryId);
  }

  function handleToggle() {
    isOpen = !isOpen;
  }

  function handleClickOutside(event) {
    if (!event.target.closest(".gallery-selector")) {
      isOpen = false;
    }
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      isOpen = false;
    }
  }
</script>

<svelte:document onclick={handleClickOutside} onkeydown={handleKeydown} />

<div class="gallery-bar">
  <div class="gallery-selector" class:open={isOpen}>
    <button class="gallery-selector-btn" onclick={handleToggle}>
      <span class="gallery-selector-label">{currentDisplayName}</span>
      <span class="gallery-selector-arrow">&#9662;</span>
    </button>
    <ul class="gallery-dropdown">
      {#each sortedGalleries as gallery (gallery.id)}
        <li>
          <button
            class:active={gallery.id === currentGalleryId}
            onclick={() => handleSelect(gallery.id)}
          >
            {gallery.displayName}
          </button>
        </li>
      {/each}
    </ul>
  </div>
</div>
