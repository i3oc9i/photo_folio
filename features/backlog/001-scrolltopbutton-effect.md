# Feature: ScrollTopButton - Replace onMount with $effect

## Priority: High (Quick Win)
## Effort: ~15 minutes
## File: `web/src/lib/components/ScrollTopButton.svelte`

## Current Implementation

```javascript
onMount(() => {
  function handleScroll() {
    visible = window.scrollY > 500;
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
});
```

## Proposed Change

Replace `onMount` with `$effect` for event listener setup:

```javascript
$effect(() => {
  function handleScroll() {
    visible = window.scrollY > 500;
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
});
```

## Why This is Better

1. **Svelte 5 idiom**: `$effect` is the modern way to handle side effects
2. **Clearer intent**: Shows this is a reactive side effect, not mount-specific logic
3. **Pattern consistency**: Aligns with other components using `$effect`

## Steps

1. Open `web/src/lib/components/ScrollTopButton.svelte`
2. Remove `onMount` import if no longer needed
3. Replace `onMount(() => {...})` with `$effect(() => {...})`
4. Test scroll behavior still works

## Testing

- [ ] Scroll down page - button should appear after 500px
- [ ] Click button - should scroll to top
- [ ] Button should hide when at top
