"""Pillow frame drawing for verified game-record videos."""

from __future__ import annotations

import textwrap
from typing import Any, Iterable

from game_record_core import GameRecordError, GameState, localized


def load_font(size: int, bold: bool = False):
    try:
        from PIL import ImageFont
    except ImportError as exc:
        raise GameRecordError("Rendering requires Pillow. Install requirements-game-video.txt.") from exc
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _rounded_panel(
    draw: Any,
    box: tuple[int, int, int, int],
    fill: tuple[int, int, int],
    outline: tuple[int, int, int],
) -> None:
    draw.rounded_rectangle(box, radius=8, fill=fill, outline=outline, width=2)


def _draw_wrapped(
    draw: Any,
    text: str,
    position: tuple[int, int],
    font: Any,
    fill: tuple[int, int, int],
    width: int,
    spacing: int = 6,
) -> int:
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
                draw.rectangle(
                    (x + 3, y + 3, x + cell - 3, y + cell - 3),
                    outline=(240, 184, 70),
                    width=5,
                )
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
                draw.ellipse(
                    (cx - radius, cy - radius, cx + radius, cy + radius),
                    fill=fill,
                    outline=outline,
                    width=2,
                )
                bbox = draw.textbbox((0, 0), letter, font=piece_font)
                draw.text(
                    (cx - (bbox[2] - bbox[0]) / 2, cy - (bbox[3] - bbox[1]) / 2 - 2),
                    letter,
                    font=piece_font,
                    fill=text_fill,
                )
        draw.text(
            (x0 - 22, y0 + row * cell + cell / 2 - 7),
            str(rank),
            font=coord_font,
            fill=(154, 164, 160),
        )
    for col in range(8):
        draw.text(
            (x0 + col * cell + cell / 2 - 4, y1 + 8),
            chr(ord("A") + col),
            font=coord_font,
            fill=(154, 164, 160),
        )


def _draw_reversi(draw: Any, state: GameState, box: tuple[int, int, int, int]) -> None:
    x0, y0, x1, y1 = box
    cell = (x1 - x0) // 8
    coord_font = load_font(13, bold=True)
    for row in range(8):
        for col in range(8):
            x = x0 + col * cell
            y = y0 + row * cell
            draw.rectangle(
                (x, y, x + cell, y + cell),
                fill=(38, 123, 87),
                outline=(18, 75, 53),
                width=2,
            )
            value = state.board[row][col]
            if value:
                margin = cell * 0.14
                if value == 1:
                    fill, outline = (25, 28, 27), (4, 8, 7)
                else:
                    fill, outline = (241, 238, 224), (112, 111, 102)
                draw.ellipse(
                    (x + margin, y + margin, x + cell - margin, y + cell - margin),
                    fill=fill,
                    outline=outline,
                    width=2,
                )
            if state.last_point == (col, row):
                draw.rectangle(
                    (x + 3, y + 3, x + cell - 3, y + cell - 3),
                    outline=(250, 190, 61),
                    width=5,
                )
        draw.text(
            (x0 - 22, y0 + row * cell + cell / 2 - 7),
            str(row + 1),
            font=coord_font,
            fill=(154, 164, 160),
        )
    for col in range(8):
        draw.text(
            (x0 + col * cell + cell / 2 - 4, y1 + 8),
            chr(ord("A") + col),
            font=coord_font,
            fill=(154, 164, 160),
        )


def _draw_draughts(draw: Any, state: GameState, box: tuple[int, int, int, int]) -> None:
    x0, y0, x1, y1 = box
    cell = (x1 - x0) // 8
    number_font = load_font(11, bold=True)
    king_font = load_font(max(16, int(cell * 0.26)), bold=True)
    light = (222, 205, 172)
    dark = (105, 72, 50)
    square_number = 1
    for row in range(8):
        for col in range(8):
            x = x0 + col * cell
            y = y0 + row * cell
            playable = (row + col) % 2 == 1
            draw.rectangle((x, y, x + cell, y + cell), fill=dark if playable else light)
            if not playable:
                continue
            draw.text((x + 5, y + 4), str(square_number), font=number_font, fill=(211, 187, 154))
            value = state.board[row][col]
            if value:
                margin = cell * 0.14
                is_black = value in (1, 3)
                is_king = value in (3, 4)
                fill = (34, 38, 37) if is_black else (232, 226, 207)
                outline = (7, 10, 9) if is_black else (104, 94, 77)
                draw.ellipse(
                    (x + margin, y + margin, x + cell - margin, y + cell - margin),
                    fill=fill,
                    outline=outline,
                    width=3,
                )
                draw.ellipse(
                    (x + margin + 5, y + margin + 5, x + cell - margin - 5, y + cell - margin - 5),
                    outline=(215, 77, 57) if is_king else outline,
                    width=2,
                )
                if is_king:
                    label_fill = (246, 233, 211) if is_black else (76, 58, 43)
                    bbox = draw.textbbox((0, 0), "K", font=king_font)
                    draw.text(
                        (
                            x + cell / 2 - (bbox[2] - bbox[0]) / 2,
                            y + cell / 2 - (bbox[3] - bbox[1]) / 2 - 2,
                        ),
                        "K",
                        font=king_font,
                        fill=label_fill,
                    )
            if state.last_point == (col, row):
                draw.rectangle(
                    (x + 3, y + 3, x + cell - 3, y + cell - 3),
                    outline=(250, 190, 61),
                    width=5,
                )
            square_number += 1
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
    draw.rounded_rectangle(
        (x0, y0, x1, y1),
        radius=8,
        fill=(194, 145, 83),
        outline=(93, 61, 33),
        width=3,
    )
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
            draw.ellipse(
                (cx - radius, cy - radius, cx + radius, cy + radius),
                fill=fill,
                outline=outline,
                width=2,
            )
    if state.last_point is not None:
        col, row = state.last_point
        cx, cy = left + col * cell, top + row * cell
        ring = radius + 4
        draw.ellipse((cx - ring, cy - ring, cx + ring, cy + ring), outline=(244, 145, 43), width=4)


