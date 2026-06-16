# Game Evolution Video Clips

Use `scripts/sgf_to_video.py` to turn a Go SGF main line into a fast board-evolution clip for the AI history exhibition.

Minimum MP4 example:

```bash
python scripts/sgf_to_video.py examples/sgf/sample-go-game.sgf resources/videos/game-evolution/sample-go-game.mp4 --duration 60 --fps 30 --title "Sample Go evolution"
```

The script creates the output directory if needed, parses board size and B/W moves from SGF, applies captures, draws each board state, samples the sequence across the requested duration, and writes a high-fps video.

Dependencies:

```bash
python -m pip install -r requirements-game-video.txt
```

Quick check without a video encoder:

```bash
python scripts/sgf_to_video.py examples/sgf/sample-go-game.sgf resources/videos/game-evolution/sample-go-game.gif --duration 6 --fps 8
```

The AlphaGo game pages at `https://www.alphago-games.com/` are useful references for move-by-move interaction and SGF-style game playback, but local exhibition clips should be generated from SGF files stored in the project or curated source archives.
