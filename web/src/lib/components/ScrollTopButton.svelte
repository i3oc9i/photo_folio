<script>
  let visible = $state(false);

  $effect(() => {
    function handleScroll() {
      visible = window.scrollY > 500;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  });

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>

<button
  class="scroll-top"
  class:visible
  aria-label="Scroll to top"
  onclick={scrollToTop}
>
  &uarr;
</button>
