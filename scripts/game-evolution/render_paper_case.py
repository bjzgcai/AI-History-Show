#!/usr/bin/env python3
"""Render evidence-bounded paper cases as original explanatory MP4 files."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw

from game_record_core import GameRecordError, ROOT, localized, sha256_file
from game_record_frames import load_font


MANIFEST_GLOB = "archive/events/*/paper-cases/paper-case.json"


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise GameRecordError(f"Cannot read paper-case manifest {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise GameRecordError(f"Paper-case manifest must contain an object: {path}")
    return value


def _font(size: int, bold: bool = False):
    candidates = [
        str(ROOT / "public/fonts/oppo-sans/OPPO Sans 4.0.ttf"),
        "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
        "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
    ]
    for candidate in candidates:
        try:
            from PIL import ImageFont

            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return load_font(size, bold=bold)


def _text(draw: ImageDraw.ImageDraw, position: tuple[int, int], value: str, *, size: int, fill: tuple[int, int, int], bold: bool = False) -> None:
    draw.text(position, value, font=_font(size, bold), fill=fill)


def _center_text(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], value: str, *, size: int, fill: tuple[int, int, int], bold: bool = False) -> None:
    font = _font(size, bold)
    bounds = draw.textbbox((0, 0), value, font=font)
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    x0, y0, x1, y1 = box
    draw.text(((x0 + x1 - width) / 2, (y0 + y1 - height) / 2 - 3), value, font=font, fill=fill)


def _panel(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], *, fill: tuple[int, int, int], outline: tuple[int, int, int] = (67, 78, 76), width: int = 2) -> None:
    draw.rounded_rectangle(box, radius=8, fill=fill, outline=outline, width=width)


def _tile_label(tile: str) -> tuple[str, tuple[int, int, int]]:
    suit = tile[-1]
    rank = tile[:-1]
    if suit == "m":
        return f"{rank} 万", (166, 44, 35)
    if suit == "p":
        return f"{rank} 筒", (37, 71, 118)
    if suit == "s":
        return f"{rank} 索", (35, 111, 70)
    honors = {"N": "北", "G": "发"}
    return honors.get(tile, tile), (25, 31, 30)


def _draw_tile(draw: ImageDraw.ImageDraw, x: int, y: int, tile: str, *, accent: str = "", faded: bool = False) -> None:
    width, height = 67, 92
    fill = (214, 215, 207) if faded else (246, 243, 226)
    outline = (97, 96, 85)
    draw.rounded_rectangle((x, y, x + width, y + height), radius=7, fill=fill, outline=outline, width=2)
    draw.line((x + 5, y + height - 8, x + width - 5, y + height - 8), fill=(176, 172, 151), width=3)
    label, color = _tile_label(tile)
    if faded:
        color = tuple(int((value + 160) / 2) for value in color)
    _center_text(draw, (x + 2, y + 5, x + width - 2, y + height - 12), label, size=25, fill=color, bold=True)
    if accent:
        accent_color = (41, 133, 190) if accent == "blue" else (210, 65, 52)
        draw.rounded_rectangle((x - 5, y - 5, x + width + 5, y + height + 5), radius=10, outline=accent_color, width=6)


def _draw_hand(draw: ImageDraw.ImageDraw, manifest: dict[str, Any], scene: str) -> None:
    tiles = manifest["case"]["visibleHand"]
    start_x, y = 74, 458
    gap = 75
    for index, tile in enumerate(tiles):
        accent = ""
        faded = False
        if tile == "N" and scene in {"candidates", "decision", "future", "result"}:
            accent = "red"
        if tile == manifest["case"]["actualDiscard"] and index == manifest["case"]["actualDiscardIndex"]:
            if scene in {"candidates", "decision"}:
                accent = "blue"
            elif scene in {"discard", "future", "result"}:
                faded = True
        _draw_tile(draw, start_x + index * gap, y, tile, accent=accent, faded=faded)


def _draw_table(draw: ImageDraw.ImageDraw, manifest: dict[str, Any], scene: str) -> None:
    _panel(draw, (62, 168, 1128, 622), fill=(18, 70, 67), outline=(37, 106, 99), width=3)
    draw.ellipse((366, 216, 824, 436), fill=(23, 88, 82), outline=(70, 136, 125), width=3)
    _center_text(draw, (458, 275, 730, 345), "东 2 局", size=35, fill=(230, 224, 199), bold=True)
    _center_text(draw, (458, 331, 730, 373), "论文图 13 的单一状态", size=17, fill=(166, 206, 196))

    opponents = [((473, 182, 714, 222), "对手"), ((838, 288, 1070, 330), "对手"), ((116, 288, 348, 330), "对手")]
    for box, label in opponents:
        _panel(draw, box, fill=(28, 57, 57), outline=(64, 99, 95))
        _center_text(draw, box, label, size=17, fill=(185, 199, 194))

    if scene in {"future", "result"}:
        _panel(draw, (814, 238, 1094, 378), fill=(247, 225, 216), outline=(210, 65, 52), width=3)
        _center_text(draw, (834, 252, 1074, 292), "论文设想的后续状态", size=17, fill=(146, 48, 39), bold=True)
        _center_text(draw, (834, 298, 1074, 344), "另一名玩家突然立直", size=22, fill=(74, 38, 34), bold=True)
        _center_text(draw, (834, 342, 1074, 368), "非真实后续牌谱", size=14, fill=(126, 78, 70))

    _draw_hand(draw, manifest, scene)

    if scene in {"discard", "future", "result"}:
        _draw_tile(draw, 581, 348, manifest["case"]["actualDiscard"], accent="blue")
        _center_text(draw, (515, 328, 717, 350), "Suphx 实际弃牌", size=16, fill=(184, 216, 224), bold=True)


def _draw_suphx_safe_tile_frame(manifest: dict[str, Any], scene: dict[str, Any]) -> Image.Image:
    width = int(manifest["render"]["width"])
    height = int(manifest["render"]["height"])
    image = Image.new("RGB", (width, height), (239, 238, 231))
    draw = ImageDraw.Draw(image)
    ink = (25, 33, 35)
    muted = (91, 101, 99)
    accent = (210, 65, 52)

    draw.rectangle((0, 0, width, 118), fill=(24, 32, 34))
    _text(draw, (58, 26), localized(manifest["title"], "zh"), size=34, fill=(248, 243, 226), bold=True)
    _text(draw, (60, 72), localized(manifest["title"], "en"), size=18, fill=(173, 190, 186))
    _panel(draw, (958, 25, 1220, 91), fill=(83, 39, 34), outline=accent, width=2)
    _center_text(draw, (970, 31, 1208, 57), "论文局部案例", size=18, fill=(255, 231, 219), bold=True)
    _center_text(draw, (970, 58, 1208, 84), "NOT A FULL REPLAY", size=13, fill=(246, 188, 170), bold=True)

    scene_id = scene["id"]
    _draw_table(draw, manifest, scene_id)

    _panel(draw, (1148, 168, 1232, 622), fill=(231, 230, 220), outline=(184, 183, 171))
    _center_text(draw, (1158, 184, 1222, 226), f"{scene['number']} / {len(manifest['scenes'])}", size=15, fill=muted, bold=True)
    draw.line((1190, 244, 1190, 540), fill=(184, 183, 171), width=3)
    progress = (scene["number"] - 1) / max(1, len(manifest["scenes"]) - 1)
    draw.line((1190, 244, 1190, 244 + int(296 * progress)), fill=accent, width=7)

    _panel(draw, (62, 640, 1232, 704), fill=(250, 249, 244), outline=(202, 202, 193))
    _text(draw, (84, 650), localized(scene["heading"], "zh"), size=22, fill=ink, bold=True)
    _text(draw, (405, 653), localized(scene["body"], "zh"), size=17, fill=muted)
    _text(draw, (84, 682), localized(scene["body"], "en"), size=13, fill=(105, 113, 111))

    if scene_id == "candidates":
        _center_text(draw, (900, 420, 1117, 450), "红框：安全牌", size=16, fill=(242, 194, 181), bold=True)
        _center_text(draw, (475, 420, 700, 450), "蓝框：Suphx 的选择", size=16, fill=(170, 213, 232), bold=True)
    elif scene_id == "decision":
        _panel(draw, (708, 390, 1116, 446), fill=(245, 235, 218), outline=(197, 165, 99))
        _center_text(draw, (724, 400, 1100, 436), "保留北风，牺牲一点当前进攻速度", size=18, fill=(91, 69, 35), bold=True)
    elif scene_id in {"future", "result"}:
        _panel(draw, (84, 354, 444, 430), fill=(226, 240, 231), outline=(59, 132, 88), width=3)
        _center_text(draw, (100, 366, 428, 394), "保留的北风仍可作为安全牌", size=19, fill=(33, 99, 62), bold=True)
        _center_text(draw, (100, 398, 428, 420), "无需拆散接近和牌的面子或对子", size=15, fill=(63, 107, 79))
    if scene_id == "result":
        _panel(draw, (700, 374, 1118, 448), fill=(247, 225, 216), outline=accent, width=3)
        _center_text(draw, (718, 385, 1100, 416), "结论：在进攻与未来防守间留出弹性", size=18, fill=(139, 49, 40), bold=True)
        _center_text(draw, (718, 418, 1100, 440), "3.5 秒后重新播放", size=14, fill=(123, 80, 73))

    return image


def _ffconcat_escape(path: Path) -> str:
    return str(path).replace("'", "'\\''")


def _validate_suphx_safe_tile(manifest: dict[str, Any]) -> None:
    case_data = manifest.get("case")
    if not isinstance(case_data, dict):
        raise GameRecordError("Suphx safe-tile renderer requires a case object.")
    tiles = case_data.get("visibleHand")
    if not isinstance(tiles, list) or len(tiles) != 14 or not all(isinstance(tile, str) and tile for tile in tiles):
        raise GameRecordError("Suphx safe-tile renderer requires visibleHand with 14 tile strings.")
    actual_discard = case_data.get("actualDiscard")
    actual_index = case_data.get("actualDiscardIndex")
    if not isinstance(actual_discard, str) or not isinstance(actual_index, int):
        raise GameRecordError("Suphx safe-tile renderer requires actualDiscard and actualDiscardIndex.")
    if actual_index < 0 or actual_index >= len(tiles) or tiles[actual_index] != actual_discard:
        raise GameRecordError("actualDiscardIndex must point to actualDiscard in visibleHand.")
    if case_data.get("retainedSafeTile") not in tiles:
        raise GameRecordError("retainedSafeTile must identify a tile in visibleHand.")
    expected_scenes = ["intro", "candidates", "decision", "discard", "future", "result"]
    actual_scenes = [scene.get("id") for scene in manifest.get("scenes", [])]
    if actual_scenes != expected_scenes:
        raise GameRecordError(
            f"Suphx safe-tile renderer requires scenes in this order: {', '.join(expected_scenes)}."
        )


PAPER_CASE_RENDERERS = {
    "suphx-safe-tile-v1": {
        "draw_frame": _draw_suphx_safe_tile_frame,
        "validate": _validate_suphx_safe_tile,
    }
}


def _renderer(manifest: dict[str, Any]) -> dict[str, Any]:
    renderer_id = str(manifest.get("renderer", ""))
    renderer = PAPER_CASE_RENDERERS.get(renderer_id)
    if renderer is None:
        raise GameRecordError(f"Unsupported paper-case renderer: {renderer_id or '(missing)'}")
    return renderer


def render(manifest_path: Path, manifest: dict[str, Any]) -> None:
    renderer = _renderer(manifest)
    draw_frame = renderer["draw_frame"]
    output = ROOT / manifest["render"]["videoPath"]
    poster = ROOT / manifest["render"]["posterPath"]
    output.parent.mkdir(parents=True, exist_ok=True)
    poster.parent.mkdir(parents=True, exist_ok=True)
    scenes = manifest["scenes"]
    total_duration = sum(float(scene["durationSeconds"]) for scene in scenes)
    if abs(total_duration - float(manifest["render"]["durationSeconds"])) > 0.001:
        raise GameRecordError(f"Scene durations do not add up for {manifest['id']}")

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise GameRecordError("ffmpeg is required to generate MP4 output.")
    with tempfile.TemporaryDirectory(prefix="ai-history-paper-case-") as temp_name:
        temp_dir = Path(temp_name)
        lines = ["ffconcat version 1.0"]
        last_path: Path | None = None
        for index, scene in enumerate(scenes):
            frame_path = temp_dir / f"scene-{index:02d}.png"
            draw_frame(manifest, scene).save(frame_path, format="PNG", optimize=True)
            lines.extend([f"file '{_ffconcat_escape(frame_path)}'", f"duration {float(scene['durationSeconds']):.9f}"])
            last_path = frame_path
        if last_path is None:
            raise GameRecordError("Paper case contains no scenes.")
        lines.append(f"file '{_ffconcat_escape(last_path)}'")
        concat_path = temp_dir / "scenes.ffconcat"
        concat_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        command = [
            ffmpeg,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_path),
            "-vf",
            f"fps={manifest['render']['fps']},format=yuv420p",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "27",
            "-movflags",
            "+faststart",
            "-an",
            str(output),
        ]
        completed = subprocess.run(command, capture_output=True, text=True, check=False)
        if completed.returncode != 0:
            raise GameRecordError(f"ffmpeg failed for {manifest['id']}: {completed.stderr.strip()}")

    poster_scene = next(scene for scene in scenes if scene["id"] == manifest["render"]["posterScene"])
    draw_frame(manifest, poster_scene).save(poster, format="PNG", optimize=True)
    if output.stat().st_size > int(manifest["render"]["maxBytes"]):
        raise GameRecordError(f"Rendered paper-case video exceeds maxBytes: {output}")


def validate_manifest(manifest_path: Path, manifest: dict[str, Any]) -> None:
    if manifest.get("caseType") != "partial-paper-case":
        raise GameRecordError("Paper-case manifest must use caseType partial-paper-case.")
    if manifest.get("completeGameReplay") is not False:
        raise GameRecordError("Paper-case manifest must explicitly set completeGameReplay to false.")
    if manifest.get("outcomeKnown") is not False:
        raise GameRecordError("This partial case must explicitly state that no outcome is known.")
    renderer = _renderer(manifest)
    renderer["validate"](manifest)
    source_path = ROOT / manifest["evidence"]["localPath"]
    if not source_path.is_file():
        raise GameRecordError(f"Evidence file is missing: {source_path}")
    actual_hash = sha256_file(source_path)
    if actual_hash != manifest["evidence"]["sha256"]:
        raise GameRecordError(f"Evidence SHA-256 mismatch: expected {manifest['evidence']['sha256']}, got {actual_hash}")
    if float(manifest["scenes"][-1]["durationSeconds"]) < 3.5:
        raise GameRecordError("Final paper-case scene must hold for at least 3.5 seconds.")


def probe(manifest: dict[str, Any]) -> dict[str, Any]:
    video = ROOT / manifest["render"]["videoPath"]
    poster = ROOT / manifest["render"]["posterPath"]
    if not video.is_file() or not poster.is_file():
        raise GameRecordError("Rendered paper-case video or poster is missing.")
    completed = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "stream=codec_type,codec_name,pix_fmt,width,height:format=duration,size",
            "-of",
            "json",
            str(video),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        raise GameRecordError(completed.stderr.strip())
    result = json.loads(completed.stdout)
    streams = result["streams"]
    if any(stream["codec_type"] == "audio" for stream in streams):
        raise GameRecordError("Paper-case video must not contain an audio stream.")
    video_stream = next(stream for stream in streams if stream["codec_type"] == "video")
    if video_stream["codec_name"] != "h264" or video_stream["pix_fmt"] != "yuv420p":
        raise GameRecordError(f"Unexpected video encoding: {video_stream}")
    expected = manifest["render"]
    if (int(video_stream["width"]), int(video_stream["height"])) != (int(expected["width"]), int(expected["height"])):
        raise GameRecordError("Unexpected paper-case video dimensions.")
    if abs(float(result["format"]["duration"]) - float(expected["durationSeconds"])) > 1 / int(expected["fps"]) + 0.01:
        raise GameRecordError("Unexpected paper-case video duration.")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifests", nargs="*")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    paths = [Path(value).resolve() for value in args.manifests] if args.manifests else sorted(ROOT.glob(MANIFEST_GLOB))
    if not paths:
        print("No paper-case manifests found.")
        return 1
    try:
        for path in paths:
            manifest = read_json(path)
            validate_manifest(path, manifest)
            if not args.check:
                render(path, manifest)
            result = probe(manifest)
            print(json.dumps({
                "id": manifest["id"],
                "video": manifest["render"]["videoPath"],
                "bytes": int(result["format"]["size"]),
                "duration": float(result["format"]["duration"]),
                "completeGameReplay": False,
            }, ensure_ascii=False))
    except (GameRecordError, OSError, KeyError, ValueError, StopIteration) as exc:
        print(f"ERROR: {exc}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
