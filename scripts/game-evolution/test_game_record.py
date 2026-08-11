#!/usr/bin/env python3
"""Focused parser tests for the game-evolution renderer."""

from __future__ import annotations

import tempfile
from pathlib import Path


from game_record_core import ROOT, frame_durations, parse_draughts, parse_go, parse_reversi


def test_sgf_main_variation_continues_after_branch() -> None:
    with tempfile.TemporaryDirectory(prefix="game-record-test-") as temp_name:
        path = Path(temp_name) / "branched.sgf"
        path.write_text("(;GM[1]FF[4]SZ[9];B[aa];W[bb](;B[cc];W[dd])(;B[ee]))", encoding="utf-8")
        parsed = parse_go(path)
    assert parsed.canonical_moves == ["b:8,0", "w:7,1", "b:6,2", "w:5,3"]


def test_reversi_full_record() -> None:
    path = ROOT / "archive/events/1997-logistello/game-records/logistello-murakami-1997-game-1.moves"
    parsed = parse_reversi(path)
    assert len(parsed.canonical_moves) == 60
    assert parsed.states[-1].score_label == "Black 16 | White 48"


def test_draughts_full_record() -> None:
    path = ROOT / "archive/events/1994-chinook/game-records/chinook-tinsley-boston-1994-game-2.pdn"
    parsed = parse_draughts(path)
    assert len(parsed.canonical_moves) == 96
    assert parsed.digest == "e5c5994d5b0964321c5a88e0890cb2d19043bcc83e3c83ecc3ca0985eac3adde"


def test_explicit_opening_highlight_and_result_holds() -> None:
    manifest = {
        "render": {
            "durationSeconds": 10,
            "openingHoldSeconds": 1.5,
            "endHoldSeconds": 3.5,
            "highlights": [{"move": 2, "holdSeconds": 2}],
        }
    }
    durations = frame_durations(manifest, 5)
    assert durations == [1.5, 1.5, 2.0, 1.5, 3.5]
    assert sum(durations) == 10


def main() -> None:
    test_sgf_main_variation_continues_after_branch()
    test_reversi_full_record()
    test_draughts_full_record()
    test_explicit_opening_highlight_and_result_holds()
    print("PASS game-record parsing and explicit replay pacing")


if __name__ == "__main__":
    main()
