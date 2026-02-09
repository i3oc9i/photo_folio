<script>
  let { config, onLogoClick = null, onAboutClick, onCreditsClick } = $props();

  // Check if reshuffle is enabled (onLogoClick is provided)
  let reshuffleEnabled = $derived(onLogoClick !== null);
</script>

<header class="header">
  <nav class="nav nav-left">
    <button class="nav-link" onclick={onAboutClick}>About</button>
  </nav>
  <button
    class="logo"
    class:clickable={reshuffleEnabled}
    onclick={reshuffleEnabled ? onLogoClick : undefined}
    style:cursor={reshuffleEnabled ? "pointer" : "default"}
  >
    <span class="logo-name">{config.site.name}</span>
    <span class="logo-subtitle">{config.site.subtitle}</span>
  </button>
  <nav class="nav nav-right">
    <button class="nav-link" onclick={onCreditsClick}>Credits</button>
  </nav>
</header>
