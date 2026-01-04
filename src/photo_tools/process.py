#!/usr/bin/env python3
"""
Image Preprocessing for Photography Portfolio

Converts images from source/photos/ to optimized WebP format
with multiple sizes for responsive loading.

Usage:
    uv run process-photos [--force]

Options:
    --force     Reprocess all images, even if unchanged
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

# Configuration - paths relative to project root
SOURCE_DIR = "input/photos"
OUTPUT_DIR = "web/assets"
MANIFEST_FILE = "images.json"

# Output sizes (longest edge in pixels)
SIZES = {
    "thumb": 400,    # Mobile gallery
    "medium": 800,   # Tablet/desktop gallery
    "full": 1600,    # Lightbox view
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
    source_path: Path,
    base_name: str,
    output_dir: Path,
    force: bool = False
) -> tuple[str, dict | str | None]:
    """Process a single image into multiple sizes."""
    output_paths = {
        size: output_dir / size / f"{base_name}.webp"
        for size in SIZES
    }

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
                "height": original_height
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


def main() -> int:
    """Main entry point for CLI."""
    parser = argparse.ArgumentParser(
        description="Process images for web portfolio"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Reprocess all images"
    )
    args = parser.parse_args()

    # Find project root
    project_root = get_project_root()
    source_dir = project_root / SOURCE_DIR
    output_dir = project_root / OUTPUT_DIR

    if not source_dir.exists():
        print(f"Error: Source directory '{source_dir}' not found")
        print(f"Expected path: {source_dir.absolute()}")
        return 1

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
        print(f"No images found in '{source_dir}'")
        return 1

    print(f"Processing {len(source_images)} images...\n")

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

    for source_path in source_images:
        base_name = source_path.stem
        valid_ids.add(base_name)

        status, data = process_image(source_path, base_name, output_dir, args.force)

        if status == "processed":
            print(f"✓ {source_path.name} → thumb, medium, full")
            processed += 1
            manifest_images.append(data)
        elif status == "skipped":
            print(f"· {source_path.name} (unchanged)")
            skipped += 1
            # Use existing manifest data
            for img in existing_manifest.get("images", []):
                if img["id"] == base_name:
                    manifest_images.append(img)
                    break
        else:
            print(f"✗ {source_path.name} - Error: {data}")
            errors += 1

    # Clean orphaned files
    removed = clean_orphans(output_dir, valid_ids)
    if removed > 0:
        print(f"\n🗑  Removed {removed} orphaned image(s)")

    # Sort manifest
    manifest_images.sort(key=lambda x: x["id"])

    # Write manifest
    manifest = {
        "images": manifest_images,
        "generated": datetime.now(timezone.utc).isoformat(),
        "sizes": SIZES
    }

    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    # Summary
    print(f"\n{'='*50}")
    print(f"Done: {processed} processed, {skipped} skipped, {errors} errors")
    print(f"Manifest: {manifest_path}")

    # Size report
    source_size = sum(p.stat().st_size for p in source_images) / (1024 * 1024)
    output_size = 0
    for size_name in SIZES:
        size_dir = output_dir / size_name
        if size_dir.exists():
            output_size += sum(p.stat().st_size for p in size_dir.glob("*.webp"))
    output_size = output_size / (1024 * 1024)

    print(f"\nSize: {source_size:.1f}MB (source) → {output_size:.1f}MB (optimized)")
    if source_size > 0:
        savings = (1 - output_size / source_size) * 100
        print(f"Savings: {savings:.0f}% reduction")

    return 0 if errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
