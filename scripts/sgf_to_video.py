#!/usr/bin/env python3
"""Render a Go SGF main line into a fast board-evolution video.

The script intentionally keeps parsing and rendering in this file so it can be
reused from CI, a content pipeline, or a one-off curator workflow:

    python scripts/sgf_to_video.py examples/sgf/sample-go-game.sgf \
        resources/videos/game-evolution/sample-go-game.mp4 --duration 60 --fps 30

MP4 writing uses OpenCV when available. Animated GIF output is also supported
through Pillow, which is useful for quick local checks on machines without a
video encoder.
"""

from __future__ import annotations

import argparse
import math
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator


class SGFParseError(ValueError):
    """Raised when an SGF file cannot be parsed into a legal main line."""


@dataclass(frozen=True)
class Move:
    """One SGF move in zero-based board coordinates."""

    number: int
    color: int
    point: tuple[int, int] | None
    raw: str


@dataclass(frozen=True)
class BoardState:
    """A board snapshot after a move has been applied."""

    board: tuple[tuple[int, ...], ...]
    last_move: Move | None
    captures: int


def _skip_space(text: str, index: int) -> int:
    while index < len(text) and text[index].isspace():
        index += 1
    return index


def _read_property_values(text: str, index: int) -> tuple[list[str], int]:
    values: list[str] = []

    while True:
        index = _skip_space(text, index)
        if index >= len(text) or text[index] != "[":
            break

        index += 1
        chars: list[str] = []
        escaped = False
        while index < len(text):
            char = text[index]
            index += 1

            if escaped:
                if char in "\r\n":
                    # SGF line continuation: backslash-newline disappears.
                    if char == "\r" and index < len(text) and text[index] == "\n":
                        index += 1
                else:
                    chars.append(char)
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == "]":
                values.append("".join(chars))
                break
            else:
                chars.append(char)
        else:
            raise SGFParseError("Unterminated SGF property value.")

    return values, index


def _parse_node(text: str, index: int) -> tuple[dict[str, list[str]], int]:
    props: dict[str, list[str]] = {}

    while index < len(text):
        index = _skip_space(text, index)
        if index >= len(text) or text[index] in ";()":
            break

        if not text[index].isalpha():
            raise SGFParseError(f"Unexpected SGF token {text[index]!r} near byte {index}.")

        start = index
        while index < len(text) and text[index].isalpha():
            index += 1
        ident = text[start:index].upper()
        values, index = _read_property_values(text, index)
        if not values:
            raise SGFParseError(f"SGF property {ident!r} has no value.")
        props.setdefault(ident, []).extend(values)

    return props, index


def parse_sgf_main_line(text: str) -> list[dict[str, list[str]]]:
    """Return nodes in the first SGF game tree up to the first variation."""

    if not text or not text.strip():
        raise SGFParseError("SGF file is empty.")

    index = text.find("(")
    if index < 0:
        raise SGFParseError("SGF game tree must start with '('.")
    index += 1

    nodes: list[dict[str, list[str]]] = []
    while index < len(text):
        index = _skip_space(text, index)
        if index >= len(text):
            break

        char = text[index]
        if char == ";":
            node, index = _parse_node(text, index + 1)
            nodes.append(node)
        elif char == "(":
            # Variations can be interesting interactively, but the exhibition
            # clip needs a deterministic main-line animation.
            break
        elif char == ")":
            break
        else:
            index += 1

    if not nodes:
        raise SGFParseError("SGF contains no nodes.")
    return nodes


def _parse_board_size(root: dict[str, list[str]]) -> int:
    raw = (root.get("SZ") or ["19"])[0].strip()
    primary = raw.split(":", 1)[0]
    try:
        size = int(primary)
    except ValueError as exc:
        raise SGFParseError(f"Invalid board size SZ[{raw}].") from exc

    if size < 2 or size > 52:
        raise SGFParseError(f"Unsupported board size {size}; expected 2..52.")
    return size


def _coord_index(char: str) -> int:
    if "a" <= char <= "z":
        return ord(char) - ord("a")
    if "A" <= char <= "Z":
        return 26 + ord(char) - ord("A")
    raise SGFParseError(f"Invalid SGF coordinate character {char!r}.")


