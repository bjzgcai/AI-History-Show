#!/usr/bin/env python3
"""Render verified Archive game records as original board-evolution MP4 files."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from game_record_core import GameRecordError, MANIFEST_GLOB, ROOT
from game_record_video import process_manifest


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "manifests",
        nargs="*",
        help="game-record.json paths; defaults to all Archive manifests",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="validate records and existing outputs without rendering",
    )
    return parser


def manifest_paths(arguments: list[str]) -> list[Path]:
    if arguments:
        return [Path(item).resolve() for item in arguments]
    return sorted(ROOT.glob(MANIFEST_GLOB))


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    paths = manifest_paths(args.manifests)
    if not paths:
        print("No game-record manifests found.", file=sys.stderr)
        return 1
    try:
        for path in paths:
            result = process_manifest(path, check_only=args.check)
            print(json.dumps(result, ensure_ascii=False))
    except (GameRecordError, OSError, KeyError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
