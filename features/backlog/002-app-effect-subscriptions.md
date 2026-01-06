# Feature: App.svelte - Use $effect for Store Subscriptions

## Priority: Medium
## Effort: ~1-2 hours
## File: `web/src/App.svelte`

## Current Implementation

Manual store subscriptions with verbose cleanup in `onMount`:

```javascript
onMount(async () => {
  const unsubGalleryId = currentGalleryId.subscribe(v => galleryId = v);
  const unsubManifest = currentManifest.subscribe(v => manifest = v);

  // ... initialization logic ...

  return () => {
    window.removeEventListener('hashchange', handleHashChange);
    unsubGalleryId();
    unsubManifest();
  };
});
```

## Proposed Change

Separate concerns using `$effect` for subscriptions:

```javascript
// Store subscriptions via $effect
$effect(() => {
  const unsubGalleryId = currentGalleryId.subscribe(v => galleryId = v);
  const unsubManifest = currentManifest.subscribe(v => manifest = v);
  return () => {
    unsubGalleryId();
    unsubManifest();
  };
});

// Event listeners via separate $effect
$effect(() => {
  window.addEventListener('hashchange', handleHashChange);
  return () => window.removeEventListener('hashchange', handleHashChange);
});

// Initialization in onMount (one-time setup)
onMount(async () => {
  // Only initialization logic here
  const cfg = await loadConfig();
  // ...
});
```

## Why This is Better

1. **Separation of concerns**: Subscriptions, events, and init are clearly separated
2. **Reduced boilerplate**: Each `$effect` handles its own cleanup
3. **Easier to reason about**: Clear what each block does
4. **More testable**: Independent effects are easier to test

## Steps

1. Identify all store subscriptions in `onMount`
2. Move each subscription group to its own `$effect`
3. Move event listeners to separate `$effect` blocks
4. Keep only one-time initialization in `onMount`
5. Test all functionality

## Testing

- [ ] Gallery switching works
- [ ] Hash navigation works (#gallery=name)
- [ ] Manifest loads correctly
- [ ] No memory leaks (subscriptions cleaned up)
- [ ] Splash screen transitions correctly

## Dependencies

None - can be done independently.