def _parse_point(value: str, board_size: int) -> tuple[int, int] | None:
    if value == "":
        return None
    if len(value) < 2:
        raise SGFParseError(f"Invalid move coordinate {value!r}.")

    x = _coord_index(value[0])
    y = _coord_index(value[1])
    if x >= board_size or y >= board_size:
        raise SGFParseError(f"Move {value!r} is outside a {board_size}x{board_size} board.")
    return x, y


def extract_game(text: str) -> tuple[int, list[Move]]:
    """Parse board size and B/W move sequence from an SGF string."""

    nodes = parse_sgf_main_line(text)
    board_size = _parse_board_size(nodes[0])
    moves: list[Move] = []

    for node in nodes:
        move_props = [color for color in ("B", "W") if color in node]
        if not move_props:
            continue
        if len(move_props) > 1:
            raise SGFParseError("A node contains both B and W moves.")

        color_name = move_props[0]
        raw = node[color_name][0]
        moves.append(
            Move(
                number=len(moves) + 1,
                color=1 if color_name == "B" else 2,
                point=_parse_point(raw, board_size),
                raw=raw,
            )
        )

    if not moves:
        raise SGFParseError("SGF contains no B/W moves.")
    return board_size, moves


def _neighbors(x: int, y: int, size: int) -> Iterator[tuple[int, int]]:
    if x > 0:
        yield x - 1, y
    if x + 1 < size:
        yield x + 1, y
    if y > 0:
        yield x, y - 1
    if y + 1 < size:
        yield x, y + 1


def _group_and_liberties(board: list[list[int]], x: int, y: int) -> tuple[set[tuple[int, int]], bool]:
    color = board[y][x]
    group: set[tuple[int, int]] = set()
    stack = [(x, y)]
    has_liberty = False

    while stack:
        point = stack.pop()
        if point in group:
            continue
        group.add(point)
        px, py = point

        for nx, ny in _neighbors(px, py, len(board)):
            if board[ny][nx] == 0:
                has_liberty = True
            elif board[ny][nx] == color and (nx, ny) not in group:
                stack.append((nx, ny))

    return group, has_liberty


def _freeze_board(board: list[list[int]]) -> tuple[tuple[int, ...], ...]:
    return tuple(tuple(row) for row in board)


def build_board_states(board_size: int, moves: Iterable[Move]) -> list[BoardState]:
    """Apply moves and captures, returning the initial state plus all steps."""

    board = [[0 for _ in range(board_size)] for _ in range(board_size)]
    states = [BoardState(_freeze_board(board), None, 0)]

    for move in moves:
        captures = 0
        if move.point is not None:
            x, y = move.point
            if board[y][x] != 0:
                raise SGFParseError(f"Move {move.number} tries to play on an occupied point {move.raw!r}.")

            board[y][x] = move.color
            opponent = 3 - move.color
            checked: set[tuple[int, int]] = set()
            for nx, ny in _neighbors(x, y, board_size):
                if board[ny][nx] != opponent or (nx, ny) in checked:
                    continue
                group, has_liberty = _group_and_liberties(board, nx, ny)
                checked.update(group)
                if not has_liberty:
                    captures += len(group)
                    for gx, gy in group:
                        board[gy][gx] = 0

            own_group, own_has_liberty = _group_and_liberties(board, x, y)
            if not own_has_liberty:
                raise SGFParseError(f"Move {move.number} is suicide or has an invalid capture sequence.")

        states.append(BoardState(_freeze_board(board), move, captures))

    return states


