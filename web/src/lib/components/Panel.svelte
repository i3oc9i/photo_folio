<script>
  import { fly } from 'svelte/transition';

  let { side = 'left', open = false, content, onClose } = $props();

  // Fly direction based on side
  let flyX = $derived(side === 'left' ? -450 : 450);

  // Social network configuration with icons and URL patterns
  const socialNetworks = {
    email: { icon: 'email', getUrl: (v) => `mailto:${v}`, label: 'Email' },
    instagram: { icon: 'instagram', getUrl: (v) => v.startsWith('http') ? v : `https://instagram.com/${v.replace('@', '')}`, label: 'Instagram' },
    twitter: { icon: 'twitter', getUrl: (v) => v.startsWith('http') ? v : `https://x.com/${v.replace('@', '')}`, label: 'X (Twitter)' },
    facebook: { icon: 'facebook', getUrl: (v) => v.startsWith('http') ? v : `https://facebook.com/${v}`, label: 'Facebook' },
    linkedin: { icon: 'linkedin', getUrl: (v) => v.startsWith('http') ? v : `https://linkedin.com/in/${v}`, label: 'LinkedIn' },
    youtube: { icon: 'youtube', getUrl: (v) => v.startsWith('http') ? v : `https://youtube.com/${v}`, label: 'YouTube' },
    pinterest: { icon: 'pinterest', getUrl: (v) => v.startsWith('http') ? v : `https://pinterest.com/${v}`, label: 'Pinterest' },
    behance: { icon: 'behance', getUrl: (v) => v.startsWith('http') ? v : `https://behance.net/${v}`, label: 'Behance' }
  };

  // Get active social links from contact data
  let socialLinks = $derived.by(() => {
    if (!content?.contact) return [];
    return Object.entries(socialNetworks)
      .filter(([key]) => content.contact[key])
      .map(([key, config]) => ({
        key,
        url: config.getUrl(content.contact[key]),
        icon: `/assets/socials/${config.icon}.svg`,
        label: config.label
      }));
  });

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

      {#if content.contact && socialLinks.length > 0}
        <div class="contact">
          <p class="contact-label">{content.contact.label}</p>
          <div class="social-links">
            {#each socialLinks as link (link.key)}
              <a
                href={link.url}
                class="social-link"
                target={link.key === 'email' ? '_self' : '_blank'}
                rel={link.key === 'email' ? undefined : 'noopener noreferrer'}
                aria-label={link.label}
                title={link.label}
              >
                <img src={link.icon} alt={link.label} class="social-icon" />
              </a>
            {/each}
          </div>
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
