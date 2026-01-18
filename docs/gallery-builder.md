# Gallery Builder - Python Image Processing

Technical documentation for the Python image processing pipeline.

## Overview

The gallery builder processes source photos into optimized WebP images at multiple sizes, generates manifests, and auto-updates site configuration. It uses parallel processing via `ThreadPoolExecutor` for performance.

**File:** `src/gallery_builder/process.py`

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                      GALLERY BUILDER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  gallery/                        web/public/assets/gallery/      │
│  ├── color/                      ├── color/                      │
│  │   ├── photo1.jpg    ──────►   │   ├── thumb/                  │
│  │   ├── photo2.jpg              │   │   ├── photo1.webp         │
│  │   └── photo3.png              │   │   ├── photo2.webp         │
│  └── bw/                         │   │   └── photo3.webp         │
│      ├── img1.jpg                │   ├── medium/                 │
│      └── img2.tiff               │   │   └── ...                 │
│                                   │   ├── full/                   │
│  Source photos                   │   │   └── ...                 │
│  (not in git)                    │   └── images.json             │
│                                   └── bw/                         │
│                                       ├── thumb/                  │
│                                       ├── medium/                 │
│                                       ├── full/                   │
│                                       └── images.json             │
│                                                                   │
│                                   web/public/site.json            │
│                                   (galleries section updated)     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Output Sizes

```python
SIZES = {
    "thumb": 400,    # Mobile gallery view
    "medium": 800,   # Tablet/desktop gallery view
    "full": 1600,    # Lightbox full-screen view
}
```

Each source image produces three WebP outputs with the longest edge at the specified pixel size.

| Size   | Longest Edge | Use Case                   | Typical File Size |
| ------ | ------------ | -------------------------- | ----------------- |
| thumb  | 400px        | Mobile gallery, thumbnails | ~20-40KB          |
| medium | 800px        | Desktop gallery grid       | ~80-150KB         |
| full   | 1600px       | Lightbox viewer            | ~200-400KB        |

## Processing Pipeline

### Single Image Processing

```python
def process_image(
    source_path: Path,
    base_name: str,
    output_dir: Path,
    force: bool = False
) -> tuple[str, dict | str | None]:
    """Process a single image into multiple sizes."""

    # Check if processing needed
    output_paths = {
        size: output_dir / size / f"{base_name}.webp"
        for size in SIZES
    }

    if not force and not needs_processing(source_path, list(output_paths.values())):
        return "skipped", None

    try:
        with Image.open(source_path) as img:
            # Convert RGBA/palette to RGB
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            original_width, original_height = img.size
            orientation = get_orientation(original_width, original_height)

            # Generate each size
            for size_name, max_size in SIZES.items():
                resized = resize_image(img, max_size)
                output_path = output_paths[size_name]
                output_path.parent.mkdir(parents=True, exist_ok=True)
                resized.save(output_path, "WEBP", quality=WEBP_QUALITY)

            return "processed", {
                "id": base_name,
                "orientation": orientation,
                "width": original_width,
                "height": original_height
            }

    except Exception as e:
        return "error", str(e)
```

### Incremental Processing

The builder checks if processing is needed:

```python
def needs_processing(source_path: Path, output_paths: list[Path]) -> bool:
    """Check if source image needs to be processed."""
    source_mtime = os.path.getmtime(source_path)

    for output_path in output_paths:
        if not output_path.exists():
            return True
        if os.path.getmtime(output_path) < source_mtime:
            return True

    return False
```

An image is reprocessed only if:

- Any output file is missing
- Source file is newer than any output file

This makes subsequent runs fast when only a few images change.

## Parallel Processing

### ThreadPoolExecutor

```python
def process_gallery(gallery_name, source_dir, output_dir, force=False, jobs=1):
    # Determine worker count
    max_workers = jobs if jobs > 0 else (os.cpu_count() or 4)

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        futures = {
            executor.submit(process_image, path, path.stem, output_dir, force): path
            for path in source_images
        }

        # Collect results as they complete
        for future in as_completed(futures):
            source_path = futures[future]
            status, data = future.result()

            if status == "processed":
                print(f"  ✓ {source_path.name} → thumb, medium, full")
                processed += 1
                manifest_images.append(data)
            elif status == "skipped":
                print(f"  · {source_path.name} (unchanged)")
                skipped += 1
            else:
                print(f"  ✗ {source_path.name} - Error: {data}")
                errors += 1
```

### Job Configuration

