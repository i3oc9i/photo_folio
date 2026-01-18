# Feature: Gallery Random Order Option

> Add a `randomOrder` configuration option to control whether gallery images display shuffled or in alphabetical order.

## Context

Currently, the gallery always shuffles images randomly on load and reshuffle. Users want the option to display images in a consistent alphabetical order, which also affects lightbox navigation (sequential vs random).

## Current Behavior

**Gallery.svelte** always shuffles images:

```javascript
function reshuffle() {
  const newShuffled = shuffle(manifest.images);
  // ...
}
```

**Lightbox.svelte** always shuffles navigation sequence:

```javascript
function generateSequence(startId) {
  const allImages = [...getLoadedImageArray()];
  const shuffled = shuffle(allImages);
  // ...
}
```

**Header click** always triggers reshuffle regardless of user preference.

## Proposed Solution

Add `randomOrder` boolean option with:

- Global default in `galleries.randomOrder`
- Per-gallery override in `galleries.items.<id>.randomOrder`

### Configuration

```json
{
  "galleries": {
    "default": "color",
    "randomOrder": true,
    "items": {
      "color": {
        "displayName": "Color",
        "order": 1,
        "randomOrder": false
      }
    }
  }
}
```

### Behavior Matrix

| `randomOrder` | Gallery Display            | Lightbox Navigation     | Header Click           |
|---------------|----------------------------|-------------------------|------------------------|
| `true`        | Shuffled                   | Shuffled                | Re-shuffles            |
| `false`       | Alphabetical by `image.id` | Sequential (sorted)     | Disabled/no-op         |

## Files to Modify

| File | Changes |
| ---- | ------- |
| `web/public/site.json` | Add `galleries.randomOrder: true` global default |
| `web/src/lib/components/Gallery.svelte` | Accept `randomOrder` prop, sort instead of shuffle when false |
| `web/src/lib/components/Lightbox.svelte` | Accept `randomOrder` prop, sort sequence when false |
| `web/src/App.svelte` | Compute effective `randomOrder`, pass to Gallery/Lightbox/Header |
| `web/src/lib/components/Header.svelte` | Accept `reshuffleEnabled` prop, disable click when false |

## Implementation Steps

1. [ ] Add `galleries.randomOrder: true` to `site.json`
2. [ ] Create helper function to resolve effective `randomOrder` for a gallery (per-gallery value or global fallback)
3. [ ] Modify `Gallery.svelte`:
   - Accept `randomOrder` prop
   - In `reshuffle()`: sort by `image.id` alphabetically when `randomOrder: false`
   - Skip animation/reveal logic appropriately
4. [ ] Modify `Lightbox.svelte`:
   - Accept `randomOrder` prop
   - In `generateSequence()`: sort by `image.id` when `randomOrder: false`
5. [ ] Modify `App.svelte`:
   - Add `$derived` to compute `randomOrder` for current gallery
   - Pass `randomOrder` to Gallery and Lightbox components
   - Conditionally pass reshuffle handler to Header
6. [ ] Modify `Header.svelte`:
   - Accept `onReshuffle` prop (null/undefined when disabled)
   - Disable click handler and optionally adjust styling when disabled

## Testing

- [ ] Default `randomOrder: true` - images shuffle on load and header click
- [ ] Gallery with `randomOrder: false` - images sorted alphabetically, header click does nothing
- [ ] Lightbox with `randomOrder: true` - navigation is shuffled
- [ ] Lightbox with `randomOrder: false` - navigation follows alphabetical sequence
- [ ] Per-gallery override works (one gallery random, another sorted)
- [ ] Switching galleries respects each gallery's setting

## Dependencies

- None

## Notes

- Alphabetical sorting uses `image.id` (filename without extension)
- The reveal animation in Gallery can still play for sorted order
- Consider: should sorted order show a different cursor/visual cue on header? (optional future enhancement)
