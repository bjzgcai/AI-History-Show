import argparse
import json
from pathlib import Path
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
IMAGE_ROOT = ROOT / "resources" / "images"
THUMB_ROOT = IMAGE_ROOT / "_thumbs"
MANIFEST_PATH = ROOT / "shared" / "thumbnail-manifest.js"
SOURCE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_SIDE = 640
WEBP_QUALITY = 72


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--targets-file", required=True)
    return parser.parse_args()


def load_sources(targets_file):
    raw_targets = json.loads(Path(targets_file).read_text(encoding="utf-8"))
    if not isinstance(raw_targets, list):
        raise ValueError("Thumbnail targets must be a JSON array.")

    sources = []
    seen = set()
    for raw_path in raw_targets:
        source = (ROOT / str(raw_path)).resolve()
        try:
            source.relative_to(IMAGE_ROOT.resolve())
        except ValueError as exc:
            raise ValueError(f"Thumbnail target is outside resources/images: {raw_path}") from exc
        if source.suffix.lower() not in SOURCE_EXTENSIONS:
            continue
        if not source.is_file():
            raise FileNotFoundError(f"Thumbnail source does not exist: {raw_path}")
        if source in seen:
            continue
        seen.add(source)
        sources.append(source)
    return sources


def thumb_path(source):
    return THUMB_ROOT / f"{source.relative_to(IMAGE_ROOT).as_posix()}.webp"


def thumbnail_is_current(source, target):
    return target.exists() and target.stat().st_mtime >= source.stat().st_mtime


def generate_thumbnail(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        image.save(target, "WEBP", quality=WEBP_QUALITY, method=6)


def remove_stale_thumbnails(targets):
    removed = 0
    if not THUMB_ROOT.exists():
        return removed
    for thumbnail in THUMB_ROOT.rglob("*.webp"):
        if thumbnail not in targets:
            thumbnail.unlink()
            removed += 1
    for directory in sorted(THUMB_ROOT.rglob("*"), reverse=True):
        if directory.is_dir() and not any(directory.iterdir()):
            directory.rmdir()
    return removed


def write_manifest(sources):
    available_sources = sorted(
        source.relative_to(IMAGE_ROOT).as_posix()
        for source in sources
        if thumb_path(source).exists()
    )
    content = (
        "(function (globalScope) {\n"
        f"    globalScope.AIHistoryThumbnailManifest = new Set({json.dumps(available_sources, indent=4)});\n"
        "})(typeof window !== 'undefined' ? window : globalThis);\n"
    )
    if MANIFEST_PATH.exists() and MANIFEST_PATH.read_text(encoding="utf-8") == content:
        return len(available_sources)
    MANIFEST_PATH.write_text(content, encoding="utf-8")
    return len(available_sources)


def main():
    args = parse_args()
    generated = 0
    skipped = 0
    rejected = 0
    failed = []
    sources = load_sources(args.targets_file)
    targets = set()
    for source in sources:
        target = thumb_path(source)
        targets.add(target)
        if thumbnail_is_current(source, target):
            if target.stat().st_size < source.stat().st_size:
                skipped += 1
                continue
            target.unlink()
            rejected += 1
            continue
        try:
            generate_thumbnail(source, target)
            if target.stat().st_size >= source.stat().st_size:
                target.unlink()
                rejected += 1
                continue
            generated += 1
        except Exception as exc:  # noqa: BLE001 - report all media conversion failures.
            failed.append((source, exc))

    if failed:
        for source, exc in failed:
            print(f"FAILED {source.relative_to(ROOT)}: {exc}")
        raise SystemExit(1)

    removed = remove_stale_thumbnails(targets)
    available = write_manifest(sources)
    print(
        f"Generated {generated} thumbnails; skipped {skipped} up-to-date files; "
        f"rejected {rejected} thumbnails that were not smaller than their originals; "
        f"removed {removed} stale thumbnails; manifest contains {available} thumbnails."
    )


if __name__ == "__main__":
    main()
