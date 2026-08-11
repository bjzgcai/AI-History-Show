"""Game-record models, parsers, verification, and replay pacing."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable


ROOT = Path(__file__).resolve().parents[2]
MANIFEST_GLOB = "archive/events/*/game-records/game-record.json"


class GameRecordError(RuntimeError):
    """Raised when a curated game record cannot be parsed or verified."""


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
        payload = "\n".join(self.canonical_moves).encode("utf-8")
        return hashlib.sha256(payload).hexdigest()


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
    record_root = manifest_path.parent.resolve()
    candidate = (record_root / raw_path).resolve()
    try:
        candidate.relative_to(record_root)
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


def _chess_snapshot(board: Any, chess: Any) -> dict[str, tuple[str, str]]:
    snapshot: dict[str, tuple[str, str]] = {}
    for square, piece in board.piece_map().items():
        snapshot[chess.square_name(square)] = (
            "white" if piece.color == chess.WHITE else "black",
            piece.symbol().upper(),
        )
    return snapshot


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


REVERSI_DIRECTIONS = (
    (-1, -1),
    (0, -1),
    (1, -1),
    (-1, 0),
    (1, 0),
    (-1, 1),
    (0, 1),
    (1, 1),
)


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


def _go_snapshot(board: Any, size: int) -> tuple[tuple[int, ...], ...]:
    values = {None: 0, "b": 1, "w": 2}
    return tuple(tuple(values[board.get(row, col)] for col in range(size)) for row in range(size - 1, -1, -1))


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


PARSERS: dict[str, Callable[[Path], ParsedGame]] = {
    "chess": parse_chess,
    "reversi": parse_reversi,
    "go": parse_go,
}


def parse_record(manifest_path: Path, manifest: dict[str, Any]) -> ParsedGame:
    path = record_path(manifest_path, manifest)
    if not path.is_file():
        raise GameRecordError(f"Record file does not exist: {path}")
    expected_file_hash = str(manifest["record"]["sha256"])
    actual_file_hash = sha256_file(path)
    if expected_file_hash != actual_file_hash:
        raise GameRecordError(f"Record SHA-256 mismatch for {path}: expected {expected_file_hash}, got {actual_file_hash}")

    game_type = str(manifest.get("gameType", ""))
    parser = PARSERS.get(game_type)
    if parser is None:
        raise GameRecordError(f"Unsupported game type: {game_type}")
    parsed = parser(path)

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


def frame_durations(manifest: dict[str, Any], state_count: int) -> list[float]:
    if state_count < 2:
        raise GameRecordError("A rendered game requires an opening state and a final state.")

    render = manifest["render"]
    total = float(render["durationSeconds"])
    opening_hold = float(render["openingHoldSeconds"])
    end_hold = float(render["endHoldSeconds"])
    highlight_holds: dict[int, float] = {}
    for highlight in render.get("highlights", []):
        move = int(highlight["move"])
        if move <= 0 or move >= state_count - 1:
            raise GameRecordError(f"Highlight move must be before the final move: {move}")
        if move in highlight_holds:
            raise GameRecordError(f"Duplicate highlight move: {move}")
        highlight_holds[move] = float(highlight["holdSeconds"])

    normal_count = state_count - 2 - len(highlight_holds)
    reserved = opening_hold + end_hold + sum(highlight_holds.values())
    if normal_count <= 0 or total <= reserved:
        raise GameRecordError("Configured duration leaves no time for ordinary game states.")
    normal_hold = (total - reserved) / normal_count

    durations = [normal_hold for _ in range(state_count)]
    durations[0] = opening_hold
    durations[-1] = end_hold
    for move, hold in highlight_holds.items():
        durations[move] = hold
    return durations