| `-j` Value | Workers   | Description                     |
| ---------- | --------- | ------------------------------- |
| 1          | 1         | Sequential (default)            |
| 4          | 4         | 4 parallel workers              |
| 0          | CPU count | Auto-detect (e.g., 8 on 8-core) |

## Gallery Discovery

Galleries are automatically discovered from subdirectories:

```python
def discover_galleries(source_base: Path) -> list[str]:
    """Find all gallery subdirectories in input folder."""
    galleries = []
    for item in source_base.iterdir():
        if item.is_dir() and not item.name.startswith('.'):
            galleries.append(item.name)
    return sorted(galleries)
```

Directory structure:

```text
gallery/
├── color/          → "color" gallery
├── black_white/    → "black_white" gallery
├── portraits/      → "portraits" gallery
└── .hidden/        → ignored (starts with .)
```

## Manifest Generation

Each gallery produces an `images.json` manifest:

```json
{
  "images": [
    {
      "id": "photo1",
      "orientation": "landscape",
      "width": 5000,
      "height": 3333
    },
    {
      "id": "photo2",
      "orientation": "portrait",
      "width": 3000,
      "height": 4500
    }
  ],
  "generated": "2024-01-15T10:30:00+00:00",
  "sizes": {
    "thumb": 400,
    "medium": 800,
    "full": 1600
  }
}
```

### Manifest Fields

| Field                  | Description                          |
| ---------------------- | ------------------------------------ |
| `images[].id`          | Filename without extension           |
| `images[].orientation` | "landscape", "portrait", or "square" |
| `images[].width`       | Original width in pixels             |
| `images[].height`      | Original height in pixels            |
| `generated`            | ISO 8601 timestamp                   |
| `sizes`                | Output size configuration            |

## Site Configuration Updates

The builder auto-updates `site.json` with discovered galleries:

```python
def update_config_galleries(config_path: Path, galleries: list[str]) -> None:
    """Update config.json galleries section to match discovered galleries."""
    with open(config_path) as f:
        config = json.load(f)

    existing_items = config.get('galleries', {}).get('items', {})

    new_items = {}
    for i, gallery_name in enumerate(galleries, 1):
        if gallery_name in existing_items:
            # Preserve existing displayName and layout
            item = {
                'displayName': existing_items[gallery_name].get(
                    'displayName', generate_display_name(gallery_name)
                ),
                'order': i
            }
            if 'layout' in existing_items[gallery_name]:
                item['layout'] = existing_items[gallery_name]['layout']
            new_items[gallery_name] = item
        else:
            # Generate new entry
            new_items[gallery_name] = {
                'displayName': generate_display_name(gallery_name),
                'order': i
            }

    config['galleries']['items'] = new_items
    # ... write back to file
```

### Display Name Generation

```python
def generate_display_name(gallery_name: str) -> str:
    """Generate display name from directory name."""
    return gallery_name.replace('_', ' ').replace('-', ' ').title()
```

| Directory Name  | Generated Display Name |
| --------------- | ---------------------- |
| `color`         | "Color"                |
| `black_white`   | "Black White"          |
| `street-photos` | "Street Photos"        |

Existing display names are preserved; only new galleries get auto-generated names.

## Orphan Cleanup

### Orphaned Images

Removes WebP files that no longer have source files:

```python
def clean_orphans(output_dir: Path, valid_ids: set[str]) -> int:
    """Remove processed images that no longer have source files."""
    removed = 0

    for size_name in SIZES:
        size_dir = output_dir / size_name
        if not size_dir.exists():
            continue

        for webp_file in size_dir.glob("*.webp"):
            file_id = webp_file.stem
            if file_id not in valid_ids:
                webp_file.unlink()
                removed += 1

    return removed // len(SIZES)  # Count unique images, not files
```

### Orphaned Galleries

Removes gallery directories that no longer have source folders:

```python
def clean_orphan_galleries(output_base: Path, valid_galleries: set[str]) -> list[str]:
    """Remove gallery directories that no longer have source folders."""
    removed = []
    for item in output_base.iterdir():
        if item.is_dir() and not item.name.startswith('.'):
            if item.name not in valid_galleries:
                shutil.rmtree(item)
                removed.append(item.name)
    return removed
```

## Image Resizing

