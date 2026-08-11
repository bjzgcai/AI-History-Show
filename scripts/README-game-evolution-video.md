# Game Evolution Video Clips

Game-evolution clips are independent visual modules, not general event narration videos. The static site lazily loads the generated MP4 only when a module is shown or opened.

## Authoritative inputs

Each curated sample lives under `archive/events/<event-id>/game-records/`:

- the PGN, SGF, or Reversi move file contains the playable main line;
- `game-record.json` records source URLs, verification notes, the raw-file SHA-256, the normalized main-line SHA-256, render settings, and Archive asset IDs;
- at least two distinct record sources must agree on the normalized main line;
- videos and posters are original board redraws. Broadcast footage, website screenshots, and publisher figures are not copied.

Run the Archive-level checks with:

```bash
npm run validate:game-records
```

## Generate all clips

Create a virtual environment and install the optional offline tooling:

```bash
python3 -m venv .venv-game-video
.venv-game-video/bin/pip install -r requirements-game-video.txt
.venv-game-video/bin/python scripts/game-evolution/render_game_record.py
```

The renderer uses `python-chess`'s `chess` package for PGN, `sgfmill` for SGF first-main-variation selection, a rule-checked Reversi replay, Pillow for original frames, and ffmpeg for H.264/yuv420p/faststart MP4 output.

Validate the records and existing media without regenerating them:

```bash
.venv-game-video/bin/python scripts/game-evolution/render_game_record.py --check
.venv-game-video/bin/python scripts/game-evolution/test_game_record.py
```

The older `scripts/sgf_to_video.py` remains available for one-off square Go clips. It now also uses `sgfmill`, so annotated SGFs continue through the first main variation instead of stopping at the first branch.
