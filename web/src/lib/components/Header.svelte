<script>
  let { config, onLogoClick, onAboutClick, onCreditsClick } = $props();
</script>

<header class="header">
  <nav class="nav nav-left">
    <button class="nav-link" onclick={onAboutClick}>About</button>
  </nav>
  <button class="logo" onclick={onLogoClick}>
    <span class="logo-name">{config.site.name}</span>
    <span class="logo-subtitle">{config.site.subtitle}</span>
  </button>
  <nav class="nav nav-right">
    <button class="nav-link" onclick={onCreditsClick}>Credits</button>
  </nav>
</header>
