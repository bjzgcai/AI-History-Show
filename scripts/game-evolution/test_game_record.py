#!/usr/bin/env python3
"""Focused parser tests for the game-evolution renderer."""

from __future__ import annotations

import importlib.util
import sys
import tempfile
from pathlib import Path


SCRIPT = Path(__file__).with_name("render_game_record.py")
SPEC = importlib.util.spec_from_file_location("render_game_record", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def temporary_file(suffix: str, content: str) -> Path:
    handle = tempfile.NamedTemporaryFile("w", suffix=suffix, encoding="utf-8", delete=False)
    with handle:
        handle.write(content)
    return Path(handle.name)


def test_sgf_main_variation_continues_after_branch() -> None:
    path = temporary_file(".sgf", "(;GM[1]FF[4]SZ[9];B[aa];W[bb](;B[cc];W[dd])(;B[ee]))")
    parsed = MODULE.parse_go(path)
    assert parsed.canonical_moves == ["b:8,0", "w:7,1", "b:6,2", "w:5,3"]


def test_reversi_full_record() -> None:
    path = MODULE.ROOT / "archive/events/1997-logistello/game-records/logistello-murakami-1997-game-1.moves"
    parsed = MODULE.parse_reversi(path)
    assert len(parsed.canonical_moves) == 60
    assert parsed.states[-1].score_label == "Black 16 | White 48"


def test_explicit_opening_highlight_and_result_holds() -> None:
    manifest = {
        "render": {
            "durationSeconds": 10,
            "openingHoldSeconds": 1.5,
            "endHoldSeconds": 3.5,
            "highlights": [{"move": 2, "holdSeconds": 2}],
        }
    }
    durations = MODULE.frame_durations(manifest, 5)
    assert durations == [1.5, 1.5, 2.0, 1.5, 3.5]
    assert sum(durations) == 10


def main() -> None:
    test_sgf_main_variation_continues_after_branch()
    test_reversi_full_record()
    test_explicit_opening_highlight_and_result_holds()
    print("PASS game-record parsing and explicit replay pacing")


if __name__ == "__main__":
    main()
