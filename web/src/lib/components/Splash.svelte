<script>
  import { fade } from 'svelte/transition';

  let { config, onEnter } = $props();
  let visible = $state(true);

  function handleEnter() {
    visible = false;
    if (onEnter) onEnter();
  }
</script>

{#if visible}
  <div class="splash" transition:fade={{ duration: 800 }}>
    <div class="splash-content">
      <h1 class="splash-name">{config.site.name}</h1>
      <p class="splash-subtitle">{config.site.subtitle}</p>
      <button class="splash-enter" onclick={handleEnter}>
        {config.site.enterButtonText}
      </button>
    </div>
  </div>
{/if}
