# Quickstart: Gallery Random Order Option

**Feature**: 005-gallery-random-order | **Estimated Scope**: Small (5 files)

## Prerequisites

- Node.js and npm installed
- Repository cloned and dependencies installed (`npm install` in `web/`)

## Quick Implementation Steps

### 1. Add sort utility (shuffle.js)

```javascript
// Add to web/src/lib/utils/shuffle.js
export function sortById(array) {
  return [...array].sort((a, b) => a.id.localeCompare(b.id));
}
```

### 2. Update configuration (site.json)

```json
{
  "galleries": {
    "randomOrder": true,
    ...
  }
}
```

### 3. Compute randomOrder in App.svelte

```javascript
let randomOrder = $derived(
  config.galleries.items[galleryId]?.randomOrder ?? config.galleries.randomOrder ?? true
);
```

### 4. Update Gallery.svelte

- Add `randomOrder` prop
- In `reshuffle()`: use `sortById()` when `randomOrder: false`

### 5. Update Lightbox.svelte

- Add `randomOrder` prop
- In `generateSequence()`: sort and start at index when `randomOrder: false`

### 6. Update Header.svelte

- Add optional `onReshuffle` prop
- Disable logo click when `onReshuffle` is null

## Testing

```bash
cd web
npm run dev
```

1. Default (`randomOrder: true`): Images shuffle, header click reshuffles
2. Set `randomOrder: false` on a gallery: Images sorted, header click disabled
3. Lightbox: Verify navigation is sequential when sorted

## Files Changed

| File                                      | Change                                    |
| ----------------------------------------- | ----------------------------------------- |
| `web/public/site.json`                    | Add `galleries.randomOrder`               |
| `web/src/lib/utils/shuffle.js`            | Add `sortById()`                          |
| `web/src/App.svelte`                      | Compute `randomOrder`, conditional handler|
| `web/src/lib/components/Gallery.svelte`   | Accept prop, sort logic                   |
| `web/src/lib/components/Lightbox.svelte`  | Accept prop, sequence logic               |
| `web/src/lib/components/Header.svelte`    | Optional click handler                    |
