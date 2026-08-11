"""Frame sequencing, MP4 encoding, and output validation."""

from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from game_record_core import GameRecordError, ParsedGame, ROOT, frame_durations, parse_record, read_json
from game_record_frames import draw_frame


def _ffconcat_escape(path: Path) -> str:
    return str(path).replace("'", "'\\''")


def _write_concat_manifest(
    temp_dir: Path,
    manifest: dict[str, Any],
    parsed: ParsedGame,
    durations: list[float],
) -> Path:
    total_moves = len(parsed.canonical_moves)
    concat_lines = ["ffconcat version 1.0"]
    last_frame_path: Path | None = None

    for index, (state, frame_duration) in enumerate(zip(parsed.states, durations, strict=True)):
        frame_path = temp_dir / f"frame-{index:04d}.png"
        draw_frame(manifest, state, total_moves, is_final=index == len(parsed.states) - 1).save(
            frame_path,
            format="PNG",
            optimize=True,
        )
        concat_lines.append(f"file '{_ffconcat_escape(frame_path)}'")
        concat_lines.append(f"duration {frame_duration:.9f}")
        last_frame_path = frame_path

    if last_frame_path is None:
        raise GameRecordError("No frames were generated for the game record.")
    concat_lines.append(f"file '{_ffconcat_escape(last_frame_path)}'")
    concat_path = temp_dir / "frames.ffconcat"
    concat_path.write_text("\n".join(concat_lines) + "\n", encoding="utf-8")
    return concat_path


def _run_ffmpeg(manifest: dict[str, Any], concat_path: Path, output: Path) -> None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise GameRecordError("ffmpeg is required to generate MP4 output.")
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


def render_video(manifest: dict[str, Any], parsed: ParsedGame) -> None:
    output = ROOT / manifest["render"]["videoPath"]
    poster = ROOT / manifest["render"]["posterPath"]
    output.parent.mkdir(parents=True, exist_ok=True)
    poster.parent.mkdir(parents=True, exist_ok=True)

    total_moves = len(parsed.canonical_moves)
    poster_index = min(len(parsed.states) - 1, int(manifest["render"]["posterMove"]))
    draw_frame(manifest, parsed.states[poster_index], total_moves).save(poster, format="PNG", optimize=True)

    durations = frame_durations(manifest, len(parsed.states))
    with tempfile.TemporaryDirectory(prefix="ai-history-game-frames-") as temp_name:
        concat_path = _write_concat_manifest(Path(temp_name), manifest, parsed, durations)
        _run_ffmpeg(manifest, concat_path, output)

    if output.stat().st_size > int(manifest["render"]["maxBytes"]):
        raise GameRecordError(
            f"Rendered video exceeds maxBytes for {manifest['id']}: {output.stat().st_size} bytes"
        )


def probe_video(path: Path) -> dict[str, Any]:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise GameRecordError("ffprobe is required to validate MP4 output.")
    command = [
        ffprobe,
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=codec_name,pix_fmt,width,height,avg_frame_rate:format=duration,size",
        "-of",
        "json",
        str(path),
    ]
    completed = subprocess.run(command, capture_output=True, text=True, check=False)
    if completed.returncode != 0:
        raise GameRecordError(f"ffprobe failed for {path}: {completed.stderr.strip()}")
    return json.loads(completed.stdout)


def validate_outputs(manifest: dict[str, Any]) -> dict[str, Any]:
    video_path = ROOT / manifest["render"]["videoPath"]
    poster_path = ROOT / manifest["render"]["posterPath"]
    if not video_path.is_file():
        raise GameRecordError(f"Rendered video does not exist: {video_path}")
    if not poster_path.is_file():
        raise GameRecordError(f"Poster does not exist: {poster_path}")

    probe = probe_video(video_path)
    stream = probe["streams"][0]
    if stream["codec_name"] != "h264" or stream["pix_fmt"] != "yuv420p":
        raise GameRecordError(f"Unexpected video encoding for {video_path}: {stream}")
    if int(stream["width"]) != int(manifest["render"]["width"]) or int(stream["height"]) != int(
        manifest["render"]["height"]
    ):
        raise GameRecordError(f"Unexpected video dimensions for {video_path}: {stream['width']}x{stream['height']}")
    if video_path.stat().st_size > int(manifest["render"]["maxBytes"]):
        raise GameRecordError(f"Video exceeds maxBytes: {video_path}")

    expected_duration = float(manifest["render"]["durationSeconds"])
    actual_duration = float(probe["format"]["duration"])
    frame_tolerance = 1 / int(manifest["render"]["fps"]) + 0.01
    if abs(actual_duration - expected_duration) > frame_tolerance:
        raise GameRecordError(
            f"Unexpected video duration for {video_path}: expected {expected_duration}, got {actual_duration}"
        )
    return probe


def process_manifest(manifest_path: Path, *, check_only: bool) -> dict[str, Any]:
    manifest = read_json(manifest_path)
    parsed = parse_record(manifest_path, manifest)
    if not check_only:
        render_video(manifest, parsed)
    probe = validate_outputs(manifest)
    return {
        "id": manifest["id"],
        "moves": len(parsed.canonical_moves),
        "mainLineSha256": parsed.digest,
        "video": manifest["render"]["videoPath"],
        "bytes": int(probe["format"]["size"]),
        "duration": float(probe["format"]["duration"]),
    }
