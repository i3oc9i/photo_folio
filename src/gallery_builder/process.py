#!/usr/bin/env python3
"""
Image Preprocessing for Photography Portfolio

Converts images from source/photos/ to optimized WebP format
with multiple sizes for responsive loading.

Usage:
    uv run process-photos [--force] [-j JOBS]

Options:
    --force         Reprocess all images, even if unchanged
    -j, --jobs N    Number of parallel jobs (default: 1, 0 = auto)
"""

import argparse
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

# Configuration - paths relative to project root
SOURCE_BASE = "gallery"  # Scan subdirectories as galleries
OUTPUT_BASE = "web/public/assets/gallery"
MANIFEST_FILE = "images.json"

# Output sizes (longest edge in pixels)
SIZES = {
    "thumb": 400,  # Mobile gallery
    "medium": 800,  # Tablet/desktop gallery
    "full": 1600,  # Lightbox view
}

WEBP_QUALITY = 85
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp"}


def get_project_root() -> Path:
    """Find project root by looking for pyproject.toml."""
    current = Path.cwd()

    # Check current directory and parents
    for path in [current] + list(current.parents):
        if (path / "pyproject.toml").exists():
            return path

    # Fallback to current directory
    return current


def get_orientation(width: int, height: int) -> str:
    """Determine image orientation."""
    if width > height:
        return "landscape"
    elif height > width:
        return "portrait"
    return "square"


def discover_galleries(source_base: Path) -> list[str]:
    """Find all gallery subdirectories in input folder."""
    galleries = []
    for item in source_base.iterdir():
        if item.is_dir() and not item.name.startswith("."):
            galleries.append(item.name)
    return sorted(galleries)


def generate_display_name(gallery_name: str) -> str:
    """Generate display name from directory name (title case with spaces)."""
    return gallery_name.replace("_", " ").replace("-", " ").title()


def update_config_galleries(config_path: Path, galleries: list[str]) -> None:
    """Update config.json galleries section to match discovered galleries."""
    with open(config_path) as f:
        config = json.load(f)

    existing_galleries = config.get("galleries", {})
    existing_items = existing_galleries.get("items", {})
    existing_default = existing_galleries.get("default")
    existing_default_layout = existing_galleries.get("defaultLayout")

    # Build new items, preserving existing display names and layout
    new_items = {}
    for i, gallery_name in enumerate(galleries, 1):
        if gallery_name in existing_items:
            # Preserve existing properties and update order
            item = {
                "displayName": existing_items[gallery_name].get(
                    "displayName", generate_display_name(gallery_name)
                ),
                "order": i,
            }
            # Preserve layout if it exists
            if "layout" in existing_items[gallery_name]:
                item["layout"] = existing_items[gallery_name]["layout"]
            new_items[gallery_name] = item
        else:
            # Generate new display name (no layout for new galleries)
            new_items[gallery_name] = {
                "displayName": generate_display_name(gallery_name),
                "order": i,
            }

    # Determine default gallery
    if existing_default and existing_default in galleries:
        new_default = existing_default
    else:
        new_default = galleries[0] if galleries else None

    # Update config, preserving defaultLayout if it exists
    new_galleries = {"default": new_default, "items": new_items}
    if existing_default_layout:
        new_galleries["defaultLayout"] = existing_default_layout

    config["galleries"] = new_galleries

    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)


def resize_image(img: Image.Image, target_size: int) -> Image.Image:
    """Resize image so longest edge is exactly target_size, preserving aspect ratio."""
    width, height = img.size

    # Always resize to target_size (up or down) for uniform dimensions
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


def needs_processing(source_path: Path, output_paths: list[Path]) -> bool:
    """Check if source image needs to be processed."""
    source_mtime = os.path.getmtime(source_path)

    for output_path in output_paths:
        if not output_path.exists():
            return True
        if os.path.getmtime(output_path) < source_mtime:
            return True

    return False


def process_image(
    source_path: Path, base_name: str, output_dir: Path, force: bool = False
) -> tuple[str, dict | str | None]:
    """Process a single image into multiple sizes."""
    output_paths = {size: output_dir / size / f"{base_name}.webp" for size in SIZES}

    if not force and not needs_processing(source_path, list(output_paths.values())):
        return "skipped", None

    try:
        with Image.open(source_path) as img:
            # Convert to RGB if necessary
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
                "height": original_height,
            }

    except Exception as e:
        return "error", str(e)


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

    return removed // len(SIZES)


def clean_orphan_galleries(output_base: Path, valid_galleries: set[str]) -> list[str]:
    """Remove gallery directories that no longer have source folders."""
    removed = []
    if not output_base.exists():
        return removed

    for item in output_base.iterdir():
        if item.is_dir() and not item.name.startswith("."):
            if item.name not in valid_galleries:
                # Remove the entire gallery directory
                import shutil

                shutil.rmtree(item)
                removed.append(item.name)

    return removed