def _star_points(size: int) -> list[tuple[int, int]]:
    if size == 19:
        coords = [3, 9, 15]
    elif size == 13:
        coords = [3, 6, 9]
    elif size == 9:
        coords = [2, 4, 6]
    elif size >= 15:
        coords = [3, size // 2, size - 4]
    else:
        return []
    return [(x, y) for x in coords for y in coords]


def _load_font(size: int):
    try:
        from PIL import ImageFont
    except ImportError as exc:
        raise RuntimeError(
            "Rendering requires Pillow. Install dependencies with: "
            "python -m pip install -r requirements-game-video.txt"
        ) from exc

    for name in ("arial.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_board_state(
    state: BoardState,
    board_size: int,
    canvas_size: int = 960,
    title: str | None = None,
) -> "Image.Image":
    """Draw a single board state as a Pillow RGB image."""

    try:
        from PIL import Image, ImageDraw
    except ImportError as exc:
        raise RuntimeError(
            "Rendering requires Pillow. Install dependencies with: "
            "python -m pip install -r requirements-game-video.txt"
        ) from exc

    if canvas_size < 320:
        raise ValueError("canvas_size must be at least 320 pixels.")

    image = Image.new("RGB", (canvas_size, canvas_size), (28, 22, 15))
    draw = ImageDraw.Draw(image)

    pad = max(44, int(canvas_size * 0.078))
    board_min = pad
    board_max = canvas_size - pad
    span = board_max - board_min
    cell = span / max(1, board_size - 1)
    stone_radius = max(5, cell * 0.43)

    # Board surface and subtle frame.
    draw.rounded_rectangle(
        (pad // 2, pad // 2, canvas_size - pad // 2, canvas_size - pad // 2),
        radius=18,
        fill=(188, 137, 76),
        outline=(92, 59, 31),
        width=max(2, canvas_size // 240),
    )

    for index in range(board_size):
        pos = board_min + index * cell
        draw.line((board_min, pos, board_max, pos), fill=(70, 45, 26), width=2)
        draw.line((pos, board_min, pos, board_max), fill=(70, 45, 26), width=2)

    star_radius = max(3, int(cell * 0.1))
    for x, y in _star_points(board_size):
        cx = board_min + x * cell
        cy = board_min + y * cell
        draw.ellipse((cx - star_radius, cy - star_radius, cx + star_radius, cy + star_radius), fill=(48, 31, 18))

    for y, row in enumerate(state.board):
        for x, color in enumerate(row):
            if not color:
                continue

            cx = board_min + x * cell
            cy = board_min + y * cell
            box = (cx - stone_radius, cy - stone_radius, cx + stone_radius, cy + stone_radius)
            if color == 1:
                draw.ellipse(box, fill=(16, 16, 15), outline=(0, 0, 0), width=2)
                highlight = (cx - stone_radius * 0.42, cy - stone_radius * 0.52)
                draw.ellipse(
                    (
                        highlight[0] - stone_radius * 0.22,
                        highlight[1] - stone_radius * 0.16,
                        highlight[0] + stone_radius * 0.22,
                        highlight[1] + stone_radius * 0.16,
                    ),
                    fill=(70, 70, 66),
                )
            else:
                draw.ellipse(box, fill=(236, 231, 218), outline=(122, 112, 92), width=2)
                highlight = (cx - stone_radius * 0.28, cy - stone_radius * 0.32)
                draw.ellipse(
                    (
                        highlight[0] - stone_radius * 0.2,
                        highlight[1] - stone_radius * 0.14,
                        highlight[0] + stone_radius * 0.2,
                        highlight[1] + stone_radius * 0.14,
                    ),
                    fill=(255, 255, 248),
                )

    if state.last_move and state.last_move.point is not None:
        x, y = state.last_move.point
        cx = board_min + x * cell
        cy = board_min + y * cell
        ring = stone_radius + max(4, cell * 0.08)
        draw.ellipse((cx - ring, cy - ring, cx + ring, cy + ring), outline=(246, 137, 0), width=max(3, int(cell * 0.08)))

    move_text = "Initial position"
    if state.last_move:
        color_text = "Black" if state.last_move.color == 1 else "White"
        point_text = "pass" if state.last_move.point is None else state.last_move.raw.upper()
        capture_text = f" | captures +{state.captures}" if state.captures else ""
        move_text = f"Move {state.last_move.number:03d} | {color_text} {point_text}{capture_text}"

    title_font = _load_font(max(16, canvas_size // 32))
    meta_font = _load_font(max(13, canvas_size // 46))
    label = title or "SGF game evolution"
    draw.text((pad // 2, 12), label, fill=(250, 237, 213), font=title_font)
    draw.text((pad // 2, canvas_size - pad // 2 + 12), move_text, fill=(255, 196, 87), font=meta_font)

    return image


def _frame_state_index(frame_index: int, total_frames: int, state_count: int) -> int:
    if total_frames <= 1 or state_count <= 1:
        return state_count - 1
    progress = frame_index / (total_frames - 1)
    return min(state_count - 1, int(round(progress * (state_count - 1))))


def iter_frames(
    states: list[BoardState],
    board_size: int,
    total_frames: int,
    canvas_size: int,
    title: str | None,
) -> Iterator["Image.Image"]:
    cached_index = -1
    cached_image = None

    for frame_index in range(total_frames):
        state_index = _frame_state_index(frame_index, total_frames, len(states))
        if state_index != cached_index:
            cached_index = state_index
            cached_image = draw_board_state(states[state_index], board_size, canvas_size, title)
        yield cached_image


def _write_gif(frames: Iterator["Image.Image"], output_path: Path, fps: int) -> None:
    first = next(frames, None)
    if first is None:
        raise RuntimeError("No frames were generated.")

    rest = list(frames)
    first.save(
        output_path,
        save_all=True,
        append_images=rest,
        duration=max(1, round(1000 / fps)),
        loop=0,
        optimize=False,
    )


def _write_with_opencv(
    frames: Iterator["Image.Image"],
    output_path: Path,
    fps: int,
    canvas_size: int,
) -> bool:
    try:
        import cv2  # type: ignore
        import numpy as np
    except ImportError:
        return False

    suffix = output_path.suffix.lower()
    fourcc_name = "mp4v" if suffix in {".mp4", ".m4v", ".mov"} else "MJPG"
    writer = cv2.VideoWriter(
        str(output_path),
        cv2.VideoWriter_fourcc(*fourcc_name),
        fps,
        (canvas_size, canvas_size),
    )
    if not writer.isOpened():
        return False

    try:
        for frame in frames:
            rgb = np.asarray(frame)
            writer.write(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
    finally:
        writer.release()
    return True


def write_video(
    states: list[BoardState],
    board_size: int,
    output_path: Path,
    duration: float,
    fps: int,
    canvas_size: int,
    title: str | None,
) -> None:
    if duration <= 0:
        raise ValueError("duration must be positive.")
    if fps <= 0:
        raise ValueError("fps must be positive.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    total_frames = max(1, int(round(duration * fps)))
    frames = iter_frames(states, board_size, total_frames, canvas_size, title)
    suffix = output_path.suffix.lower()

    if suffix == ".gif":
        _write_gif(frames, output_path, fps)
        return

    if suffix in {".mp4", ".m4v", ".mov", ".avi"}:
        if _write_with_opencv(frames, output_path, fps, canvas_size):
            return
        raise RuntimeError(
            "MP4/AVI output requires a video encoder. Install OpenCV, for example: "
            "python -m pip install pillow numpy opencv-python"
        )

    raise ValueError("Unsupported output extension. Use .mp4, .mov, .avi, or .gif.")


def convert_sgf_to_video(
    sgf_path: str | os.PathLike[str],
    output_path: str | os.PathLike[str],
    duration: float = 60.0,
    fps: int = 30,
    canvas_size: int = 960,
    title: str | None = None,
) -> dict[str, int | float | str]:
    """Convert one SGF file into a board-evolution video.

    Returns a small summary that can be logged by batch pipelines.
    """

    source = Path(sgf_path)
    if not source.exists():
        raise FileNotFoundError(f"SGF file does not exist: {source}")
    if not source.is_file():
        raise FileNotFoundError(f"SGF path is not a file: {source}")

    text = source.read_text(encoding="utf-8-sig")
    board_size, moves = extract_game(text)
    states = build_board_states(board_size, moves)
    destination = Path(output_path)
    write_video(states, board_size, destination, duration, fps, canvas_size, title)

    return {
        "sgf": str(source),
        "output": str(destination),
        "board_size": board_size,
        "moves": len(moves),
        "duration": duration,
        "fps": fps,
    }


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Convert a Go SGF main line into a fast board-evolution clip.")
    parser.add_argument("sgf", help="Input SGF file path.")
    parser.add_argument("output", help="Output video path, preferably .mp4.")
    parser.add_argument("--duration", type=float, default=60.0, help="Target duration in seconds. Default: 60.")
    parser.add_argument("--fps", type=int, default=30, help="Output frames per second. Default: 30.")
    parser.add_argument("--size", type=int, default=960, help="Square canvas size in pixels. Default: 960.")
    parser.add_argument("--title", default=None, help="Optional title rendered above the board.")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(argv)

    try:
        summary = convert_sgf_to_video(
            args.sgf,
            args.output,
            duration=args.duration,
            fps=args.fps,
            canvas_size=args.size,
            title=args.title,
        )
    except FileNotFoundError as exc:
        parser.error(str(exc))
        return 2
    except (SGFParseError, ValueError) as exc:
        parser.error(f"Invalid SGF or options: {exc}")
        return 2
    except RuntimeError as exc:
        parser.error(str(exc))
        return 2

    print(
        "Generated {output} from {moves} moves on a {board_size}x{board_size} board "
        "at {fps} fps for {duration:.1f}s.".format(**summary)
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
