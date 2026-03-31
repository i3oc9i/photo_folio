<script>
  import { fade } from "svelte/transition";
  import { shuffle, sortStrings } from "$lib/utils/shuffle.js";
  import { getLoadedImageArray } from "$lib/stores/loadedImages.svelte.js";

  let {
    open = false,
    galleryPath,
    startImageId,
    onClose,
    randomOrder = true,
  } = $props();

  // Sequence of image IDs to show
  let sequence = $state([]);
  let currentIndex = $state(0);

  // Current image ID (encode for URL compatibility)
  let currentImageId = $derived(sequence[currentIndex] || null);
  let imageSrc = $derived(
    currentImageId
      ? `${galleryPath}full/${encodeURIComponent(currentImageId)}.webp`
      : "",
  );

  // Generate sequence when lightbox opens
  $effect(() => {
    if (open && startImageId) {
      generateSequence(startImageId);
    }
  });

  function generateSequence(startId) {
    // Get all loaded images
    const allImages = [...getLoadedImageArray()];

    // Shuffle or sort based on randomOrder setting
    let ordered;
    if (randomOrder) {
      ordered = shuffle(allImages);
      // Move start image to front for shuffled sequence
      const startIndex = ordered.indexOf(startId);
      if (startIndex > 0) {
        ordered.splice(startIndex, 1);
        ordered.unshift(startId);
      }
      currentIndex = 0;
    } else {
      ordered = sortStrings(allImages);
      // Find the start image index for sorted sequence
      currentIndex = ordered.indexOf(startId);
      if (currentIndex === -1) currentIndex = 0;
    }

    sequence = ordered;
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

    if (event.key === "Escape") {
      onClose?.();
    } else if (event.key === "ArrowRight") {
      showNext();
    } else if (event.key === "ArrowLeft") {
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
    <button class="lightbox-close" aria-label="Close" onclick={onClose}
      >&times;</button
    >
    {#if imageSrc}
      <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
      <!-- svelte-ignore a11y_img_redundant_alt -->
      <img
        class="lightbox-img"
        src={imageSrc}
        alt="Photo"
        onclick={handleImageClick}
        onkeydown={(e) => e.key === "Enter" && handleImageClick()}
        role="button"
        tabindex="0"
      />
    {/if}
  </div>
{/if}
