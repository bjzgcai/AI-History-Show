"""Shared ffconcat encoding and rendered-video validation."""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path
from typing import Any, Iterable

from game_record_core import GameRecordError, ROOT


def _ffconcat_escape(path: Path) -> str:
    return str(path).replace("'", "'\\''")


def write_concat_manifest(
    temp_dir: Path,
    frames: Iterable[tuple[Path, float]],
    *,
    file_name: str = "frames.ffconcat",
) -> Path:
    lines = ["ffconcat version 1.0"]
    last_frame: Path | None = None
    for frame_path, duration in frames:
        lines.extend([f"file '{_ffconcat_escape(frame_path)}'", f"duration {float(duration):.9f}"])
        last_frame = frame_path
    if last_frame is None:
        raise GameRecordError("Cannot encode a video without frames.")
    lines.append(f"file '{_ffconcat_escape(last_frame)}'")
    concat_path = temp_dir / file_name
    concat_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return concat_path


def encode_concat(manifest: dict[str, Any], concat_path: Path, output: Path) -> None:
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
    if output.stat().st_size > int(manifest["render"]["maxBytes"]):
        raise GameRecordError(f"Rendered video exceeds maxBytes for {manifest['id']}: {output.stat().st_size} bytes")


def probe_media(path: Path) -> dict[str, Any]:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise GameRecordError("ffprobe is required to validate MP4 output.")
    completed = subprocess.run(
        [
            ffprobe,
            "-v",
            "error",
            "-show_entries",
            "stream=codec_type,codec_name,pix_fmt,width,height,avg_frame_rate:format=duration,size",
            "-of",
            "json",
            str(path),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        raise GameRecordError(f"ffprobe failed for {path}: {completed.stderr.strip()}")
    try:
        return json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise GameRecordError(f"ffprobe returned invalid JSON for {path}: {exc}") from exc


def validate_video_output(
    manifest: dict[str, Any],
    *,
    video_path: Path | None = None,
    poster_path: Path | None = None,
) -> dict[str, Any]:
    render = manifest["render"]
    video = video_path or ROOT / render["videoPath"]
    poster = poster_path or ROOT / render["posterPath"]
    if not video.is_file():
        raise GameRecordError(f"Rendered video does not exist: {video}")
    if not poster.is_file():
        raise GameRecordError(f"Poster does not exist: {poster}")

    probe = probe_media(video)
    streams = probe.get("streams", [])
    if any(stream.get("codec_type") == "audio" for stream in streams):
        raise GameRecordError(f"Rendered video must not contain an audio stream: {video}")
    video_streams = [stream for stream in streams if stream.get("codec_type") == "video"]
    if len(video_streams) != 1:
        raise GameRecordError(f"Rendered output must contain exactly one video stream: {video}")
    stream = video_streams[0]
    if stream.get("codec_name") != "h264" or stream.get("pix_fmt") != "yuv420p":
        raise GameRecordError(f"Unexpected video encoding for {video}: {stream}")
    if (int(stream["width"]), int(stream["height"])) != (int(render["width"]), int(render["height"])):
        raise GameRecordError(f"Unexpected video dimensions for {video}: {stream['width']}x{stream['height']}")
    if video.stat().st_size > int(render["maxBytes"]):
        raise GameRecordError(f"Video exceeds maxBytes: {video}")

    expected_duration = float(render["durationSeconds"])
    actual_duration = float(probe["format"]["duration"])
    frame_tolerance = 1 / int(render["fps"]) + 0.01
    if abs(actual_duration - expected_duration) > frame_tolerance:
        raise GameRecordError(
            f"Unexpected video duration for {video}: expected {expected_duration}, got {actual_duration}"
        )
    return probe
