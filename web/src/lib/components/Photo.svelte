<script>
  import { lazyload } from '$lib/actions/lazyload.js';
  import { markImageLoaded } from '$lib/stores/loadedImages.js';

  let {
    image,
    position,
    galleryPath,
    layoutType = 'organic',
    mobileBreakpoint,
    eagerLoad = false,
    onClick
  } = $props();

  let loaded = $state(false);

  function handleLoad() {
    loaded = true;
    markImageLoaded(image.id);
  }

  function triggerLoad() {
    // Start loading the image
    loaded = true;
  }

  // Image paths (encode for srcset compatibility - spaces break srcset parsing)
  let encodedId = $derived(encodeURIComponent(image.id));
  let thumbSrc = $derived(`${galleryPath}thumb/${encodedId}.webp`);
  let mediumSrc = $derived(`${galleryPath}medium/${encodedId}.webp`);
</script>

<div
  class="photo {image.orientation} layout-{layoutType}"
  class:loaded
  style="
    left: {position.left}vw;
    top: {position.top}vw;
    --start-rotation: {position.startRotation}deg;
    --end-rotation: {position.rotation}deg;
    transition-delay: {position.delay}s;
    z-index: {position.zIndex || 1};
  "
  use:lazyload={{ rootMargin: '800px 0px', onLoad: triggerLoad, eager: eagerLoad }}
  onclick={() => onClick?.(image.id)}
  onkeydown={(e) => e.key === 'Enter' && onClick?.(image.id)}
  role="button"
  tabindex="0"
>
  {#if loaded}
    <picture>
      <source
        media="(max-width: {mobileBreakpoint}px)"
        srcset={thumbSrc}
      />
      <source srcset={mediumSrc} />
      <img
        src={mediumSrc}
        alt="Fine art photograph"
        onload={handleLoad}
      />
    </picture>
  {/if}
</div>
