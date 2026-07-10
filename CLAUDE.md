# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Install dependencies: `npm ci` (Node.js >= 22; CI currently uses Node 22/24).
- Preview the static exhibition: `npm run start:static` then open `http://localhost:8000`.
- Fixed local demo server: `npm run start:demo` (binds `127.0.0.1:8000`).
- Run the local admin/content editor: `npm run start:admin` then open `http://localhost:3001/admin`.
- Regenerate exhibition data after content edits: `npm run generate`.
- Lint: `npm run lint`.
- Format check: `npm run format:check`; apply formatting with `npm run format`.
- Test all current JS checks: `npm test`.
- Run a single current test script: `node scripts/test-layout-router.js` or `node scripts/test-swipe-navigation.js`.
- Full quality gate: `npm run quality` (lint + format check + tests).
- Startup/deployment validation: `npm run validate:startup` or `npm run validate:deployment`.
- Archive workflow: `npm run validate:archive`, `npm run build:archive`, `npm run generate`, `npm run review:archive`, `npm run diff:archive`.
- Archive migration/reporting: `npm run migrate:archive` (default AI100; use `node scripts/migrate-archive-events.js --mode=core|gaming|all` for other groups), `npm run report:assets`, `npm run map:archive-fusions`.
- AI100 content validation/audit: `npm run validate:ai100-context`, `npm run validate:ai100-quizzes`, `npm run audit:ai100-accuracy`.
- Container preview: `docker build -t ai-history-show .` then `docker run --rm -p 8000:8000 ai-history-show`.
- Docker Compose presentation: `docker compose up --build presentation`; include admin with `docker compose --profile admin up --build`.

## Architecture

This is a no-build-tool exhibition app: the frontend is static HTML/CSS/vanilla JS, with Three.js loaded from a CDN. Node.js is used for content generation, local static/admin servers, validation scripts, and Docker build stages.

### Runtime entries

- `index.html` is the adaptive single/mobile entry. It can switch to the dual layout based on viewport or be forced with `?layout=single` / `?layout=dual`. It also contains the storyline selector and rich single-screen/branch/AI100 rendering logic.
- `dual-screen.html` is the fixed two-horizontal-screen entry for exhibition use.
- Both entries load `shared/layout-router.js`, `shared/i18n.js`, `milestones-data.js` with fallback to `milestones-data-default.js`, `shared/milestone-view.js`, `shared/swipe-navigation.js`, and Three.js.
- `shared/layout-router.js` is UMD-style and is tested directly from Node. It decides single vs dual mode using viewport width/ratio, handheld pointer detection, and explicit URL overrides.
- `shared/i18n.js` owns the bilingual dictionary, `{ zh, en }` value selection, language toggle, and `localStorage` key `ai-history-locale`.
- `shared/milestone-view.js` normalizes generated milestone records into the view model used by both entries: localized text, photos, videos, quotes, figures, commentary sections, quizzes, and timeline items.
- `shared/swipe-navigation.js` implements touch/pen/emulated-touch swipe navigation and exports helpers for Node tests.

### Content data flow

Do not hand-edit generated data files. Source content is assembled like this:

```text
manage/catalog.js
manage/events.js
manage/ai100-extra-events.js
manage/gaming-extra-events.js
manage/quizzes.js
manage/figure-avatars.js
manage/event-fusions.js
resources/videos/{key}.json
resources/quote-candidates.js
resources/research-candidates.js
        │
        ▼
node manage/generate.js
        │
        ├── applies archive overlays from archive/ when enabled
        │   (default presentationMode: preserve-legacy)
        ▼
milestones-data.js + milestones-data-default.js
        │
        ▼
index.html / dual-screen.html
```

