<script>
  import { fade } from "svelte/transition";

  let { visible = false, onClick } = $props();
</script>

{#if visible}
  <div
    class="overlay"
    transition:fade={{ duration: 400 }}
    onclick={onClick}
    onkeydown={(e) => e.key === "Escape" && onClick?.()}
    role="button"
    tabindex="-1"
  ></div>
{/if}
