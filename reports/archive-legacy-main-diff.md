# Archive-native vs Legacy Main Exhibit Diff

Generated: 2026-07-17T11:35:30.351Z

This report compares fresh outputs from the legacy-compatible generator and the direct archive-native generator as consumed by `index.html`.

## Summary

- Legacy milestones: 146
- Archive-native milestones: 146
- Missing archive ids: 0
- Extra archive ids: 0
- Storyline membership and order identical: yes
- English shared view-model changed milestones: 4
- Chinese shared view-model changed milestones: 6
- Visual-module changed milestones: 10
- Commentary changed milestones: 6

## Visible semantic field counts

| Field | English changes | Chinese changes |
|---|---:|---:|
| title | 0 | 0 |
| subtitle | 0 | 0 |
| description | 0 | 0 |
| category | 0 | 0 |
| figures | 0 | 0 |
| quote | 0 | 0 |
| sources | 0 | 0 |
| commentary | 4 | 6 |
| quizzes | 0 | 0 |

## Other rendered structures

- Images changed: 0
- Photos changed: 0
- Videos changed: 0
- Top-level video URL changed: 0
- Visual renderer changed: 0
- Analysis changed: 0
- Achievement auxiliary fields changed: 0
- Legacy paper-list changed: 0

The seven `sources` differences come from legacy `papers[]` cards that are absent in archive-native output. Remote paper URLs are still present in `achievement.sources`, but five local PDF links are no longer rendered.
## Visual-module differences

The remaining module differences are gaming replay URLs: legacy points at planned but absent event MP4 files, while archive-native points at the existing fallback GIF.

- `milestone-gaming-ai-1951-strachey-draughts`
  - module 1 `url`: `resources/videos/game-evolution/1951-strachey-draughts.mp4` → `resources/videos/game-evolution/sample-go-game.gif`
- `milestone-gaming-ai-1988-td-update`
  - module 1 `url`: `resources/videos/game-evolution/1988-td-update.mp4` → `resources/videos/game-evolution/sample-go-game.gif`
- `milestone-gaming-ai-1994-chinook`
  - module 1 `url`: `resources/videos/game-evolution/1994-chinook.mp4` → `resources/videos/game-evolution/sample-go-game.gif`
- `milestone-gaming-ai-1997-deep-blue`
  - module 1 `url`: `resources/videos/game-evolution/1997-deep-blue.mp4` → `resources/videos/game-evolution/sample-go-game.gif`
- `milestone-gaming-ai-2013-dqn`
  - module 1 `url`: `resources/videos/game-evolution/2013-dqn.mp4` → `resources/videos/game-evolution/sample-go-game.gif`
- `milestone-gaming-ai-2016-alphago`
  - module 1 `url`: `resources/videos/game-evolution/2016-alphago.mp4` → `resources/videos/game-evolution/sample-go-game.gif`
- `milestone-gaming-ai-2017-alphazero`
  - module 1 `url`: `resources/videos/game-evolution/2017-alphazero.mp4` → `resources/videos/game-evolution/sample-go-game.gif`
- `milestone-gaming-ai-2017-libratus`
  - module 1 `url`: `resources/videos/game-evolution/2017-libratus.mp4` → `resources/videos/game-evolution/sample-go-game.gif`
- `milestone-gaming-ai-2019-pluribus`
  - module 1 `url`: `resources/videos/game-evolution/2019-pluribus.mp4` → `resources/videos/game-evolution/sample-go-game.gif`
- `milestone-gaming-ai-2019-muzero`
  - module 1 `url`: `resources/videos/game-evolution/2019-muzero.mp4` → `resources/videos/game-evolution/sample-go-game.gif`

## Commentary differences

Archive-native commentary carries source bindings and, for the listed records, uses curated archive core-idea wording instead of the legacy generator suffix.

- `milestone-1958-wangs-algorithm`
- `milestone-1960-davis-putnam-dpll`
- `milestone-ai100-2012-alexnet`
- `milestone-ai100-2017-transformer`
- `milestone-2014-adam`
- `milestone-1975-genetic-algorithm`

## Structural metadata differences

| Field | Legacy records | Archive-native records |
|---|---:|---:|
| archive | 146 | 146 |
| archiveEventId | 146 | 146 |
| archiveVariantId | 146 | 146 |
| archivePresentationMode | 146 | 146 |
| sourceKind | 146 | 146 |
| storyline | 125 | 146 |
| branch | 25 | 12 |
| fusionCanonical | 24 | 0 |
| order | 0 | 146 |
| date | 0 | 146 |
| papers | 8 | 8 |
| quiz | 113 | 0 |

Notable interpretation:

- Archive-native explicitly assigns all 21 core milestones to `deep-learning`; legacy relies on the frontend fallback when `storyline` is absent. The resulting storyline membership and chronological order are identical.
- Archive-native adds `order` and `date` to all records and removes legacy-only helper fields such as `branch`, `fusionCanonical`, `papers`, and singular `quiz`.
- Archive-native omits legacy `papers[]`. Seven gaming records lose paper-list metadata; five of those records lose a rendered local PDF card, while equivalent remote sources remain available. Quiz rendering remains unchanged through `quizzes`.
- Provenance changes from `sourceKind: archive+legacy` to `sourceKind: archive-preview`.