- `manage/catalog.js` controls categories, branches/storylines, event order, and story identifiers.
- `manage/events.js` and the extra event files hold event content. Most user-visible text should be bilingual `{ zh, en }`; plain strings are treated as Chinese and fall back through the i18n helpers.
- `manage/event-fusions.js` merges deep-learning timeline records with overlapping BenchCouncil AI100 records so shared events present consistently across storylines.
- `manage/generate.js` enriches events with videos, avatar registry entries, quotes, quizzes, commentary, branch/game-evolution metadata, applies archive overlays, and writes both generated data files.
- Archive overlays currently cover all current generated display targets while preserving legacy presentation by default. `presentationMode: "preserve-legacy"` attaches archive metadata without replacing title, description, images, sources, visual modules, commentary, analysis, or quizzes. Use `presentationMode: "archive"` only for intentional presentation changes, and verify with `npm run diff:archive`.
- `milestones-data.js` and `milestones-data-default.js` are generated outputs. Regenerate them with `npm run generate` after source content changes.

### Content management server

- `manage/server.js` serves `manage/admin.html` at `/admin`, `manage/archive-admin.html` at `/archive-admin`, static assets, and JSON APIs for editing, archive JSON files, validation, and generation.
- Important endpoints include `GET /api/generate/diff`, `POST /api/generate`, and `POST /api/events`.
- The admin server has no authentication and is intended for local/protected use only; do not expose port 3001 publicly.
- Server writes create backups in `manage/.backups/` and may sync YouTube/video metadata into `resources/videos/{key}.json` before saving events.

### Storylines and layouts

- Main generated storylines currently include core AI history, BenchCouncil AI100 achievements, and the gaming AI branch.
- Direct storyline URLs use `?storyline=bench-council-ai100` or `?storyline=gaming-ai`.
- Branch/generated milestone IDs use the `milestone-{key}` convention; catalog branch records may prefix keys for branch-specific milestones.
- The gaming branch can render SGF/game-evolution modules; related tooling lives in `scripts/sgf_to_video.py`, `scripts/README-game-evolution-video.md`, `examples/sgf/`, and `resources/videos/game-evolution/`.

### AI100 content expectations from existing project guidance

When adding or heavily editing BenchCouncil AI100 achievements:

- Provide a top visual trio: `images[0]` person/team/institution image with complete `imageMeta`, `images[1]` achievement visualization/architecture/explainer, and `achievement.visualModules[0]` as an `archiveLink` card with localized fields.
- Avoid generic demos: `achievement.visual` should map to a non-generic renderer or use a `buildImagePaperDemo` / `buildPaperDemo` style layout.
- `commentarySections` should include at least `Historical Background`, `Core Idea`, and `Long-Term Legacy`, with meaningful English and Chinese text.
- Add at least three real `achievement.sources`, including the primary paper/original source where applicable.
- Add a matching quiz in `manage/quizzes.js`.
- Localize all visible fields (`title`, `description`, `location`, `figures`, `commentarySections`, `achievement`, `imageMeta`, `visualModules`, `sources`, `quizzes`). Chinese UI fields should not contain untranslated English UI phrases except proper nouns/acronyms.
- After changes, run `npm run generate`, `npm run lint`, `npm test`, and the AI100 validators when relevant.

### Deployment and CI

- `.github/workflows/quality.yml` runs `npm ci` and `npm run quality` on push/PR.
- `.github/workflows/deployment.yml` runs `npm run validate:deployment`, builds the Docker image, smoke-tests the container, and validates Compose config.
- `.github/workflows/pages.yml` deploys the repository root to GitHub Pages from `main`.
- `Dockerfile` has a build stage that runs `npm run generate`, an `admin` Node stage, and a `presentation` Nginx stage that serves the static exhibit on port 8000.
- `DEPLOYMENT.md` contains detailed Nginx, PM2, SSH-tunnel, kiosk, and multi-display instructions.

## Repository-specific cautions

- Treat `resources/` as append-only per existing project guidance; do not delete existing images/video metadata unless explicitly requested.
- Coordinates `[0, 0]` are invalid placeholders for globe navigation.
- The globe camera flies around the Earth (`camCurrent` / `camTarget`); the globe itself does not rotate. Coordinate conversion uses `phi = (90 - lat) * Math.PI / 180` and `theta = -lng * Math.PI / 180`.
- The frontend falls back to `milestones-data-default.js` if `milestones-data.js` fails to load.
