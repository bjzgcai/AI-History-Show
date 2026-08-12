#!/usr/bin/env python3
"""Reparse one Archive game record with the production parser."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from game_record_core import GameRecordError, parse_record, read_json


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", help="path to one game-record.json manifest")
    args = parser.parse_args()
    manifest_path = Path(args.manifest).resolve()

    try:
        manifest = read_json(manifest_path)
        parsed = parse_record(manifest_path, manifest)
    except (GameRecordError, OSError, KeyError, TypeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(
        json.dumps(
            {
                "id": manifest["id"],
                "moveCount": len(parsed.canonical_moves),
                "mainLineSha256": parsed.digest,
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
