from pathlib import Path
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
IMAGE_ROOT = ROOT / "resources" / "images"
THUMB_ROOT = IMAGE_ROOT / "_thumbs"
SOURCE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_SIDE = 640
WEBP_QUALITY = 72


def iter_sources():
    for path in IMAGE_ROOT.rglob("*"):
        if not path.is_file():
            continue
        if THUMB_ROOT in path.parents:
            continue
        if path.suffix.lower() not in SOURCE_EXTENSIONS:
            continue
        yield path


def thumb_path(source):
    return THUMB_ROOT / f"{source.relative_to(IMAGE_ROOT).as_posix()}.webp"


def should_generate(source, target):
    return not target.exists() or target.stat().st_mtime < source.stat().st_mtime


def generate_thumbnail(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        image.save(target, "WEBP", quality=WEBP_QUALITY, method=6)


def main():
    generated = 0
    skipped = 0
    failed = []
    for source in iter_sources():
        target = thumb_path(source)
        if not should_generate(source, target):
            skipped += 1
            continue
        try:
            generate_thumbnail(source, target)
            generated += 1
        except Exception as exc:  # noqa: BLE001 - report all media conversion failures.
            failed.append((source, exc))

    print(f"Generated {generated} thumbnails; skipped {skipped} up-to-date files.")
    if failed:
        for source, exc in failed:
            print(f"FAILED {source.relative_to(ROOT)}: {exc}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