```python
def resize_image(img: Image.Image, target_size: int) -> Image.Image:
    """Resize image so longest edge is exactly target_size."""
    width, height = img.size

    # Determine scaling based on longest edge
    if width >= height:
        if width == target_size:
            return img
        new_width = target_size
        new_height = int(height * (target_size / width))
    else:
        if height == target_size:
            return img
        new_height = target_size
        new_width = int(width * (target_size / height))

    return img.resize((new_width, new_height), Image.Resampling.LANCZOS)
```

- Uses **LANCZOS** resampling for high-quality downscaling
- Preserves aspect ratio
- Targets longest edge (not fixed dimensions)

## CLI Interface

```bash
uv run build-gallery [--force] [-j JOBS]
```

### Options

| Option    | Description                               |
| --------- | ----------------------------------------- |
| `--force` | Reprocess all images, ignoring timestamps |
| `-j N`    | Number of parallel workers (0 = auto)     |

### Poetry Tasks

Defined in `pyproject.toml`:

```toml
[tool.poe.tasks]
dev = ["dev:assets", "dev:server"]
"dev:assets" = "build-gallery -j 8"
"dev:assets:force" = "build-gallery --force -j 8"
"dev:server" = { cmd = "npm run dev", cwd = "./web" }
```

| Command                | Description                        |
| ---------------------- | ---------------------------------- |
| `poe dev`              | Build assets then start dev server |
| `poe dev:assets`       | Process images with 8 workers      |
| `poe dev:assets:force` | Force reprocess all images         |

## Supported Formats

```python
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp"}
```

Input files can be any of these formats. All outputs are WebP.

## Output Quality

```python
WEBP_QUALITY = 85
```

WebP at 85% quality provides a good balance:

- Significantly smaller than JPEG at equivalent quality
- Minimal visible artifacts
- Supports transparency (though converted to RGB)

## Color Mode Handling

```python
if img.mode in ("RGBA", "P"):
    img = img.convert("RGB")
```

- **RGBA** (with alpha): Converted to RGB (alpha discarded)
- **P** (palette): Converted to RGB
- **RGB**: Used as-is

WebP supports alpha, but gallery images typically don't need transparency.

## Orientation Detection

```python
def get_orientation(width: int, height: int) -> str:
    """Determine image orientation."""
    if width > height:
        return "landscape"
    elif height > width:
        return "portrait"
    return "square"
```

Used by layout algorithms to estimate photo dimensions.

## Output Example

Running `poe dev:assets` on a gallery with 50 images:

```text
Found 2 gallery(ies): color, portraits

Updated site.json with 2 gallery(ies)

[color] Processing 30 images...
  ✓ sunset.jpg → thumb, medium, full
  ✓ forest.jpg → thumb, medium, full
  · beach.jpg (unchanged)
  · mountain.png (unchanged)
  ...

[portraits] Processing 20 images...
  ✓ portrait1.jpg → thumb, medium, full
  · portrait2.jpg (unchanged)
  ...

==================================================
Done: 15 processed, 35 skipped, 0 errors

Total size: 450.2MB (source) → 85.3MB (optimized)
Savings: 81% reduction
```

## Processing Flow

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  1. Find project root (look for pyproject.toml)                  │
│                        │                                          │
│                        ▼                                          │
│  2. Discover galleries (subdirs in gallery/)                     │
│                        │                                          │
│                        ▼                                          │
│  3. Update site.json with gallery metadata                       │
│                        │                                          │
│                        ▼                                          │
│  4. For each gallery:                                            │
│     ┌──────────────────────────────────────────┐                │
│     │ a. Find source images                     │                │
│     │ b. Create ThreadPoolExecutor              │                │
│     │ c. Submit process_image() for each        │                │
│     │ d. Collect results as_completed()         │                │
│     │ e. Clean orphaned WebP files              │                │
│     │ f. Write images.json manifest             │                │
│     └──────────────────────────────────────────┘                │
│                        │                                          │
│                        ▼                                          │
│  5. Clean orphaned gallery directories                           │
│                        │                                          │
│                        ▼                                          │
│  6. Print summary with size savings                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling

Individual image errors don't stop processing:

```python
try:
    # Process image...
    return "processed", metadata
except Exception as e:
    return "error", str(e)
```

Errors are counted and reported, but other images continue processing.

## Performance Tips

| Scenario    | Recommendation                      |
| ----------- | ----------------------------------- |
| First run   | Use `-j 0` (auto workers)           |
| Few changes | Default `-j 1` is fine              |
| Large batch | Use `-j 8` or `-j 0`                |
| CI/CD       | Use `--force -j 0` for clean builds |
| Development | Run `poe dev` (builds then serves)  |
