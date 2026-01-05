<script>
  import { fly } from 'svelte/transition';

  let { side = 'left', open = false, content, onClose } = $props();

  // Fly direction based on side
  let flyX = $derived(side === 'left' ? -450 : 450);

  function handleKeydown(event) {
    if (event.key === 'Escape' && open) {
      onClose?.();
    }
  }
</script>

<svelte:document onkeydown={handleKeydown} />

{#if open}
  <aside
    class="panel panel-{side}"
    transition:fly={{ x: flyX, duration: 400 }}
    onmouseleave={onClose}
  >
    <button class="panel-close" aria-label="Close" onclick={onClose}>&times;</button>
    <div class="panel-content">
      <h2>{content.title}</h2>
      {#each content.paragraphs as paragraph}
        <p>{paragraph}</p>
      {/each}

      {#if content.contact}
        <div class="contact">
          <p>
            {content.contact.label}:
            <a href="mailto:{content.contact.email}">{content.contact.email}</a>
          </p>
        </div>
      {/if}

      {#if content.copyright}
        <div class="credits-note">
          <p>&copy; {content.copyright.year} {content.copyright.name}</p>
        </div>
      {/if}
    </div>
  </aside>
{/if}
