"""Game-record frame sequencing and rendering orchestration."""

from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Any

from game_record_core import ParsedGame, ROOT, frame_durations, parse_record, read_json
from game_record_frames import draw_frame
from video_encoding import encode_concat, validate_video_output, write_concat_manifest


def _write_concat_manifest(
    temp_dir: Path,
    manifest: dict[str, Any],
    parsed: ParsedGame,
    durations: list[float],
) -> Path:
    total_moves = len(parsed.canonical_moves)
    frames: list[tuple[Path, float]] = []

    for index, (state, frame_duration) in enumerate(zip(parsed.states, durations, strict=True)):
        frame_path = temp_dir / f"frame-{index:04d}.png"
        draw_frame(manifest, state, total_moves, is_final=index == len(parsed.states) - 1).save(
            frame_path,
            format="PNG",
            optimize=True,
        )
        frames.append((frame_path, frame_duration))
    return write_concat_manifest(temp_dir, frames)


def render_video(manifest: dict[str, Any], parsed: ParsedGame) -> None:
    output = ROOT / manifest["render"]["videoPath"]
    poster = ROOT / manifest["render"]["posterPath"]
    output.parent.mkdir(parents=True, exist_ok=True)
    poster.parent.mkdir(parents=True, exist_ok=True)

    total_moves = len(parsed.canonical_moves)
    poster_index = int(manifest["render"]["posterMove"])
    draw_frame(manifest, parsed.states[poster_index], total_moves).save(poster, format="PNG", optimize=True)

    durations = frame_durations(manifest, len(parsed.states))
    with tempfile.TemporaryDirectory(prefix="ai-history-game-frames-") as temp_name:
        concat_path = _write_concat_manifest(Path(temp_name), manifest, parsed, durations)
        encode_concat(manifest, concat_path, output)


def process_manifest(manifest_path: Path, *, check_only: bool) -> dict[str, Any]:
    manifest = read_json(manifest_path)
    parsed = parse_record(manifest_path, manifest)
    if not check_only:
        render_video(manifest, parsed)
    probe = validate_video_output(manifest)
    return {
        "id": manifest["id"],
        "moves": len(parsed.canonical_moves),
        "mainLineSha256": parsed.digest,
        "video": manifest["render"]["videoPath"],
        "bytes": int(probe["format"]["size"]),
        "duration": float(probe["format"]["duration"]),
    }
