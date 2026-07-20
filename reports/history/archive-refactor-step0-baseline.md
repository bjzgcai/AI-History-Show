# Archive Refactor Step 0 Baseline

Date: 2026-07-08

This report records the baseline before introducing the file-based `archive/` architecture described in `docs/archive-architecture-refactor.md`.

## Scope Boundary

- `milestones-data.js` and `milestones-data-default.js` remain generated files.
- Manual content edits should continue to target legacy source files until the archive pipeline is introduced.
- Step 0 does not change frontend runtime entries (`index.html`, `dual-screen.html`) or data generation behavior.
- The first archive migration should keep current static presentation, admin startup, Docker presentation, and generated data compatibility intact.

## Baseline Commands

### Initial run

Command:

```bash
npm run generate && npm test && npm run lint && npm run validate:startup
```

Result: failed at `npm run lint` because dependencies were not installed in the working tree.

Successful portions before failure:

- `npm run generate`: passed; generated data content was unchanged.
  - 5 categories
  - 1 branch
  - 134 events total
- `npm test`: passed.
  - `scripts/test-layout-router.js`: passed.
  - `scripts/test-swipe-navigation.js`: passed.

Failure:

```text
> ai-history-show@0.1.0 lint
> eslint .

sh: eslint: command not found
```

### Dependency install and rerun

Command:

```bash
npm ci && npm run lint && npm run validate:startup
```

Result: passed.

Notes:

- `npm ci` installed 87 packages.
- `npm ci` reported 1 moderate severity vulnerability via npm audit output. No dependency change was made beyond lockfile install behavior.
- `npm run lint`: passed.
- `npm run validate:startup`: passed.
  - Static presentation startup validation passed on `127.0.0.1:18080`.
  - Admin server startup validation passed on `127.0.0.1:13001`.

## Representative Entry URL Checks

A temporary static server was started on `127.0.0.1:18081`.

Checked URLs:

| URL | Result |
| --- | --- |
| `http://127.0.0.1:18081/` | 200 OK |
| `http://127.0.0.1:18081/index.html?storyline=bench-council-ai100` | 200 OK |
| `http://127.0.0.1:18081/index.html?storyline=gaming-ai` | 200 OK |
| `http://127.0.0.1:18081/dual-screen.html` | 200 OK |

These checks only verify that the entry HTML routes are served successfully. They do not perform browser-level rendering or interaction validation.

## Current Storyline / Catalog Baseline

From `manage/catalog.js`:

| Catalog section | Storyline id | Events |
| --- | --- | ---: |
| Genesis of AI | default / core history | 3 |
| Neural Networks and Connectionism | default / core history | 4 |
| Deep Learning and Unified Paradigms | default / core history | 7 |
| Large Models and Scientific Intelligence | default / core history | 7 |
| AI Top 100 Achievements | `bench-council-ai100` | 100 |
| AI in Board & Tabletop Games | `gaming-ai` | 13 |

Generated total from `npm run generate`: 134 events.

## Legacy Source Inventory

Current legacy content/data source files and approximate file sizes:

| Source | Size / Count |
| --- | ---: |
| `manage/events.js` | 649,971 bytes |
| `manage/ai100-extra-events.js` | 265,304 bytes |
| `manage/gaming-extra-events.js` | 63,462 bytes |
| `manage/catalog.js` | 6,141 bytes |
| `manage/quizzes.js` | 113,475 bytes |
| `manage/figure-avatars.js` | 13,025 bytes |
| `manage/event-fusions.js` | 22,274 bytes |
| `manage/event-fusion-assets.js` | 7,355 bytes |
| `resources/quote-candidates.js` | 21,606 bytes |
| `resources/research-candidates.js` | 48,356 bytes |
| `resources/videos/*.json` | 21 files |

These files remain the active source of truth until corresponding content is migrated into `archive/` and the compatibility generator is introduced.

## Working Tree Notes

At the time of this baseline, untracked files related to documentation/setup exist:

```text
?? CLAUDE.md
?? docs/archive-architecture-refactor.md
?? reports/archive-refactor-step0-baseline.md
```

`node_modules/` was installed by `npm ci` and is ignored by git.

## Step 0 Outcome

Step 0 baseline is established.

Before Step 1 starts, the current baseline expectation is:

```bash
npm run generate
npm test
npm run lint
npm run validate:startup
```

should pass after dependencies are installed with:

```bash
npm ci
```