BOARD_DRAWERS = {
    "chess": _draw_chess,
    "reversi": _draw_reversi,
    "go": _draw_go,
    "draughts": _draw_draughts,
}


def draw_frame(
    manifest: dict[str, Any],
    state: GameState,
    total_moves: int,
    *,
    is_final: bool = False,
):
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
    game_type = str(manifest["gameType"])
    board_drawer = BOARD_DRAWERS.get(game_type)
    if board_drawer is None:
        raise GameRecordError(f"Unsupported game type for frame drawing: {game_type}")
    board_drawer(draw, state, board_box)

    panel = (710, 36, width - 40, 682)
    _rounded_panel(draw, panel, (238, 235, 224), (92, 99, 96))
    kicker_font = load_font(17, bold=True)
    title_font = load_font(34, bold=True)
    body_font = load_font(21)
    body_bold = load_font(22, bold=True)
    small_font = load_font(16)
    draw.text((744, 70), "VERIFIED GAME RECORD", font=kicker_font, fill=(176, 57, 43))
    y = _draw_wrapped(
        draw,
        localized(manifest["title"], "en"),
        (744, 108),
        title_font,
        (24, 31, 34),
        430,
        8,
    )

    y += 24
    for player in manifest["players"]:
        side = str(player["side"]).upper()
        draw.text((744, y), side, font=small_font, fill=(97, 105, 104))
        draw.text(
            (850, y - 4),
            localized(player["name"], "en"),
            font=body_bold,
            fill=(25, 33, 35),
        )
        y += 38

    y += 16
    draw.line((744, y, 1168, y), fill=(177, 180, 173), width=2)
    y += 24
    if is_final:
        move_heading = "FINAL POSITION"
    else:
        move_heading = "START" if state.move_number == 0 else f"MOVE {state.move_number:03d} / {total_moves:03d}"
    draw.text((744, y), move_heading, font=kicker_font, fill=(176, 57, 43))
    y += 34
    move_text = "GAME COMPLETE" if is_final else (
        state.move_label if not state.side_label else f"{state.side_label}: {state.move_label}"
    )
    draw.text((744, y), move_text, font=body_bold, fill=(25, 33, 35))
    y += 42
    if state.score_label:
        draw.text((744, y), state.score_label, font=body_font, fill=(55, 67, 69))
        y += 40

    if is_final:
        y += 8
    else:
        progress = state.move_number / max(1, total_moves)
        draw.rounded_rectangle((744, y, 1168, y + 12), radius=6, fill=(195, 198, 190))
        draw.rounded_rectangle(
            (744, y, 744 + int(424 * progress), y + 12),
            radius=6,
            fill=(214, 77, 57),
        )
        y += 42

    result_y = max(y, 474 if is_final else 510)
    if is_final:
        draw.rounded_rectangle(
            (744, result_y, 1168, 624),
            radius=8,
            fill=(249, 224, 216),
            outline=(214, 77, 57),
            width=2,
        )
        draw.text((766, result_y + 18), "RESULT", font=small_font, fill=(176, 57, 43))
        result_bottom = _draw_wrapped(
            draw,
            localized(manifest["result"], "en"),
            (766, result_y + 47),
            body_bold,
            (25, 33, 35),
            380,
            5,
        )
        draw.text(
            (766, min(result_bottom + 10, 596)),
            "Replay starts again in a moment",
            font=small_font,
            fill=(97, 75, 69),
        )
    else:
        draw.text((744, result_y), "RESULT", font=small_font, fill=(97, 105, 104))
        _draw_wrapped(
            draw,
            localized(manifest["result"], "en"),
            (744, result_y + 28),
            body_font,
            (25, 33, 35),
            425,
            6,
        )

    source_count = int(manifest["verification"]["matchedRecordSources"])
    draw.text(
        (744, 642),
        f"{source_count} RECORD SOURCES MATCHED  |  ORIGINAL BOARD REDRAW",
        font=small_font,
        fill=(89, 96, 94),
    )
    return image
