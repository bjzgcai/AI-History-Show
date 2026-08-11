#!/usr/bin/env python3
"""Render a verified Archive game record as an original board-evolution MP4."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import shutil
import subprocess
import sys
import tempfile
import textwrap
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[2]
MANIFEST_GLOB = "archive/events/*/game-records/game-record.json"


class GameRecordError(RuntimeError):
    """Raised when a curated record cannot be parsed or verified."""


@dataclass(frozen=True)
class GameState:
    board: Any
    move_number: int
    move_label: str
    side_label: str
    score_label: str = ""
    last_point: tuple[int, int] | None = None


@dataclass(frozen=True)
class ParsedGame:
    states: list[GameState]
    canonical_moves: list[str]

    @property
    def digest(self) -> str:
        return hashlib.sha256("\n".join(self.canonical_moves).encode("utf-8")).hexdigest()


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise GameRecordError(f"Cannot read manifest {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise GameRecordError(f"Manifest must contain an object: {path}")
    return value


def localized(value: Any, language: str = "en") -> str:
    if isinstance(value, str):
        return value
    if not isinstance(value, dict):
        return ""
    return str(value.get(language) or value.get("en") or value.get("zh") or "")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def record_path(manifest_path: Path, manifest: dict[str, Any]) -> Path:
    raw_path = str(manifest.get("record", {}).get("path", ""))
    candidate = (manifest_path.parent / raw_path).resolve()
    try:
        candidate.relative_to(manifest_path.parent.resolve())
    except ValueError as exc:
        raise GameRecordError(f"Record path escapes its game-records directory: {raw_path}") from exc
    return candidate


def _import_chess():
    try:
        import chess  # type: ignore
        import chess.pgn  # type: ignore
    except ImportError as exc:
        raise GameRecordError(
            "Chess rendering requires the chess package. Install requirements-game-video.txt."
        ) from exc
    return chess, chess.pgn


def parse_chess(path: Path) -> ParsedGame:
    chess, chess_pgn = _import_chess()
    with path.open("r", encoding="utf-8-sig") as handle:
        game = chess_pgn.read_game(handle)
    if game is None:
        raise GameRecordError(f"PGN contains no game: {path}")
    if game.errors:
        raise GameRecordError(f"PGN parser reported errors: {game.errors}")

    board = game.board()
    states = [GameState(_chess_snapshot(board, chess), 0, "Initial position", "")]
    canonical: list[str] = []
    for number, move in enumerate(game.mainline_moves(), start=1):
        san = board.san(move)
        side = "White" if board.turn == chess.WHITE else "Black"
        canonical.append(move.uci())
        board.push(move)
        states.append(
            GameState(
                _chess_snapshot(board, chess),
                number,
                san,
                side,
                last_point=(chess.square_file(move.to_square), chess.square_rank(move.to_square)),
            )
        )
    return ParsedGame(states, canonical)


def _chess_snapshot(board: Any, chess: Any) -> dict[str, tuple[str, str]]:
    snapshot: dict[str, tuple[str, str]] = {}
    for square, piece in board.piece_map().items():
        snapshot[chess.square_name(square)] = (
            "white" if piece.color == chess.WHITE else "black",
            piece.symbol().upper(),
        )
    return snapshot


REVERSI_DIRECTIONS = [
    (-1, -1),
    (0, -1),
    (1, -1),
    (-1, 0),
    (1, 0),
    (-1, 1),
    (0, 1),
    (1, 1),
]


def _reversi_flips(board: list[list[int]], x: int, y: int, player: int) -> list[tuple[int, int]]:
    if board[y][x] != 0:
        return []
    opponent = 3 - player
    flips: list[tuple[int, int]] = []
    for dx, dy in REVERSI_DIRECTIONS:
        line: list[tuple[int, int]] = []
        nx, ny = x + dx, y + dy
        while 0 <= nx < 8 and 0 <= ny < 8 and board[ny][nx] == opponent:
            line.append((nx, ny))
            nx += dx
            ny += dy
        if line and 0 <= nx < 8 and 0 <= ny < 8 and board[ny][nx] == player:
            flips.extend(line)
    return flips


def _has_reversi_move(board: list[list[int]], player: int) -> bool:
    return any(_reversi_flips(board, x, y, player) for y in range(8) for x in range(8))


def _freeze_grid(board: list[list[Any]]) -> tuple[tuple[Any, ...], ...]:
    return tuple(tuple(row) for row in board)


def _reversi_score(board: list[list[int]]) -> str:
    black = sum(cell == 1 for row in board for cell in row)
    white = sum(cell == 2 for row in board for cell in row)
    return f"Black {black} | White {white}"


def parse_reversi(path: Path) -> ParsedGame:
    moves = path.read_text(encoding="utf-8-sig").lower().split()
    board = [[0 for _ in range(8)] for _ in range(8)]
    board[3][3] = 2
    board[3][4] = 1
    board[4][3] = 1
    board[4][4] = 2
    player = 1
    states = [GameState(_freeze_grid(board), 0, "Initial position", "", _reversi_score(board))]

    for number, token in enumerate(moves, start=1):
        if len(token) != 2 or token[0] not in "abcdefgh" or token[1] not in "12345678":
            raise GameRecordError(f"Invalid Reversi coordinate at move {number}: {token!r}")
        x = ord(token[0]) - ord("a")
        y = int(token[1]) - 1
        flips = _reversi_flips(board, x, y, player)
        if not flips:
            raise GameRecordError(f"Illegal Reversi move {number}: {token}")
        board[y][x] = player
        for fx, fy in flips:
            board[fy][fx] = player
        side = "Black" if player == 1 else "White"
        states.append(GameState(_freeze_grid(board), number, token.upper(), side, _reversi_score(board), (x, y)))
        opponent = 3 - player
        if _has_reversi_move(board, opponent):
            player = opponent
        elif not _has_reversi_move(board, player) and number != len(moves):
            raise GameRecordError(f"Reversi game ended before recorded move {number + 1}")

    return ParsedGame(states, moves)


def _import_sgfmill():
    try:
        from sgfmill import boards, sgf  # type: ignore
    except ImportError as exc:
        raise GameRecordError("Go rendering requires sgfmill. Install requirements-game-video.txt.") from exc
    return boards, sgf


def _sgf_raw_point(move: tuple[int, int] | None, size: int) -> str:
    if move is None:
        return "pass"
    row, col = move
    letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if size > len(letters):
        raise GameRecordError(f"Unsupported SGF board size: {size}")
    return f"{letters[col]}{letters[size - row - 1]}"


def parse_go(path: Path) -> ParsedGame:
    boards, sgf = _import_sgfmill()
    try:
        game = sgf.Sgf_game.from_bytes(path.read_bytes())
    except Exception as exc:
        raise GameRecordError(f"Cannot parse SGF {path}: {exc}") from exc
    size = game.get_size()
    board = boards.Board(size)
    states = [GameState(_go_snapshot(board, size), 0, "Initial position", "")]
    canonical: list[str] = []

    for node in game.get_main_sequence():
        color, move = node.get_move()
        if color is None:
            continue
        canonical.append(f"{color}:{'pass' if move is None else f'{move[0]},{move[1]}'}")
        if move is not None:
            row, col = move
            try:
                board.play(row, col, color)
            except ValueError as exc:
                raise GameRecordError(f"Illegal SGF move {len(canonical)}: {color}[{_sgf_raw_point(move, size)}]") from exc
            last_point = (col, size - row - 1)
        else:
            last_point = None
        states.append(
            GameState(
                _go_snapshot(board, size),
                len(canonical),
                _sgf_raw_point(move, size).upper(),
                "Black" if color == "b" else "White",
                last_point=last_point,
            )
        )
    return ParsedGame(states, canonical)


def _go_snapshot(board: Any, size: int) -> tuple[tuple[int, ...], ...]:
    values = {None: 0, "b": 1, "w": 2}
    return tuple(tuple(values[board.get(row, col)] for col in range(size)) for row in range(size - 1, -1, -1))


def parse_record(manifest_path: Path, manifest: dict[str, Any]) -> ParsedGame:
    path = record_path(manifest_path, manifest)
    if not path.is_file():
        raise GameRecordError(f"Record file does not exist: {path}")
    expected_file_hash = str(manifest["record"]["sha256"])
    actual_file_hash = sha256_file(path)
    if expected_file_hash != actual_file_hash:
        raise GameRecordError(f"Record SHA-256 mismatch for {path}: expected {expected_file_hash}, got {actual_file_hash}")

    parsers = {"chess": parse_chess, "reversi": parse_reversi, "go": parse_go}
    game_type = str(manifest.get("gameType", ""))
    if game_type not in parsers:
        raise GameRecordError(f"Unsupported game type: {game_type}")
    parsed = parsers[game_type](path)
    expected_moves = int(manifest["record"]["moveCount"])
    if len(parsed.canonical_moves) != expected_moves:
        raise GameRecordError(
            f"Move count mismatch for {manifest['id']}: expected {expected_moves}, got {len(parsed.canonical_moves)}"
        )
    expected_digest = str(manifest["verification"]["mainLineSha256"])
    if parsed.digest != expected_digest:
        raise GameRecordError(
            f"Main-line SHA-256 mismatch for {manifest['id']}: expected {expected_digest}, got {parsed.digest}"
        )
    return parsed


def load_font(size: int, bold: bool = False):
    try:
        from PIL import ImageFont
    except ImportError as exc:
        raise GameRecordError("Rendering requires Pillow. Install requirements-game-video.txt.") from exc
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _rounded_panel(draw: Any, box: tuple[int, int, int, int], fill: tuple[int, int, int], outline: tuple[int, int, int]):
    draw.rounded_rectangle(box, radius=8, fill=fill, outline=outline, width=2)


def _draw_wrapped(draw: Any, text: str, position: tuple[int, int], font: Any, fill: tuple[int, int, int], width: int, spacing: int = 6) -> int:
    average = max(8, int(font.size * 0.56))
    lines = textwrap.wrap(text, width=max(8, width // average), break_long_words=False)
    y = position[1]
    for line in lines:
        draw.text((position[0], y), line, font=font, fill=fill)
        y += font.size + spacing
    return y


def _draw_chess(draw: Any, state: GameState, box: tuple[int, int, int, int]) -> None:
    x0, y0, x1, y1 = box
    cell = (x1 - x0) // 8
    piece_font = load_font(max(22, int(cell * 0.42)), bold=True)
    coord_font = load_font(13, bold=True)
    light = (224, 211, 181)
    dark = (88, 112, 92)
    for row in range(8):
        rank = 8 - row
        for col in range(8):
            x = x0 + col * cell
            y = y0 + row * cell
            square_color = light if (row + col) % 2 == 0 else dark
            draw.rectangle((x, y, x + cell, y + cell), fill=square_color)
            board_rank = rank - 1
            if state.last_point == (col, board_rank):
                draw.rectangle((x + 3, y + 3, x + cell - 3, y + cell - 3), outline=(240, 184, 70), width=5)
            square = f"{chr(ord('a') + col)}{rank}"
            piece = state.board.get(square)
            if piece:
                color, letter = piece
                radius = cell * 0.34
                cx, cy = x + cell / 2, y + cell / 2
                if color == "white":
                    fill, outline, text_fill = (245, 241, 228), (63, 62, 58), (28, 28, 27)
                else:
                    fill, outline, text_fill = (35, 37, 36), (234, 225, 204), (250, 246, 235)
                draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=fill, outline=outline, width=2)
                bbox = draw.textbbox((0, 0), letter, font=piece_font)
                draw.text((cx - (bbox[2] - bbox[0]) / 2, cy - (bbox[3] - bbox[1]) / 2 - 2), letter, font=piece_font, fill=text_fill)
        draw.text((x0 - 22, y0 + row * cell + cell / 2 - 7), str(rank), font=coord_font, fill=(154, 164, 160))
    for col in range(8):
        draw.text((x0 + col * cell + cell / 2 - 4, y1 + 8), chr(ord("A") + col), font=coord_font, fill=(154, 164, 160))


def _draw_reversi(draw: Any, state: GameState, box: tuple[int, int, int, int]) -> None:
    x0, y0, x1, y1 = box
    cell = (x1 - x0) // 8
    coord_font = load_font(13, bold=True)
    for row in range(8):
        for col in range(8):
            x = x0 + col * cell
            y = y0 + row * cell
            draw.rectangle((x, y, x + cell, y + cell), fill=(38, 123, 87), outline=(18, 75, 53), width=2)
            value = state.board[row][col]
            if value:
                margin = cell * 0.14
                if value == 1:
                    fill, outline = (25, 28, 27), (4, 8, 7)
                else:
                    fill, outline = (241, 238, 224), (112, 111, 102)
                draw.ellipse((x + margin, y + margin, x + cell - margin, y + cell - margin), fill=fill, outline=outline, width=2)
            if state.last_point == (col, row):
                draw.rectangle((x + 3, y + 3, x + cell - 3, y + cell - 3), outline=(250, 190, 61), width=5)
        draw.text((x0 - 22, y0 + row * cell + cell / 2 - 7), str(row + 1), font=coord_font, fill=(154, 164, 160))
    for col in range(8):
        draw.text((x0 + col * cell + cell / 2 - 4, y1 + 8), chr(ord("A") + col), font=coord_font, fill=(154, 164, 160))


def _star_points(size: int) -> Iterable[tuple[int, int]]:
    if size == 19:
        coords = (3, 9, 15)
    elif size == 13:
        coords = (3, 6, 9)
    elif size == 9:
        coords = (2, 4, 6)
    else:
        return []
    return ((x, y) for x in coords for y in coords)


def _draw_go(draw: Any, state: GameState, box: tuple[int, int, int, int]) -> None:
    x0, y0, x1, y1 = box
    size = len(state.board)
    pad = 24
    left, top, right, bottom = x0 + pad, y0 + pad, x1 - pad, y1 - pad
    cell = (right - left) / (size - 1)
    draw.rounded_rectangle((x0, y0, x1, y1), radius=8, fill=(194, 145, 83), outline=(93, 61, 33), width=3)
    for index in range(size):
        pos = left + index * cell
        draw.line((left, top + index * cell, right, top + index * cell), fill=(63, 42, 25), width=2)
        draw.line((pos, top, pos, bottom), fill=(63, 42, 25), width=2)
    for sx, sy in _star_points(size):
        cx, cy = left + sx * cell, top + sy * cell
        draw.ellipse((cx - 4, cy - 4, cx + 4, cy + 4), fill=(45, 30, 18))
    radius = cell * 0.43
    for row, values in enumerate(state.board):
        for col, value in enumerate(values):
            if not value:
                continue
            cx, cy = left + col * cell, top + row * cell
            if value == 1:
                fill, outline = (18, 19, 18), (0, 0, 0)
            else:
                fill, outline = (241, 237, 222), (108, 104, 92)
            draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=fill, outline=outline, width=2)
    if state.last_point is not None:
        col, row = state.last_point
        cx, cy = left + col * cell, top + row * cell
        ring = radius + 4
        draw.ellipse((cx - ring, cy - ring, cx + ring, cy + ring), outline=(244, 145, 43), width=4)


def draw_frame(manifest: dict[str, Any], state: GameState, total_moves: int):
    try:
        from PIL import Image, ImageDraw
    except ImportError as exc:
        raise GameRecordError("Rendering requires Pillow. Install requirements-game-video.txt.") from exc

    width = int(manifest["render"]["width"])
    height = int(manifest["render"]["height"])
    image = Image.new("RGB", (width, height), (18, 24, 27))
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, width, 8), fill=(214, 77, 57))

    board_box = (62, 58, 650, 646)
    _rounded_panel(draw, (40, 36, 675, 682), (28, 35, 38), (65, 78, 80))
    game_type = manifest["gameType"]
    if game_type == "chess":
        _draw_chess(draw, state, board_box)
    elif game_type == "reversi":
        _draw_reversi(draw, state, board_box)
    else:
        _draw_go(draw, state, board_box)

    panel = (710, 36, width - 40, 682)
    _rounded_panel(draw, panel, (238, 235, 224), (92, 99, 96))
    kicker_font = load_font(17, bold=True)
    title_font = load_font(34, bold=True)
    body_font = load_font(21)
    body_bold = load_font(22, bold=True)
    small_font = load_font(16)
    draw.text((744, 70), "VERIFIED GAME RECORD", font=kicker_font, fill=(176, 57, 43))
    y = _draw_wrapped(draw, localized(manifest["title"], "en"), (744, 108), title_font, (24, 31, 34), 430, 8)

    players = manifest["players"]
    y += 24
    for player in players:
        side = str(player["side"]).upper()
        draw.text((744, y), side, font=small_font, fill=(97, 105, 104))
        draw.text((850, y - 4), localized(player["name"], "en"), font=body_bold, fill=(25, 33, 35))
        y += 38

    y += 16
    draw.line((744, y, 1168, y), fill=(177, 180, 173), width=2)
    y += 24
    move_heading = "START" if state.move_number == 0 else f"MOVE {state.move_number:03d} / {total_moves:03d}"
    draw.text((744, y), move_heading, font=kicker_font, fill=(176, 57, 43))
    y += 34
    move_text = state.move_label if not state.side_label else f"{state.side_label}: {state.move_label}"
    draw.text((744, y), move_text, font=body_bold, fill=(25, 33, 35))
    y += 42
    if state.score_label:
        draw.text((744, y), state.score_label, font=body_font, fill=(55, 67, 69))
        y += 40

    progress = state.move_number / max(1, total_moves)
    draw.rounded_rectangle((744, y, 1168, y + 12), radius=6, fill=(195, 198, 190))
    draw.rounded_rectangle((744, y, 744 + int(424 * progress), y + 12), radius=6, fill=(214, 77, 57))
    y += 42
    result_y = max(y, 510)
    draw.text((744, result_y), "RESULT", font=small_font, fill=(97, 105, 104))
    _draw_wrapped(draw, localized(manifest["result"], "en"), (744, result_y + 28), body_font, (25, 33, 35), 425, 6)

    source_count = int(manifest["verification"]["matchedRecordSources"])
    draw.text((744, 642), f"{source_count} RECORD SOURCES MATCHED  |  ORIGINAL BOARD REDRAW", font=small_font, fill=(89, 96, 94))
    return image


def _ffconcat_escape(path: Path) -> str:
    return str(path).replace("'", "'\\''")


def render_video(manifest: dict[str, Any], parsed: ParsedGame) -> None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise GameRecordError("ffmpeg is required to generate MP4 output.")

    output = ROOT / manifest["render"]["videoPath"]
    poster = ROOT / manifest["render"]["posterPath"]
    output.parent.mkdir(parents=True, exist_ok=True)
    poster.parent.mkdir(parents=True, exist_ok=True)
    total_moves = len(parsed.canonical_moves)
    poster_index = min(len(parsed.states) - 1, int(manifest["render"]["posterMove"]))
    draw_frame(manifest, parsed.states[poster_index], total_moves).save(poster, format="PNG", optimize=True)

    duration = float(manifest["render"]["durationSeconds"])
    weights = [1.0 for _ in parsed.states]
    weights[0] = 1.8
    weights[-1] = 3.0
    unit = duration / sum(weights)

    with tempfile.TemporaryDirectory(prefix="ai-history-game-frames-") as temp_name:
        temp_dir = Path(temp_name)
        concat_lines = ["ffconcat version 1.0"]
        for index, (state, weight) in enumerate(zip(parsed.states, weights, strict=True)):
            frame_path = temp_dir / f"frame-{index:04d}.png"
            draw_frame(manifest, state, total_moves).save(frame_path, format="PNG", optimize=True)
            concat_lines.append(f"file '{_ffconcat_escape(frame_path)}'")
            concat_lines.append(f"duration {unit * weight:.9f}")
        concat_lines.append(f"file '{_ffconcat_escape(frame_path)}'")
        concat_path = temp_dir / "frames.ffconcat"
        concat_path.write_text("\n".join(concat_lines) + "\n", encoding="utf-8")

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
    return probe


def process_manifest(manifest_path: Path, *, check_only: bool) -> dict[str, Any]:
    manifest = read_json(manifest_path)
    parsed = parse_record(manifest_path, manifest)
    if not check_only:
        render_video(manifest, parsed)
    probe = validate_outputs(manifest)
    result = {
        "id": manifest["id"],
        "moves": len(parsed.canonical_moves),
        "mainLineSha256": parsed.digest,
        "video": manifest["render"]["videoPath"],
        "bytes": int(probe["format"]["size"]),
        "duration": float(probe["format"]["duration"]),
    }
    print(json.dumps(result, ensure_ascii=False))
    return result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifests", nargs="*", help="game-record.json paths; defaults to all Archive manifests")
    parser.add_argument("--check", action="store_true", help="validate records and existing outputs without rendering")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    paths = [Path(item).resolve() for item in args.manifests]
    if not paths:
        paths = sorted(ROOT.glob(MANIFEST_GLOB))
    if not paths:
        print("No game-record manifests found.", file=sys.stderr)
        return 1
    try:
        for path in paths:
            process_manifest(path, check_only=args.check)
    except (GameRecordError, OSError, KeyError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
