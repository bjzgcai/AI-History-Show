"""Game-record models, parsers, verification, and replay pacing."""

from __future__ import annotations

import hashlib
import json
import re
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


DRAUGHTS_MOVE_PATTERN = re.compile(r"\b(?:[1-9]|[12][0-9]|3[0-2])(?:[-x](?:[1-9]|[12][0-9]|3[0-2]))+\b")


def _draughts_coord(square: int) -> tuple[int, int]:
    if not 1 <= square <= 32:
        raise GameRecordError(f"Draughts square must be between 1 and 32: {square}")
    row, offset = divmod(square - 1, 4)
    return offset * 2 + (1 if row % 2 == 0 else 0), row


def _draughts_square(x: int, y: int) -> int | None:
    if not (0 <= x < 8 and 0 <= y < 8) or (x + y) % 2 == 0:
        return None
    offset = (x - (1 if y % 2 == 0 else 0)) // 2
    return y * 4 + offset + 1


def _draughts_directions(player: int, king: bool) -> tuple[tuple[int, int], ...]:
    if king:
        return ((-1, -1), (1, -1), (-1, 1), (1, 1))
    step = 1 if player == 1 else -1
    return ((-1, step), (1, step))


def _draughts_capture_destinations(
    board: dict[int, tuple[int, bool]], square: int
) -> list[tuple[int, int]]:
    player, king = board[square]
    x, y = _draughts_coord(square)
    captures: list[tuple[int, int]] = []
    for dx, dy in _draughts_directions(player, king):
        jumped = _draughts_square(x + dx, y + dy)
        destination = _draughts_square(x + 2 * dx, y + 2 * dy)
        if jumped is None or destination is None or destination in board:
            continue
        jumped_piece = board.get(jumped)
        if jumped_piece is not None and jumped_piece[0] != player:
            captures.append((destination, jumped))
    return captures


def _has_draughts_capture(board: dict[int, tuple[int, bool]], player: int) -> bool:
    return any(
        _draughts_capture_destinations(board, square)
        for square, piece in board.items()
        if piece[0] == player
    )


def _draughts_snapshot(board: dict[int, tuple[int, bool]]) -> tuple[tuple[int, ...], ...]:
    grid = [[0 for _ in range(8)] for _ in range(8)]
    for square, (player, king) in board.items():
        x, y = _draughts_coord(square)
        grid[y][x] = player + (2 if king else 0)
    return _freeze_grid(grid)


def _draughts_score(board: dict[int, tuple[int, bool]]) -> str:
    black = sum(piece[0] == 1 for piece in board.values())
    white = sum(piece[0] == 2 for piece in board.values())
    return f"Black {black} | White {white}"


def _draughts_promoted(player: int, square: int) -> bool:
    _, row = _draughts_coord(square)
    return (player == 1 and row == 7) or (player == 2 and row == 0)


def _strip_pdn_variations(text: str) -> str:
    previous = None
    while previous != text:
        previous = text
        text = re.sub(r"\([^()]*\)", " ", text)
    if "(" in text or ")" in text:
        raise GameRecordError("Cannot parse unbalanced PDN variations.")
    return text


def parse_draughts(path: Path) -> ParsedGame:
    text = path.read_text(encoding="utf-8-sig")
    text = re.sub(r"^\s*\[[^\]]*\]\s*$", " ", text, flags=re.MULTILINE)
    text = re.sub(r"\{.*?\}", " ", text, flags=re.DOTALL)
    text = re.sub(r";[^\n]*", " ", text)
    text = _strip_pdn_variations(text)
    text = re.sub(r"(?<!\S)(?:1/2-1/2|1-0|0-1|\*)(?!\S)", " ", text)
    moves = [match.group(0) for match in DRAUGHTS_MOVE_PATTERN.finditer(text)]
    if not moves:
        raise GameRecordError(f"PDN contains no moves: {path}")

    board: dict[int, tuple[int, bool]] = {
        **{square: (1, False) for square in range(1, 13)},
        **{square: (2, False) for square in range(21, 33)},
    }
    player = 1
    states = [GameState(_draughts_snapshot(board), 0, "Initial position", "", _draughts_score(board))]

    for number, token in enumerate(moves, start=1):
        squares = [int(value) for value in re.split(r"[-x]", token)]
        start = squares[0]
        piece = board.get(start)
        if piece is None or piece[0] != player:
            raise GameRecordError(f"Draughts move {number} starts from the wrong piece: {token}")

        capture_required = _has_draughts_capture(board, player)
        current = start
        _, king = piece
        del board[start]
        crowned_during_move = False
        captured = False

        for segment, destination in enumerate(squares[1:], start=1):
            if destination in board:
                raise GameRecordError(f"Draughts move {number} lands on an occupied square: {token}")
            x0, y0 = _draughts_coord(current)
            x1, y1 = _draughts_coord(destination)
            dx, dy = x1 - x0, y1 - y0
            allowed_directions = _draughts_directions(player, king)

            # Historical Tinsley PDNs sometimes use "x" for adjacent steps, so geometry is authoritative.
            if abs(dx) == 1 and abs(dy) == 1:
                if len(squares) != 2 or (dx, dy) not in allowed_directions or capture_required:
                    raise GameRecordError(f"Illegal Draughts step at move {number}: {token}")
            elif abs(dx) == 2 and abs(dy) == 2:
                direction = (dx // 2, dy // 2) if abs(dx) == 2 and abs(dy) == 2 else None
                if direction not in allowed_directions:
                    raise GameRecordError(f"Illegal Draughts jump at move {number}: {token}")
                jumped = _draughts_square(x0 + direction[0], y0 + direction[1])
                jumped_piece = board.get(jumped) if jumped is not None else None
                if jumped_piece is None or jumped_piece[0] == player:
                    raise GameRecordError(f"Draughts move {number} jumps no opponent: {token}")
                del board[jumped]
                captured = True
            else:
                raise GameRecordError(f"Illegal Draughts geometry at move {number}: {token}")

            current = destination
            if not king and _draughts_promoted(player, current):
                king = True
                crowned_during_move = True
                if captured and segment != len(squares) - 1:
                    raise GameRecordError(f"Draughts move {number} continues after crowning: {token}")

        board[current] = (player, king)
        if capture_required and not captured:
            raise GameRecordError(f"Draughts move {number} ignores a mandatory capture: {token}")
        if captured and not crowned_during_move and _draughts_capture_destinations(board, current):
            raise GameRecordError(f"Draughts move {number} stops before a required continuation: {token}")

        side = "Black" if player == 1 else "White"
        x, y = _draughts_coord(current)
        states.append(
            GameState(
                _draughts_snapshot(board),
                number,
                token,
                side,
                _draughts_score(board),
                (x, y),
            )
        )
        player = 3 - player

    return ParsedGame(states, moves)


PARSERS: dict[str, Callable[[Path], ParsedGame]] = {
    "chess": parse_chess,
    "reversi": parse_reversi,
    "go": parse_go,
    "draughts": parse_draughts,
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
    poster_move = int(manifest["render"]["posterMove"])
    if poster_move < 0 or poster_move >= len(parsed.states):
        raise GameRecordError(
            f"posterMove out of range for {manifest['id']}: expected 0-{len(parsed.states) - 1}, got {poster_move}"
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
