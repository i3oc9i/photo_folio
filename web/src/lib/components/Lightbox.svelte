<script>
  import { fade } from 'svelte/transition';
  import { get } from 'svelte/store';
  import { shuffle } from '$lib/utils/shuffle.js';
  import { loadedImageArray } from '$lib/stores/loadedImages.js';

  let { open = false, galleryPath, startImageId, onClose } = $props();

  // Sequence of image IDs to show
  let sequence = $state([]);
  let currentIndex = $state(0);

  // Current image ID (encode for URL compatibility)
  let currentImageId = $derived(sequence[currentIndex] || null);
  let imageSrc = $derived(currentImageId ? `${galleryPath}full/${encodeURIComponent(currentImageId)}.webp` : '');

  // Generate sequence when lightbox opens
  $effect(() => {
    if (open && startImageId) {
      generateSequence(startImageId);
    }
  });

  function generateSequence(startId) {
    // Get all loaded images and shuffle them
    const allImages = [...get(loadedImageArray)];
    const shuffled = shuffle(allImages);

    // Move start image to front
    const startIndex = shuffled.indexOf(startId);
    if (startIndex > 0) {
      shuffled.splice(startIndex, 1);
      shuffled.unshift(startId);
    }

    sequence = shuffled;
    currentIndex = 0;
  }

  function showNext() {
    if (currentIndex < sequence.length - 1) {
      currentIndex++;
    } else {
      // Loop back to start
      currentIndex = 0;
    }
  }

  function showPrev() {
    if (currentIndex > 0) {
      currentIndex--;
    } else {
      // Loop to end
      currentIndex = sequence.length - 1;
    }
  }

  function handleKeydown(event) {
    if (!open) return;

    if (event.key === 'Escape') {
      onClose?.();
    } else if (event.key === 'ArrowRight') {
      showNext();
    } else if (event.key === 'ArrowLeft') {
      showPrev();
    }
  }

  function handleImageClick() {
    showNext();
  }
</script>

<svelte:document onkeydown={handleKeydown} />

{#if open}
  <div class="lightbox" transition:fade={{ duration: 300 }}>
    <button class="lightbox-close" aria-label="Close" onclick={onClose}>&times;</button>
    {#if imageSrc}
      <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
      <!-- svelte-ignore a11y_img_redundant_alt -->
      <img
        class="lightbox-img"
        src={imageSrc}
        alt="Photo"
        onclick={handleImageClick}
        onkeydown={(e) => e.key === 'Enter' && handleImageClick()}
        role="button"
        tabindex="0"
      />
    {/if}
  </div>
{/if}