def process_gallery(
    gallery_name: str,
    source_dir: Path,
    output_dir: Path,
    force: bool = False,
    jobs: int = 1,
) -> tuple[int, int, int]:
    """Process a single gallery. Returns (processed, skipped, errors) counts."""
    # Create output directories
    for size_name in SIZES:
        (output_dir / size_name).mkdir(parents=True, exist_ok=True)

    # Find all source images
    source_images = []
    for ext in SUPPORTED_EXTENSIONS:
        source_images.extend(source_dir.glob(f"*{ext}"))
        source_images.extend(source_dir.glob(f"*{ext.upper()}"))

    source_images = sorted(set(source_images))

    if not source_images:
        print(f"  No images found in '{source_dir}'")
        return 0, 0, 0

    # Process images
    processed = 0
    skipped = 0
    errors = 0
    manifest_images = []
    valid_ids: set[str] = set()

    # Load existing manifest for skipped images
    manifest_path = output_dir / MANIFEST_FILE
    existing_manifest: dict = {}
    if manifest_path.exists():
        with open(manifest_path) as f:
            existing_manifest = json.load(f)

    # Build valid_ids first (needed for orphan cleanup)
    for source_path in source_images:
        valid_ids.add(source_path.stem)

    # Determine worker count
    max_workers = jobs if jobs > 0 else (os.cpu_count() or 4)

    # Process images (parallel or sequential based on jobs)
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(process_image, path, path.stem, output_dir, force): path
            for path in source_images
        }

        for future in as_completed(futures):
            source_path = futures[future]
            base_name = source_path.stem
            status, data = future.result()

            if status == "processed":
                print(f"  ✓ {source_path.name} → thumb, medium, full")
                processed += 1
                manifest_images.append(data)
            elif status == "skipped":
                print(f"  · {source_path.name} (unchanged)")
                skipped += 1
                # Use existing manifest data
                for img in existing_manifest.get("images", []):
                    if img["id"] == base_name:
                        manifest_images.append(img)
                        break
            else:
                print(f"  ✗ {source_path.name} - Error: {data}")
                errors += 1

    # Clean orphaned files
    removed = clean_orphans(output_dir, valid_ids)
    if removed > 0:
        print(f"  🗑  Removed {removed} orphaned image(s)")

    # Sort manifest
    manifest_images.sort(key=lambda x: x["id"])

    # Write manifest
    manifest = {
        "images": manifest_images,
        "generated": datetime.now(timezone.utc).isoformat(),
        "sizes": SIZES,
    }

    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    return processed, skipped, errors


def main() -> int:
    """Main entry point for CLI."""
    parser = argparse.ArgumentParser(description="Process images for web portfolio")
    parser.add_argument("--force", action="store_true", help="Reprocess all images")
    parser.add_argument(
        "-j",
        "--jobs",
        type=int,
        default=1,
        help="Number of parallel jobs (default: 1, use 0 for auto based on CPU count)",
    )
    args = parser.parse_args()

    # Find project root
    project_root = get_project_root()
    source_base = project_root / SOURCE_BASE
    output_base = project_root / OUTPUT_BASE

    if not source_base.exists():
        print(f"Error: Source directory '{source_base}' not found")
        print(f"Expected path: {source_base.absolute()}")
        return 1

    # Discover galleries (subdirectories in input/)
    galleries = discover_galleries(source_base)

    if not galleries:
        print(f"No gallery directories found in '{source_base}'")
        print("Create subdirectories (e.g., input/bw/, input/colors/) with images.")
        return 1

    print(f"Found {len(galleries)} gallery(ies): {', '.join(galleries)}\n")

    # Update site.json with discovered galleries
    config_path = project_root / "web" / "public" / "site.json"
    if config_path.exists():
        update_config_galleries(config_path, galleries)
        print(f"Updated site.json with {len(galleries)} gallery(ies)\n")

    # Process each gallery
    total_processed = 0
    total_skipped = 0
    total_errors = 0
    total_source_size = 0
    total_output_size = 0

    for gallery_name in galleries:
        source_dir = source_base / gallery_name
        output_dir = output_base / gallery_name

        # Count source images for this gallery
        source_images = []
        for ext in SUPPORTED_EXTENSIONS:
            source_images.extend(source_dir.glob(f"*{ext}"))
            source_images.extend(source_dir.glob(f"*{ext.upper()}"))
        source_images = list(set(source_images))

        print(f"[{gallery_name}] Processing {len(source_images)} images...")

        processed, skipped, errors = process_gallery(
            gallery_name, source_dir, output_dir, args.force, args.jobs
        )

        total_processed += processed
        total_skipped += skipped
        total_errors += errors

        # Calculate sizes for this gallery
        total_source_size += sum(p.stat().st_size for p in source_images)
        for size_name in SIZES:
            size_dir = output_dir / size_name
            if size_dir.exists():
                total_output_size += sum(
                    p.stat().st_size for p in size_dir.glob("*.webp")
                )

        print()

    # Clean orphaned galleries
    removed_galleries = clean_orphan_galleries(output_base, set(galleries))
    if removed_galleries:
        print(f"🗑  Removed orphaned galleries: {', '.join(removed_galleries)}\n")

    # Summary
    print(f"{'=' * 50}")
    print(
        f"Done: {total_processed} processed, {total_skipped} skipped, {total_errors} errors"
    )

    # Size report
    source_mb = total_source_size / (1024 * 1024)
    output_mb = total_output_size / (1024 * 1024)

    print(f"\nTotal size: {source_mb:.1f}MB (source) → {output_mb:.1f}MB (optimized)")
    if source_mb > 0:
        savings = (1 - output_mb / source_mb) * 100
        print(f"Savings: {savings:.0f}% reduction")

    return 0 if total_errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
